import { ArrowUpRight } from 'lucide-react';
import type { AuditReport } from '@clearview/analyzer';
const dollars = (amount: number) => amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export function ReceiptCard({ report, onLocate }: { report: AuditReport; onLocate: (id: string) => void }) {
  const included = report.financialCommitments.filter(item => item.includedInTotals);
  const disclosures = report.financialCommitments.filter(item => !item.includedInTotals && !item.exclusionReason?.startsWith('Displayed aggregate'));
  return <section className="receipt-card" aria-labelledby="receipt-title"><div className="receipt-heading"><h3 id="receipt-title">Your plain-language receipt</h3><span>From this page</span></div>
    <div className="receipt-totals"><div><span>Due today · identified</span><strong data-cv-amount data-testid="receipt-due">{dollars(report.summary.totalImmediateDue)}</strong></div><div><span>Recurring monthly</span><strong><span data-cv-amount data-testid="receipt-monthly">{dollars(report.summary.totalRecurringMonthly)}</span><small>/mo</small></strong></div></div>
    <div className="receipt-lines">{included.length ? included.map(item => <button key={item.id} data-cv-source={item.clearviewId} onClick={() => onLocate(item.clearviewId)} title={item.label}><span>{item.label.replace(item.amountText, '').replace(/[:·]\s*$/, '').slice(0, 90)}{item.isHiddenOrLowContrast && <em>Hard-to-see terms</em>}</span><b>{item.amountText}</b><ArrowUpRight size={15} /></button>) : <p className="receipt-empty">No fixed USD charges identified in this view.</p>}</div>
    {disclosures.length > 0 && <details className="other-prices"><summary>{disclosures.length} other price disclosure{disclosures.length === 1 ? '' : 's'} · review separately</summary>{disclosures.map(item => <div key={item.id}><button data-cv-source={item.clearviewId} onClick={() => onLocate(item.clearviewId)}>{item.amountText} <ArrowUpRight size={14} /></button><span>{item.exclusionReason}</span></div>)}</details>}
    <p className="receipt-note">An estimate from visible terms, in USD. Confirm the final bill.</p>
  </section>;
}
