import { ArrowDownRight, ArrowUpRight, LocateFixed } from 'lucide-react';
import type { AuditReport } from '@clearview/analyzer';
const dollars = (amount: number) => amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export function ReceiptCard({ report, baseline, onLocate }: { report: AuditReport; baseline: AuditReport['summary'] | null; onLocate: (id: string) => void }) {
  const included = report.financialCommitments.filter(item => item.includedInTotals);
  const disclosures = report.financialCommitments.filter(item => !item.includedInTotals && !item.exclusionReason?.startsWith('Displayed aggregate'));
  const removedMonthly = report.safeModeActive && baseline ? Math.max(0, baseline.totalRecurringMonthly - report.summary.totalRecurringMonthly) : 0;
  return <section className="receipt-card" aria-labelledby="receipt-title"><div className="receipt-heading"><h3 id="receipt-title">What this page costs.</h3><img src="/art/folded-receipt.webp" alt="" width="64" height="64" /></div>
    <div className="receipt-totals"><div><span>Due today · identified</span><strong data-cv-amount data-testid="receipt-due">{dollars(report.summary.totalImmediateDue)}</strong></div><div><span>Recurring monthly</span><strong><span data-cv-amount data-testid="receipt-monthly">{dollars(report.summary.totalRecurringMonthly)}</span><small>/mo</small></strong></div></div>
    {/* AffectUI Change Summary's definition-list pattern, using ClearView's own tokens and real report values. */}
    {removedMonthly > 0 && <div className="receipt-change" role="status"><dl><div><dt>Monthly options removed</dt><dd><ArrowDownRight size={16} aria-hidden="true" /><strong>{dollars(removedMonthly)}<small>/mo</small></strong></dd></div></dl><p>Before {dollars(baseline!.totalRecurringMonthly)} → now {dollars(report.summary.totalRecurringMonthly)}. Confirm the page’s final terms.</p></div>}
    <div className="receipt-columns" aria-hidden="true"><span>{included.length} identified charge{included.length === 1 ? '' : 's'}</span><span>Amount / source</span></div>
    <div className="receipt-lines">{included.length ? included.map((item, index) => <button key={item.id} data-cv-source={item.clearviewId} data-cv-citation={index + 1} onClick={() => onLocate(item.clearviewId)} title={item.label}><span className="citation-key" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><span className="receipt-description"><span className="receipt-charge-name">{item.label.replace(item.amountText, '').replace(/[:·]\s*$/, '')}</span>{item.isHiddenOrLowContrast && <em>Hard-to-see terms</em>}</span><b>{item.amountText}</b><ArrowUpRight size={15} /></button>) : <p className="receipt-empty">No fixed USD charges identified in this view.</p>}</div>
    {disclosures.length > 0 && <details className="other-prices"><summary>{disclosures.length} other price disclosure{disclosures.length === 1 ? '' : 's'} · review separately</summary>{disclosures.map(item => <div key={item.id}><button data-cv-source={item.clearviewId} onClick={() => onLocate(item.clearviewId)}>{item.amountText} <ArrowUpRight size={14} /></button><span>{item.exclusionReason}</span></div>)}</details>}
    <p className="receipt-note"><LocateFixed size={16} aria-hidden="true" /> Select any charge to see its source on the page. Estimate in USD; confirm the final bill.</p>
  </section>;
}
