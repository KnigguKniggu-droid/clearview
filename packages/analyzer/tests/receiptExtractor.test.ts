import { beforeEach, describe, expect, it } from 'vitest';
import { scanDocument } from '../src/index';

beforeEach(()=>{document.body.innerHTML='';});
describe('financial receipts',()=>{
  it('separates current and renewal prices within a compound offer',()=>{
    document.body.innerHTML='<p>Base plan $55/mo then $89.99/mo after 12 months.</p>';
    const report=scanDocument(document);
    expect(report.summary.totalRecurringMonthly).toBe(55);
    expect(report.financialCommitments[1].exclusionReason).toContain('Future');
  });
  it('counts current fixed line items once and excludes display totals',()=>{
    document.body.innerHTML='<section><p>Outpatient visit copay $185.00</p><p style="font-size:9px">Administrative facility fee $149.00</p><label><input type="checkbox" checked>Priority Telehealth Membership $29.99/mo</label><p>Total due today $363.99</p></section>';
    const report=scanDocument(document.body);
    expect(report.summary.totalImmediateDue).toBe(334);
    expect(report.summary.totalRecurringMonthly).toBe(29.99);
    expect(report.financialCommitments).toHaveLength(4);
    expect(report.financialCommitments.find(item=>item.numericValue===363.99)?.includedInTotals).toBe(false);
  });
  it('does not count unchecked options, future promotions, annual or usage prices as current monthly totals',()=>{
    document.body.innerHTML='<p>Base plan $55.00/mo</p><label><input type="checkbox">Device Shield $19.99/mo</label><p>Promotional rate auto-renews at $89.99/mo after 12 months.</p><p>Annual plan $120.00/year</p><p>$0.28/kWh peak demand surcharge</p>';
    const report=scanDocument(document);
    expect(report.summary.totalRecurringMonthly).toBe(55);
    expect(report.summary.totalImmediateDue).toBe(0);
    expect(report.financialCommitments.find(item=>item.numericValue===120)?.cadence).toBe('annual');
    expect(report.financialCommitments.find(item=>item.numericValue===.28)?.exclusionReason).toMatch(/usage/i);
  });
  it('keeps currencies separate and excludes invisible values',()=>{
    document.body.innerHTML='<p>One-time fee $1,234.56</p><p>Monthly fee €19.99</p><p>Annual fee £110.00</p><p hidden>Fee $999</p>';
    const report=scanDocument(document);
    expect(report.summary.totalImmediateDue).toBe(1234.56);
    expect(report.summary.totalRecurringMonthly).toBe(0);
    expect(report.financialCommitments.map(item=>item.currency)).toEqual(['USD','EUR','GBP']);
  });
  it('recognizes split label/price markup and reflects option changes',()=>{
    document.body.innerHTML='<label><input type="checkbox" checked><span>Monthly membership</span><strong>$20.00</strong></label>';
    expect(scanDocument(document).summary.totalRecurringMonthly).toBe(20);
    document.querySelector('input')!.checked=false;
    expect(scanDocument(document).summary.totalRecurringMonthly).toBe(0);
  });
  it('captures ungrouped four digit amounts and classifies unknown quotes conservatively',()=>{
    document.body.innerHTML='<p>Installation fee $1200.00</p><p>Suggested donation $10</p>';
    const report=scanDocument(document);
    expect(report.financialCommitments[0].numericValue).toBe(1200);
    expect(report.summary.totalImmediateDue).toBe(1200);
    expect(report.financialCommitments[1].cadence).toBe('unknown');
  });
  it('keeps explicit dollar currencies and unknown prefixes outside USD totals',()=>{
    document.body.innerHTML='<p>Plan CAD $39/month</p><p>Plan AU$20/month</p><p>Plan NZ$30/month</p><p>Plan HK$100/month</p><p>Plan USD 5/month</p>';
    const report=scanDocument(document);
    expect(report.financialCommitments.map(item=>item.currency)).toEqual(['CAD','AUD','NZD','unknown','USD']);
    expect(report.summary.totalRecurringMonthly).toBe(5);
    expect(report.financialCommitments[0].amountText).toBe('CAD $39/month');
  });
  it('preserves a signed credit but does not confuse a credit-card payment method with a credit',()=>{
    document.body.innerHTML='<p>Pay by credit card. Setup fee $40</p><p>Account credit -$25</p>';
    const report=scanDocument(document);
    expect(report.summary.totalImmediateDue).toBe(40);
    expect(report.financialCommitments[0].amountKind).toBe('charge');
    expect(report.financialCommitments[1]).toMatchObject({numericValue:-25,amountKind:'credit',includedInTotals:false});
  });
});
