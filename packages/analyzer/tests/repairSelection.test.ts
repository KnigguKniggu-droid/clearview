import { afterEach, describe, expect, it, vi } from 'vitest';
import { applySafeMode, highlightElement, revertSafeMode, scanDocument } from '../src/index';
import type { RepairSnapshot } from '../src/types';

const roots: HTMLElement[] = [];
const snapshots: Array<{ root: HTMLElement; snapshot: RepairSnapshot }> = [];
function setup(html: string): HTMLElement {
  const root = document.createElement('section');
  root.innerHTML = html; document.body.append(root); roots.push(root); return root;
}
afterEach(() => {
  for (const { root, snapshot } of snapshots.splice(0)) revertSafeMode(root, snapshot);
  for (const root of roots.splice(0)) root.remove();
  vi.useRealTimers();
});

describe('reviewed repair selection and lifecycle', () => {
  it('changes only the selected finding and leaves intended add-ons and unselected fields intact', () => {
    const root = setup('<label><input type="checkbox" checked>Device protection $8/mo</label><label><input type="checkbox" checked>Membership $20/mo</label><input placeholder="Account">');
    const report = scanDocument(root);
    const chosen = report.findings.find(item => item.ruleId === 'DP-001')!;
    const snapshot = applySafeMode(root, report, { findingIds: [chosen.id] }); snapshots.push({ root, snapshot });
    const inputs = root.querySelectorAll('input');
    expect([inputs[0].checked, inputs[1].checked]).toEqual([false, true]);
    expect(inputs[2].hasAttribute('aria-label')).toBe(false);
    expect(snapshot.outcomes).toEqual([{ findingId: chosen.id, clearviewId: chosen.clearviewId, status: 'applied' }]);
    expect(scanDocument(root)).toMatchObject({ safeModeActive: true, repairState: 'active', repairSummary: { applied: 1, skipped: 0, conflicted: 0 } });
    revertSafeMode(root, snapshot);
    expect(inputs[0].checked).toBe(true);
    expect(scanDocument(root)).toMatchObject({ safeModeActive: false, repairState: 'inactive', repairSummary: { applied: 0, skipped: 0, conflicted: 0 } });
  });

  it('treats an empty selection as no mutation and rejects unknown IDs before mutation', () => {
    const root = setup('<input placeholder="Account">');
    const report = scanDocument(root);
    const before = root.innerHTML;
    expect(() => applySafeMode(root, report, { findingIds: ['invented'] })).toThrow('Select findings from the reviewed report.');
    expect(root.innerHTML).toBe(before);
    const snapshot = applySafeMode(root, report, { findingIds: [] }); snapshots.push({ root, snapshot });
    expect(snapshot.records).toEqual([]);
    expect(snapshot.outcomes).toEqual([]);
    expect(root.innerHTML).toBe(before);
    expect(scanDocument(root).repairState).toBe('inactive');
  });

  it('skips changed evidence and permits a fresh report after a no-op session', () => {
    const root = setup('<label><input type="checkbox" checked>Membership $20/month</label>');
    const report = scanDocument(root);
    root.querySelector('label')!.lastChild!.textContent = 'Membership $35/month';
    const stale = applySafeMode(root, report);
    expect(stale.outcomes[0]).toMatchObject({ status: 'skipped' });
    expect(root.querySelector('input')!.checked).toBe(true);
    const fresh = applySafeMode(root, scanDocument(root)); snapshots.push({ root, snapshot: fresh });
    expect(fresh.outcomes[0]).toMatchObject({ status: 'applied' });
    expect(root.querySelector('input')!.checked).toBe(false);
  });

  it('expires a detached repair session and applies a freshly reviewed replacement', () => {
    const root = setup('<input placeholder="Old account">');
    const old = applySafeMode(root, scanDocument(root));
    root.innerHTML = '<input placeholder="New account">';
    expect(scanDocument(root)).toMatchObject({ safeModeActive: false, repairState: 'expired', repairSummary: { applied: 1, skipped: 0, conflicted: 0 } });
    const fresh = applySafeMode(root, scanDocument(root)); snapshots.push({ root, snapshot: fresh });
    expect(fresh).not.toBe(old);
    expect(root.querySelector('input')!.getAttribute('aria-label')).toBe('New account');
    revertSafeMode(root, old);
    expect(scanDocument(root).safeModeActive).toBe(true);
  });

  it('reports partial success when one host checkbox rejects the change', () => {
    const root = setup('<label><input type="checkbox" checked>Protection $8/mo</label><label><input type="checkbox" checked>Membership $20/mo</label>');
    const rejected = root.querySelector('input')!;
    rejected.addEventListener('change', () => { rejected.checked = true; });
    const snapshot = applySafeMode(root, scanDocument(root)); snapshots.push({ root, snapshot });
    expect(snapshot.outcomes.map(item => item.status)).toEqual(['conflict', 'applied']);
    expect(scanDocument(root)).toMatchObject({ safeModeActive: true, repairState: 'partial', repairSummary: { applied: 1, skipped: 0, conflicted: 1 } });
    expect(root.querySelectorAll('[data-clearview-badge]')).toHaveLength(1);
  });

  it('detects an asynchronously rejected checkbox on rescan and removes its stale success badge', async () => {
    const root = setup('<label><input type="checkbox" checked>Membership $20/mo</label>');
    const input = root.querySelector('input')!;
    input.addEventListener('change', () => { queueMicrotask(() => { input.checked = true; }); });
    const snapshot = applySafeMode(root, scanDocument(root)); snapshots.push({ root, snapshot });
    await Promise.resolve();
    expect(scanDocument(root)).toMatchObject({ safeModeActive: false, repairState: 'expired' });
    expect(root.querySelector('[data-clearview-badge]')).toBeNull();
  });

  it('reports rollback conflicts while preserving a newer host attribute', () => {
    const root = setup('<input placeholder="Account"><input placeholder="Meter">');
    const snapshot = applySafeMode(root, scanDocument(root));
    const inputs = root.querySelectorAll('input');
    inputs[0].setAttribute('aria-label', 'Host verified account');
    revertSafeMode(root, snapshot);
    expect(inputs[0].getAttribute('aria-label')).toBe('Host verified account');
    expect(inputs[1].hasAttribute('aria-label')).toBe(false);
    expect(snapshot.revertOutcomes.map(item => item.status)).toEqual(['conflict', 'restored']);
  });

  it('counts repaired nodes once and keeps the session active during its own Locate pulse', () => {
    vi.useFakeTimers();
    const root = setup('<p style="color:#aaa;font-size:9px">Setup fee $10</p>');
    const report = scanDocument(root);
    const snapshot = applySafeMode(root, report); snapshots.push({ root, snapshot });
    expect(snapshot.outcomes.filter(item => item.status === 'applied').length).toBe(2);
    expect(scanDocument(root).repairSummary.nodes).toBe(1);
    highlightElement(root, report.findings[0].clearviewId);
    expect(scanDocument(root)).toMatchObject({ safeModeActive: true, repairState: 'active', repairSummary: { nodes: 1 } });
    vi.advanceTimersByTime(1499);
    expect(root.querySelector('p')!.style.outline).not.toBe('');
    vi.advanceTimersByTime(1);
    expect(root.querySelector('p')!.style.outline).toBe('');
  });

  it('includes repaired opacity ancestors in the live node count', () => {
    const root = setup('<div style="opacity:.8"><div style="opacity:.8"><p style="font-size:9px;color:#000">Setup fee $10</p></div></div>');
    const report = scanDocument(root);
    const chosen = report.findings.find(item => item.ruleId === 'DP-002')!;
    const snapshot = applySafeMode(root, report, { findingIds: [chosen.id] }); snapshots.push({ root, snapshot });
    expect(scanDocument(root)).toMatchObject({ repairSummary: { applied: 1, nodes: 3 } });
    revertSafeMode(root, snapshot);
    expect(scanDocument(root).repairSummary.nodes).toBe(0);
  });

  it('reports partial state when the host changes one property on a still-repaired node', () => {
    const root = setup('<div data-clickable tabindex="5">Continue</div>');
    const snapshot = applySafeMode(root, scanDocument(root)); snapshots.push({ root, snapshot });
    const control = root.querySelector('div')!;
    control.setAttribute('role', 'link');
    expect(scanDocument(root)).toMatchObject({ safeModeActive: true, repairState: 'partial', repairSummary: { nodes: 1 } });
    revertSafeMode(root, snapshot);
    expect(control.getAttribute('role')).toBe('link');
    expect(control.tabIndex).toBe(5);
    expect(snapshot.revertOutcomes).toEqual(expect.arrayContaining([{ clearviewId: control.dataset.clearviewId, property: 'role', status: 'conflict' }]));
  });
});
