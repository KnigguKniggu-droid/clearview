import { afterEach, describe, expect, it } from 'vitest';
import { applySafeMode, revertSafeMode, scanDocument } from '../src/index';
import type { AuditReport } from '../src/types';

// Adversarial acceptance repros. Expected values follow the explicit fixture
// terms, not the current parser. Implementation changes are pending review.
const roots: HTMLElement[] = [];
function fixture(markup: string): HTMLElement {
  const root = document.createElement('section');
  root.innerHTML = markup;
  document.body.append(root);
  roots.push(root);
  return root;
}
afterEach(() => { for (const root of roots.splice(0)) root.remove(); });
function receiptEvidence(name: string, report: AuditReport): void {
  console.info(JSON.stringify({
    case: name,
    due: report.summary.totalImmediateDue,
    monthly: report.summary.totalRecurringMonthly,
    prices: report.financialCommitments.map(({ amountText, numericValue, cadence, currency, includedInTotals, exclusionReason }) =>
      ({ amountText, numericValue, cadence, currency, includedInTotals, exclusionReason })),
  }));
}

describe('consumer audit: individual billing obligations', () => {
  it('keeps a setup fee separate from a monthly service charge in the same sentence', () => {
    const report = scanDocument(fixture('<p>Setup fee $49.00 plus internet service $20.00/month.</p>'));
    receiptEvidence('mixed-cadence', report);
    expect({ due: report.summary.totalImmediateDue, monthly: report.summary.totalRecurringMonthly })
      .toEqual({ due: 49, monthly: 20 });
  });

  it('does not sum an annual bill with its advertised monthly equivalent', () => {
    const report = scanDocument(fixture('<p>Storage plan $10/month, billed annually at $120/year.</p>'));
    receiptEvidence('annual-equivalent', report);
    expect(report.summary.totalRecurringMonthly).toBe(0);
    expect(report.financialCommitments.every(item => !item.includedInTotals)).toBe(true);
  });

  it('does not promote a per-seat monthly unit price to a complete fixed total', () => {
    const report = scanDocument(fixture('<p>Team plan: 3 seats selected. $10 per seat monthly.</p>'));
    receiptEvidence('quantity', report);
    const monthly = report.summary.totalRecurringMonthly;
    // A supported quantity calculation is $30. Otherwise this unit rate must
    // stay excluded and cited. Presenting $10 as the fixed bill is incorrect.
    expect(monthly === 30 || monthly === 0 && report.financialCommitments.every(item => !item.includedInTotals)).toBe(true);
  });
});

describe('consumer audit: currency and monetary direction', () => {
  it('does not convert an explicit CAD charge into USD by dropping its prefix', () => {
    const report = scanDocument(fixture('<p>Canadian plan CA$39/month</p><p>US service US$5/month</p>'));
    receiptEvidence('explicit-currencies', report);
    expect(report.summary.totalRecurringMonthly).toBe(5);
    const canadian = report.financialCommitments.find(item => item.numericValue === 39)!;
    expect(canadian.includedInTotals).toBe(false);
  });

  it('does not add a signed refund to the amount due', () => {
    const report = scanDocument(fixture('<p>Service setup fee $40.00</p><p>Refund of activation fee -$25.00</p>'));
    receiptEvidence('signed-refund', report);
    // Refund timing is unknown. Exclude it or model its direction separately;
    // never add the refund as a positive amount the consumer owes.
    expect(report.summary.totalImmediateDue).toBeLessThanOrEqual(40);
    expect(report.financialCommitments.find(item => item.amountKind === 'refund')).toMatchObject({ numericValue: -25, includedInTotals: false });
  });

  it('keeps a genuinely payable refundable deposit in the immediate amount', () => {
    const report = scanDocument(fixture('<p>Refundable security deposit $100 due today.</p>'));
    receiptEvidence('deposit-control', report);
    expect(report.summary.totalImmediateDue).toBe(100);
  });

  it('keeps standalone annual, EUR, and unknown-cadence prices outside fixed USD totals', () => {
    const report = scanDocument(fixture('<p>Annual plan $120/year</p><p>Euro plan €20/month</p><p>Estimated service price $30</p>'));
    receiptEvidence('conservative-controls', report);
    expect(report.summary.totalImmediateDue).toBe(0);
    expect(report.summary.totalRecurringMonthly).toBe(0);
    expect(report.financialCommitments).toHaveLength(3);
    expect(report.financialCommitments.every(item => !item.includedInTotals)).toBe(true);
  });
});

describe('consumer audit: repair lifecycle and current user intent', () => {
  it('does not clear required consent merely because it mentions a subscription', () => {
    const root = fixture('<label><input type="checkbox" required checked>I agree to the subscription terms.</label>');
    const checkbox = root.querySelector('input')!;
    const report = scanDocument(root);
    const events: string[] = [];
    checkbox.addEventListener('input', () => events.push('input'));
    checkbox.addEventListener('change', () => events.push('change'));
    const snapshot = applySafeMode(root, report);
    try {
      console.info(JSON.stringify({ case: 'required-consent', checked: checkbox.checked, valid: checkbox.checkValidity(), events, rules: report.findings.map(item => item.ruleId) }));
      expect(checkbox.checked).toBe(true);
      expect(events).toEqual([]);
    } finally { revertSafeMode(root, snapshot); }
  });

  it('revalidates a same-node report before clearing a now unrelated choice', () => {
    const root = fixture('<label><input type="checkbox" checked>Optional membership $20/month</label>');
    const checkbox = root.querySelector('input')!;
    const label = root.querySelector('label')!;
    const report = scanDocument(root);
    label.lastChild!.textContent = 'I consent to the required privacy policy.';
    checkbox.required = true;
    const snapshot = applySafeMode(root, report);
    try {
      console.info(JSON.stringify({ case: 'stale-same-node', checked: checkbox.checked, valid: checkbox.checkValidity(), repaired: snapshot.records.length }));
      expect(checkbox.checked).toBe(true);
    } finally { revertSafeMode(root, snapshot); }
  });

  it('does not claim an option was cleared when the host rejects the change', () => {
    const root = fixture('<label><input type="checkbox" checked>Optional membership $20/month</label>');
    const checkbox = root.querySelector('input')!;
    checkbox.addEventListener('change', () => { checkbox.checked = true; });
    const snapshot = applySafeMode(root, scanDocument(root));
    try {
      const rescan = scanDocument(root);
      const badge = root.querySelector('[data-clearview-badge]')?.textContent ?? '';
      console.info(JSON.stringify({ case: 'host-rejects-repair', checked: checkbox.checked, safeModeActive: rescan.safeModeActive, monthly: rescan.summary.totalRecurringMonthly, badge }));
      expect(checkbox.checked).toBe(true);
      expect(badge).not.toContain('option cleared');
    } finally { revertSafeMode(root, snapshot); }
  });

  it('does not overwrite a new host-provided accessible label during rollback', () => {
    const root = fixture('<input placeholder="Account number">');
    const input = root.querySelector('input')!;
    const snapshot = applySafeMode(root, scanDocument(root));
    input.setAttribute('aria-label', 'Verified customer account');
    revertSafeMode(root, snapshot);
    console.info(JSON.stringify({ case: 'host-update-before-revert', label: input.getAttribute('aria-label') }));
    expect(input.getAttribute('aria-label')).toBe('Verified customer account');
  });
});
