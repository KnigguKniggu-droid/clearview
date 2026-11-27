import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isGuardRequest } from '../src/protocol';
import type { GuardRequest, GuardResponse } from '../src/protocol';

type Listener = (request: unknown, sender: { id: string }, callback: (response: GuardResponse) => void) => boolean;
let listener: Listener;
let registrations = 0;
const extensionId = 'clearview-unit-test';

beforeEach(async () => {
  vi.resetModules();
  document.body.innerHTML = '<label><input type="checkbox" checked> Monthly membership $29.99/mo</label><input placeholder="Account number"><div data-clickable>Continue</div>';
  document.body.style.cssText = 'color:#111827;background:#ffffff;font-size:16px';
  delete (window as Window & { __clearviewGuardInstalled?: boolean }).__clearviewGuardInstalled;
  registrations = 0;
  vi.stubGlobal('chrome', { runtime: { id: extensionId, onMessage: { addListener: (callback: Listener) => { listener = callback; registrations += 1; } } } });
  await import('../src/contentScript');
});

function request(message: GuardRequest): Promise<GuardResponse> {
  return new Promise(resolve => listener(message, { id: extensionId }, resolve));
}

describe('extension boundary', () => {
  it('rejects unexpected senders and malformed page commands', () => {
    const reply = vi.fn();
    expect(listener({ source: 'clearview-panel', action: 'scan' }, { id: 'other-extension' }, reply)).toBe(false);
    expect(listener({ source: 'site', action: 'apply' }, { id: extensionId }, reply)).toBe(false);
    expect(isGuardRequest({ source: 'clearview-panel', action: 'locate', documentToken: 'a', clearviewId: '[onclick]' })).toBe(false);
    expect(isGuardRequest({ source: 'clearview-panel', action: 'apply' })).toBe(false);
    expect(reply).not.toHaveBeenCalled();
  });

  it('does not register a duplicate content listener after repeat injection', async () => {
    vi.resetModules();
    await import('../src/contentScript');
    expect(registrations).toBe(1);
  });

  it('scans, repairs, and restores the same document through messages', async () => {
    const scan = await request({ source: 'clearview-panel', action: 'scan' });
    expect(scan.ok).toBe(true);
    if (!scan.ok) throw new Error(scan.error);
    expect(scan.report.summary.totalRecurringMonthly).toBe(29.99);
    const inputEvents = vi.fn();
    document.body.addEventListener('input', inputEvents, { once: true });
    const apply = await request({ source: 'clearview-panel', action: 'apply', documentToken: scan.documentToken, reportId: scan.reportId, findingIds: scan.report.findings.filter(item => item.isAutoRepairable).map(item => item.id) });
    expect(apply.ok).toBe(true);
    if (!apply.ok) throw new Error(apply.error);
    expect(apply.report.safeModeActive).toBe(true);
    expect(apply.report.summary.totalRecurringMonthly).toBe(0);
    expect(document.querySelector<HTMLInputElement>('input[type=checkbox]')!.checked).toBe(false);
    expect(document.querySelector('input[placeholder]')?.getAttribute('aria-label')).toBe('Account number');
    expect(inputEvents).toHaveBeenCalledOnce();
    const revert = await request({ source: 'clearview-panel', action: 'revert', documentToken: scan.documentToken });
    expect(revert.ok).toBe(true);
    if (!revert.ok) throw new Error(revert.error);
    expect(revert.report.safeModeActive).toBe(false);
    expect(revert.report.summary.totalRecurringMonthly).toBe(29.99);
    expect(document.querySelector('input[placeholder]')?.hasAttribute('aria-label')).toBe(false);
    expect(document.querySelectorAll('[data-clearview-badge]')).toHaveLength(0);
  });

  it('rejects stale document tokens before mutation', async () => {
    const result = await request({ source: 'clearview-panel', action: 'apply', documentToken: 'old-document', reportId: 'old-report', findingIds: [] });
    expect(result.ok).toBe(false);
    expect(document.querySelector<HTMLInputElement>('input[type=checkbox]')!.checked).toBe(true);
    expect(document.querySelectorAll('[data-clearview-badge]')).toHaveLength(0);
  });

  it('locates only an id from the current report', async () => {
    const scan = await request({ source: 'clearview-panel', action: 'scan' });
    if (!scan.ok) throw new Error(scan.error);
    const missing = await request({ source: 'clearview-panel', action: 'locate', documentToken: scan.documentToken, clearviewId: 'cv-999999' });
    expect(missing.ok).toBe(false);
    const id = scan.report.findings[0].clearviewId;
    const locate = await request({ source: 'clearview-panel', action: 'locate', documentToken: scan.documentToken, clearviewId: id });
    expect(locate.ok).toBe(true);
    expect((document.querySelector(`[data-clearview-id="${id}"]`) as HTMLElement).style.outline).toContain('3px');
  });

  it('reports a removed source instead of claiming it was highlighted', async () => {
    const scan = await request({ source: 'clearview-panel', action: 'scan' });
    if (!scan.ok) throw new Error(scan.error);
    const id = scan.report.findings[0].clearviewId;
    document.querySelector(`[data-clearview-id="${id}"]`)!.remove();
    const replacement = document.createElement('div');
    replacement.setAttribute('data-clearview-id', id);
    replacement.textContent = 'Unrelated replacement';
    document.body.prepend(replacement);
    const result = await request({ source: 'clearview-panel', action: 'locate', documentToken: scan.documentToken, clearviewId: id });
    expect(result).toEqual({ ok: false, error: 'That source element was removed from the page. Scan again.' });
    expect(replacement.style.outline).toBe('');
  });

  it('preserves intended add-ons when only accessibility changes are selected', async () => {
    const scan = await request({ source: 'clearview-panel', action: 'scan' });
    if (!scan.ok) throw new Error(scan.error);
    const findingIds = scan.report.findings.filter(item => item.isAutoRepairable && item.ruleId !== 'DP-001').map(item => item.id);
    const apply = await request({ source: 'clearview-panel', action: 'apply', documentToken: scan.documentToken, reportId: scan.reportId, findingIds });
    if (!apply.ok) throw new Error(apply.error);
    expect(document.querySelector<HTMLInputElement>('input[type=checkbox]')!.checked).toBe(true);
    expect(apply.report.summary.totalRecurringMonthly).toBe(29.99);
    expect(document.querySelector('input[placeholder]')?.getAttribute('aria-label')).toBe('Account number');
    expect(apply.operation?.action).toBe('apply');
  });

  it('rejects unreviewed page changes instead of silently expanding the repair set', async () => {
    const scan = await request({ source: 'clearview-panel', action: 'scan' });
    if (!scan.ok) throw new Error(scan.error);
    document.body.insertAdjacentHTML('beforeend', '<label><input type="checkbox" checked data-new-option> Monthly membership $99/mo</label>');
    const result = await request({ source: 'clearview-panel', action: 'apply', documentToken: scan.documentToken, reportId: scan.reportId, findingIds: scan.report.findings.filter(item => item.isAutoRepairable).map(item => item.id) });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected stale report rejection');
    expect(result.code).toBe('STALE_REPORT');
    expect(document.querySelector<HTMLInputElement>('[data-new-option]')!.checked).toBe(true);
    expect(document.querySelector('input[placeholder]')?.hasAttribute('aria-label')).toBe(false);
  });

  it('rejects an earlier review id after an explicit rescan', async () => {
    const scan = await request({ source: 'clearview-panel', action: 'scan' });
    if (!scan.ok) throw new Error(scan.error);
    await request({ source: 'clearview-panel', action: 'scan' });
    const result = await request({ source: 'clearview-panel', action: 'apply', documentToken: scan.documentToken, reportId: scan.reportId, findingIds: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('STALE_REPORT');
  });

  it('keeps Locate separate from a report refresh', async () => {
    const scan = await request({ source: 'clearview-panel', action: 'scan' });
    if (!scan.ok) throw new Error(scan.error);
    const result = await request({ source: 'clearview-panel', action: 'locate', documentToken: scan.documentToken, clearviewId: scan.report.findings[0].clearviewId });
    if (!result.ok) throw new Error(result.error);
    expect(result.reportId).toBe(scan.reportId);
    expect(result.report).toBe(scan.report);
  });

  it('expires detached repairs and permits a new reviewed change set', async () => {
    const scan = await request({ source: 'clearview-panel', action: 'scan' });
    if (!scan.ok) throw new Error(scan.error);
    await request({ source: 'clearview-panel', action: 'apply', documentToken: scan.documentToken, reportId: scan.reportId, findingIds: scan.report.findings.filter(item => item.isAutoRepairable).map(item => item.id) });
    document.body.innerHTML = '<input placeholder="New account field">';
    const current = await request({ source: 'clearview-panel', action: 'scan' });
    if (!current.ok) throw new Error(current.error);
    expect(current.report.safeModeActive).toBe(false);
    expect(current.report.repairState).toBe('expired');
    const apply = await request({ source: 'clearview-panel', action: 'apply', documentToken: current.documentToken, reportId: current.reportId, findingIds: current.report.findings.filter(item => item.isAutoRepairable).map(item => item.id) });
    if (!apply.ok) throw new Error(apply.error);
    expect(document.querySelector('input')?.getAttribute('aria-label')).toBe('New account field');
    expect(apply.report.repairState).toBe('active');
  });


  it('links selected monthly extras to their actual checkbox row and verifies only applied removals', async () => {
    document.body.insertAdjacentHTML('afterbegin', '<p>Base plan $55/mo</p>');
    const scan = await request({ source: 'clearview-panel', action: 'scan' });
    if (!scan.ok) throw new Error(scan.error);
    expect(scan.selectedMonthlyOptionIds).toHaveLength(1);
    const extra = scan.report.financialCommitments.find(item => item.id === scan.selectedMonthlyOptionIds[0])!;
    expect(extra.numericValue).toBe(29.99);
    const selected = scan.report.findings.filter(item => item.ruleId === 'DP-001').map(item => item.id);
    const apply = await request({ source: 'clearview-panel', action: 'apply', documentToken: scan.documentToken, reportId: scan.reportId, findingIds: selected });
    if (!apply.ok) throw new Error(apply.error);
    expect(apply.selectedMonthlyOptionIds).toEqual([]);
    expect(apply.removedMonthlyOptionIds).toEqual([extra.id]);
    expect(apply.report.summary.totalRecurringMonthly).toBe(55);
    const revert = await request({ source: 'clearview-panel', action: 'revert', documentToken: apply.documentToken });
    if (!revert.ok) throw new Error(revert.error);
    expect(revert.removedMonthlyOptionIds).toEqual([]);
    expect(revert.selectedMonthlyOptionIds).toEqual([extra.id]);
  });

  it('does not report removal when the host rejects the checkbox change', async () => {
    const checkbox = document.querySelector<HTMLInputElement>('input[type=checkbox]')!;
    checkbox.addEventListener('change', () => { checkbox.checked = true; });
    const scan = await request({ source: 'clearview-panel', action: 'scan' });
    if (!scan.ok) throw new Error(scan.error);
    const apply = await request({ source: 'clearview-panel', action: 'apply', documentToken: scan.documentToken, reportId: scan.reportId, findingIds: scan.report.findings.filter(item => item.ruleId === 'DP-001').map(item => item.id) });
    if (!apply.ok) throw new Error(apply.error);
    expect(checkbox.checked).toBe(true);
    expect(apply.removedMonthlyOptionIds).toEqual([]);
  });

  it('drops removal proof when the original price source changes after applying', async () => {
    const scan = await request({ source: 'clearview-panel', action: 'scan' });
    if (!scan.ok) throw new Error(scan.error);
    const apply = await request({ source: 'clearview-panel', action: 'apply', documentToken: scan.documentToken, reportId: scan.reportId, findingIds: scan.report.findings.filter(item => item.ruleId === 'DP-001').map(item => item.id) });
    if (!apply.ok) throw new Error(apply.error);
    expect(apply.removedMonthlyOptionIds).toHaveLength(1);
    const label = document.querySelector('label')!;
    label.lastChild!.textContent = ' Monthly membership $59.99/mo';
    const located = await request({ source: 'clearview-panel', action: 'locate', documentToken: apply.documentToken, clearviewId: apply.report.financialCommitments[0].clearviewId });
    if (!located.ok) throw new Error(located.error);
    expect(located.removedMonthlyOptionIds).toEqual([]);
    const current = await request({ source: 'clearview-panel', action: 'scan' });
    if (!current.ok) throw new Error(current.error);
    expect(current.removedMonthlyOptionIds).toEqual([]);
  });

});
