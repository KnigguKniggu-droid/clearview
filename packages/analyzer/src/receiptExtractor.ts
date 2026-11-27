import { isLowVisibility } from './contrast';
import { elementId, elements, isVisible, ownText, visibleText } from './dom';
import type { AuditRoot, BillingCadence, FinancialCommitment } from './types';

const price=/[$€£]\s*(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?(?:\s*\/(?:mo(?:nth)?|yr|year|kWh))?/gi;
function contextElement(element: HTMLElement): HTMLElement {
  const row=element.closest<HTMLElement>('label, [data-charge], [data-price-row], tr, li');
  if (row) return row;
  if (['SPAN','STRONG','B','EM','SMALL'].includes(element.tagName) && element.parentElement) return element.parentElement;
  return element;
}
export function extractReceipt(root: AuditRoot): FinancialCommitment[] {
  const commitments: FinancialCommitment[]=[];
  for (const element of elements(root)) {
    if (!isVisible(element)) continue;
    const text=ownText(element);
    for (const match of text.matchAll(price)) {
      const row=contextElement(element),context=visibleText(row);
      // Split compound offers at transition words so the current rate is not
      // excluded merely because a later price has a renewal condition.
      const textOffset=context.indexOf(text);
      const offset=textOffset>=0 ? textOffset+match.index : context.indexOf(match[0]);
      const segments=context.split(/\bthen\b|\bfollowed by\b|;/i);
      let localContext=context;
      if(segments.length>1 && offset>=0) {
        let consumed=0;
        for(const segment of segments) {
          const at=context.indexOf(segment,consumed);
          if(offset>=at && offset<at+segment.length){localContext=segment;break;}
          consumed=at+segment.length;
        }
      }
      const currency=match[0].startsWith('€') ? 'EUR' : match[0].startsWith('£') ? 'GBP' : 'USD';
      const checkbox=row.querySelector<HTMLInputElement>('input[type="checkbox"]') ?? (row.tagName==='LABEL' && (row as HTMLLabelElement).control?.matches('input[type="checkbox"]') ? (row as HTMLLabelElement).control as HTMLInputElement : null);
      const cadence: BillingCadence=/\/mo\b|\/month\b|per month|monthly|each month/i.test(localContext) ? 'monthly' : /\/yr\b|\/year\b|per year|annual|yearly/i.test(localContext) ? 'annual' : /one[- ]time|due today|copay|facility fee|administrative fee|installation fee|setup fee|activation fee|deposit|\bfee\b/i.test(localContext) ? 'one-time' : 'unknown';
      const isPreselected=checkbox ? checkbox.checked : !/optional|suggested|donation|starting at|from\s*[$€£]/i.test(context);
      const exclusionReason = !isPreselected ? 'Option is not selected or is only suggested.'
        : /\/\s*kwh|per\s+kwh|\/\s*(?:gb|unit|minute|hour)|usage[- ]based/i.test(context) ? 'Usage-based rate; quantity is unknown.'
        : /after\s+(?:\d+\s*(?:month|day|year)|(?:the\s+)?trial)|following\s+(?:the\s+)?trial|renewal rate|future rate/i.test(localContext) || segments.length>1 && localContext!==segments[0] ? 'Future or promotional renewal rate.'
        : /cancellation fee|late fee|if you|may apply|up to/i.test(context) ? 'Conditional charge; applicability is unknown.'
        : /\b(subtotal|grand total|total due|total today|estimated total|order total|monthly total|total monthly|total:)\b/i.test(context) || row.hasAttribute('data-receipt-total') ? 'Displayed aggregate; line items are counted separately.'
        : currency!=='USD' ? 'Non-USD amount is listed separately; no currency conversion is assumed.'
        : cadence==='annual' ? 'Annual commitment is listed separately, not converted to monthly.'
        : cadence==='unknown' ? 'Billing cadence is unknown.' : undefined;
      const clearviewId=elementId(element);
      commitments.push({id:`price-${clearviewId}-${match.index}`,clearviewId,label:context.slice(0,160),amountText:match[0],numericValue:Number(match[0].replace(/^[^\d]+/,'').replace(/,/g,'').split(/[\s/]/)[0]),cadence,isPreselected,isHiddenOrLowContrast:isLowVisibility(element),currency,includedInTotals:!exclusionReason,...(exclusionReason ? {exclusionReason} : {})});
    }
  }
  return commitments;
}
export function receiptTotals(commitments: FinancialCommitment[]): {totalImmediateDue:number;totalRecurringMonthly:number} {
  const sum=(cadence:BillingCadence)=>commitments.filter(item=>item.includedInTotals && item.cadence===cadence).reduce((cents,item)=>cents+Math.round(item.numericValue*100),0)/100;
  return {totalImmediateDue:sum('one-time'),totalRecurringMonthly:sum('monthly')};
}
