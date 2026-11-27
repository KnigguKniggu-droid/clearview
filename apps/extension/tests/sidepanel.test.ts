import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { scanDocument } from '@clearview/analyzer';
import type { AuditReport } from '@clearview/analyzer';
import { parseAuditExport } from '@clearview/reporting';
import { SidePanelApp } from '../src/sidepanel/SidePanelApp';
import type { GuardRequest, GuardResponse } from '../src/protocol';
let root: Root;
let report: AuditReport;
let sendMessage: ReturnType<typeof vi.fn>;
let failedApply = false;
let selectedMonthlyOptionIds: string[] = [];
let removedMonthlyOptionIds: string[] = [];
const response = (): GuardResponse => ({ ok: true, documentToken: 'document-1', reportId: 'report-1', url: 'https://example.test/checkout', title: 'Checkout', report, selectedMonthlyOptionIds, removedMonthlyOptionIds });
beforeEach(async () => {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const source = document.createElement('section');
  source.style.cssText = 'color:#111827;background:#fff;font-size:16px';
  source.innerHTML = '<label><input type="checkbox" checked> Monthly membership $29/mo</label><input placeholder="Account number">';
  document.body.append(source);
  report = scanDocument(source);
  source.remove();
  failedApply = false;
  selectedMonthlyOptionIds = [];
  removedMonthlyOptionIds = [];
  sendMessage = vi.fn(async (_id: number, message: GuardRequest): Promise<GuardResponse> => failedApply && message.action === 'apply' ? { ok: false, code: 'STALE_REPORT', error: 'The page changed after this review. Scan page again.' } : response());
  const event = () => ({ addListener: vi.fn(), removeListener: vi.fn() });
  vi.stubGlobal('chrome', { tabs: { query: vi.fn(async () => [{ id: 1, url: 'https://example.test/checkout', title: 'Checkout' }]), sendMessage, onActivated: event(), onUpdated: event(), onRemoved: event() }, scripting: { executeScript: vi.fn(async () => []) } });
  const container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  await act(async () => { root.render(createElement(SidePanelApp)); });
  await click('.scan-button');
});
afterEach(async () => { await act(async () => { root.unmount(); }); document.body.innerHTML = ''; vi.unstubAllGlobals(); vi.restoreAllMocks(); });
async function click(selector: string) { await act(async () => { (document.querySelector(selector) as HTMLElement).click(); }); }

it('defaults optional subscription changes off and applies only selected repair ids', async () => {
  expect(document.querySelector<HTMLInputElement>('[data-rule="DP-001"] input')!.checked).toBe(false);
  expect(document.querySelector<HTMLInputElement>('[data-rule="WCAG-3.3.2"] input')!.checked).toBe(true);
  await click('.safe-button');
  const message = sendMessage.mock.calls.at(-1)![1] as GuardRequest;
  expect(message.action).toBe('apply');
  expect(message.reportId).toBe('report-1');
  expect(message.findingIds).toEqual(report.findings.filter(item => item.isAutoRepairable && item.ruleId !== 'DP-001').map(item => item.id));
});

it('includes an optional selection only after an explicit checkbox choice', async () => {
  await click('[data-rule="DP-001"] input');
  await click('.safe-button');
  const message = sendMessage.mock.calls.at(-1)![1] as GuardRequest;
  expect(message.findingIds).toContain(report.findings.find(item => item.ruleId === 'DP-001')!.id);
});

it('blocks a stale Apply until the user rescans and reviews the refreshed selection', async () => {
  failedApply = true;
  await click('.safe-button');
  expect(document.querySelector('.error')!.textContent).toContain('page changed');
  expect(document.querySelector<HTMLButtonElement>('.safe-button')!.disabled).toBe(true);
  expect(document.querySelector('.scan-button')!.textContent).toContain('Rescan changed page');
  failedApply = false;
  await click('.scan-button');
  expect(document.querySelector<HTMLButtonElement>('.safe-button')!.disabled).toBe(false);
  expect(document.querySelector<HTMLInputElement>('[data-rule="DP-001"] input')!.checked).toBe(false);
});

it('downloads the actual report in the validated local import format', async () => {
  let saved: Blob | undefined;
  vi.stubGlobal('URL', class extends URL {
    static createObjectURL(blob: Blob) { saved = blob; return 'blob:local-report'; }
    static revokeObjectURL() {}
  });
  const download = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  await click('.export-button');
  expect(download).toHaveBeenCalledOnce();
  const text = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsText(saved!); });
  const imported = parseAuditExport(text);
  expect(imported.source.origin).toBe('https://example.test');
  expect(imported.source.kind).toBe('extension');
  expect(imported.report.summary.totalRecurringMonthly).toBe(29);
  expect(imported.report.findings).toEqual(report.findings);
});

it('shows the plain-language summary and keeps technical references collapsed', () => {
  expect(document.querySelector('h1')?.textContent).toBe('ClearView Assistant');
  expect(document.querySelector('#summary-title')?.textContent).toMatch(/potential money traps and \d+ accessibility barriers/);
  expect(document.querySelector('.safe-button')?.textContent).toBe('Protect Me & Fix This Page');
  const references = [...document.querySelectorAll<HTMLDetailsElement>('.technical-reference')];
  expect(references.length).toBeGreaterThan(0);
  expect(references.every(reference => !reference.open)).toBe(true);
  expect(references[0].querySelector('summary')?.textContent).toBe('Rule ID & WCAG Reference');
  expect(document.querySelector<HTMLDetailsElement>('.score-details')?.open).toBe(false);
});

it('focuses the actual change review from the summary action', async () => {
  const scroll = vi.fn();
  document.querySelector<HTMLElement>('#change-review')!.scrollIntoView = scroll;
  await click('.review-link');
  expect(document.activeElement?.id).toBe('change-review');
  expect(scroll).toHaveBeenCalledOnce();
});

it('shows selected and removed extra amounts only when the content response verifies their identities', async () => {
  expect(document.querySelector('.extra-summary')).toBeNull();
  const extra = report.financialCommitments.find(item => item.cadence === 'monthly')!;
  selectedMonthlyOptionIds = [extra.id];
  await click('.scan-button');
  expect(document.querySelector('.extra-summary')?.textContent).toContain('$29.00/month in currently selected extras');
  report = { ...report, safeModeActive: true, repairState: 'active', repairSummary: { applied: 1, nodes: 1, skipped: 0, conflicted: 0 }, financialCommitments: report.financialCommitments.map(item => item.id === extra.id ? { ...item, includedInTotals: false, isPreselected: false, exclusionReason: 'Option is not selected or is only suggested.' } : item), summary: { ...report.summary, totalRecurringMonthly: 0 } };
  selectedMonthlyOptionIds = [];
  await click('.scan-button');
  expect(document.querySelector('.extra-summary')).toBeNull();
  expect(document.querySelector('.receipt s')).toBeNull();
  removedMonthlyOptionIds = [extra.id];
  await click('.scan-button');
  expect(document.querySelector('#summary-title')?.textContent).toBe('Your selected changes are applied');
  expect(document.querySelector('.safe-button')?.textContent).toBe('Restore Original Page');
  expect(document.querySelector('.extra-summary')?.textContent).toContain('selected monthly extras removed from this page');
  expect(document.querySelector('.removed-extras s')?.textContent).toBe(extra.amountText);
  expect(document.querySelector('.removed-extras')?.closest('details')).toBeNull();
});
