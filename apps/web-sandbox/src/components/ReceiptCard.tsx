import { ArrowDownRight, ArrowUpRight, ReceiptText, EyeOff, CircleCheck, CirclePlus } from 'lucide-react';
import type { AuditReport, FinancialCommitment } from '@clearview/analyzer';
const dollars = (amount:number) => amount.toLocaleString('en-US',{style:'currency',currency:'USD'});
export function ReceiptCard({report,baseline,verifiedRemovals=[],selectedOptions=[],onLocate}: {
  report:AuditReport; baseline:AuditReport|null; verifiedRemovals?:FinancialCommitment[]; selectedOptions?:FinancialCommitment[]; onLocate?:(id:string) => void;
}) {
  const included = report.financialCommitments.filter(item => item.includedInTotals);
  const disclosures = report.financialCommitments.filter(item => !item.includedInTotals && !item.exclusionReason?.startsWith('Displayed aggregate'));
  const previousMonthly = baseline?.summary.totalRecurringMonthly;
  const removed = report.safeModeActive ? verifiedRemovals : [];
  const removedMonthly = removed.reduce((cents,item) => cents + Math.round(item.numericValue*100),0)/100;
  const charge = (item:FinancialCommitment,index:number) => {
    const optional = selectedOptions.some(option => option.id === item.id);
    const hidden = item.isHiddenOrLowContrast;
    const status = optional ? 'Selected add-on' : hidden ? /fee/i.test(item.label) ? 'Hard-to-read fee' : 'Hard-to-read amount' : /copay/i.test(item.label) ? 'Visit copay' : 'Included charge';
    const Icon = optional ? CirclePlus : hidden ? EyeOff : CircleCheck;
    const content = <><Icon className="charge-icon" size={21} /><span className="receipt-description"><span className="receipt-charge-name">{item.label.replace(item.amountText,'').replace(/[:·]\s*$/,'')}</span><span className={'charge-status ' + (optional ? 'status-extra' : hidden ? 'status-hidden' : '')}>{status}</span></span><b>{item.amountText}</b>{onLocate && <ArrowUpRight size={18} />}</>;
    return onLocate ? <button key={item.id} data-cv-source={item.clearviewId} data-cv-citation={index+1} onClick={() => onLocate(item.clearviewId)} title={item.label}>{content}</button> : <div className="receipt-static-line" key={item.id}>{content}</div>;
  };
  return <section className="receipt-card" aria-labelledby="receipt-title">
    <div className="receipt-heading"><h3 id="receipt-title"><ReceiptText size={22} />What You Are Actually Paying</h3></div>
    <p className="receipt-scope">Amounts found on this page, in US dollars. Confirm the final bill before you agree.</p>
    <div className="receipt-totals"><div><span>Due Today</span><strong data-cv-amount data-testid="receipt-due">{dollars(report.summary.totalImmediateDue)}</strong></div><div><span>Monthly Recurring</span><strong><span data-cv-amount data-testid="receipt-monthly">{dollars(report.summary.totalRecurringMonthly)}</span><small>/mo</small></strong></div></div>
    {removedMonthly > 0 && <div className="receipt-change" role="status"><span><ArrowDownRight size={20} />Selected monthly extras removed</span><strong>−{dollars(removedMonthly)}<small>/mo</small></strong><p>{previousMonthly !== undefined && <><s>{dollars(previousMonthly)}/mo</s><span>→</span></>}{dollars(report.summary.totalRecurringMonthly)}/mo. Confirm the page’s own total.</p></div>}
    <div className="receipt-columns"><span>{included.length} included charge{included.length===1?'':'s'}</span>{onLocate && <span>Select a charge to see it on the page</span>}</div>
    <div className="receipt-lines">{included.length ? included.map(charge) : <p className="receipt-empty">No current fixed US-dollar charges found.</p>}</div>
    {removed.length > 0 && <div className="removed-charges">{removed.map(item => <div key={item.id}><span>{item.label.replace(item.amountText,'').trim()}</span><s>{item.amountText}</s><b>Removed by ClearView</b></div>)}</div>}
    {disclosures.length>0 && <details className="other-prices" open><summary>{disclosures.length} other price{disclosures.length===1?'':'s'} to check separately</summary>{disclosures.map(item => <div key={item.id}>{onLocate ? <button data-cv-source={item.clearviewId} onClick={() => onLocate(item.clearviewId)}>{item.amountText}<ArrowUpRight size={18} /></button> : <strong>{item.amountText}</strong>}<span>{item.exclusionReason}</span></div>)}</details>}
    <p className="receipt-note">These totals include only current fixed US-dollar charges we can identify. Annual, future, usage-based and other-currency prices stay separate. {onLocate ? 'Changing this page does not cancel a subscription with the provider.' : 'This report is a saved snapshot.'}</p>
  </section>;
}
