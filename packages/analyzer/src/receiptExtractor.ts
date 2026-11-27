import { isLowVisibility } from './contrast';
import { elementId, elements, isVisible, ownText, visibleText } from './dom';
import type { AuditRoot, BillingCadence, FinancialCommitment } from './types';

// Keep currency prefixes, signs, and local billing units in the cited token.
const price = /(?:[-+−]\s*)?(?:(?:US|CA|AU|NZ|HK|SG)\s*\$|[A-Z]{1,3}\$|(?:USD|CAD|AUD|NZD|EUR|GBP)\s*[$€£]?|[$€£])\s*[-+−]?\s*(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?(?:\s*\/(?:mo(?:nth)?|yr|year|kWh|seat|user|unit|person|license|GB|minute|hour))?/gi;
const monthly = /\/mo(?:nth)?\b|per month|monthly|each month/i;
const annual = /\/yr\b|\/year\b|per year|annual|yearly/i;
const unitRate = /\/\s*(?:kwh|gb|unit|minute|hour|seat|user|person|license)\b|per\s+(?:kwh|gb|unit|minute|hour|seat|user|person|license)\b|usage[- ]based/i;

function contextElement(element: HTMLElement): HTMLElement {
  const row = element.closest<HTMLElement>('label, [data-charge], [data-price-row], tr, li');
  if (row) return row;
  if (['SPAN', 'STRONG', 'B', 'EM', 'SMALL'].includes(element.tagName) && element.parentElement) return element.parentElement;
  return element;
}

function currencyOf(token: string): FinancialCommitment['currency'] {
  const code = token.match(/\b(USD|CAD|AUD|NZD|EUR|GBP)\b/i)?.[1]?.toUpperCase();
  if (code) return code as Exclude<FinancialCommitment['currency'], 'unknown'>;
  const prefix = token.match(/([A-Z]{1,3})\s*\$/i)?.[1]?.toUpperCase();
  if (prefix) return ({ US: 'USD', CA: 'CAD', AU: 'AUD', NZ: 'NZD' } as const)[prefix as 'US' | 'CA' | 'AU' | 'NZ'] ?? 'unknown';
  return token.includes('€') ? 'EUR' : token.includes('£') ? 'GBP' : 'USD';
}

function amountContext(context: string, offset: number, token: string): { local: string; future: boolean } {
  const matches = [...context.matchAll(price)];
  const index = matches.findIndex(match => match.index === offset);
  const previousEnd = index > 0 ? matches[index - 1].index + matches[index - 1][0].length : 0;
  const nextStart = index >= 0 && index + 1 < matches.length ? matches[index + 1].index : context.length;
  let before = context.slice(previousEnd, offset);
  let after = context.slice(offset + token.length, nextStart);
  const future = /\bthen\b|\bfollowed by\b/i.test(before);
  // A neighbouring amount's label must not assign this amount's cadence.
  before = before.split(/;|\bthen\b|\bfollowed by\b|\bplus\b|\band\b/i).at(-1) ?? before;
  after = after.split(/;|\bthen\b|\bfollowed by\b|\bplus\b|\band\b/i)[0];
  return { local: before + ' ' + token + ' ' + after, future };
}

export function extractReceipt(root: AuditRoot): FinancialCommitment[] {
  const commitments: FinancialCommitment[] = [];
  for (const element of elements(root)) {
    if (!isVisible(element)) continue;
    const text = ownText(element);
    for (const match of text.matchAll(price)) {
      const row = contextElement(element);
      const context = visibleText(row);
      const textOffset = context.indexOf(text);
      const offset = textOffset >= 0 ? textOffset + match.index : context.indexOf(match[0]);
      const { local, future } = amountContext(context, offset, match[0]);
      const currency = currencyOf(match[0]);
      const amount = Number(match[0].match(/\d[\d,]*(?:\.\d{1,2})?/)![0].replace(/,/g, ''));
      const numericValue = /[-−]/.test(match[0]) ? -amount : amount;
      const amountKind: FinancialCommitment['amountKind'] = /\brefund\b/i.test(local) ? 'refund'
        : numericValue < 0 || /\bcredit\b(?!\s+card)|\bdiscount\b|\bsaving[s]?\b/i.test(local) ? 'credit' : 'charge';
      const checkbox = row.querySelector<HTMLInputElement>('input[type="checkbox"]') ?? (row.tagName === 'LABEL' && (row as HTMLLabelElement).control?.matches('input[type="checkbox"]') ? (row as HTMLLabelElement).control as HTMLInputElement : null);
      const cadence: BillingCadence = monthly.test(match[0]) ? 'monthly' : annual.test(match[0]) ? 'annual'
        : monthly.test(local) ? 'monthly' : annual.test(local) ? 'annual'
        : /one[- ]time|due today|copay|facility fee|administrative fee|installation fee|setup fee|activation fee|deposit|\bfee\b/i.test(local) ? 'one-time' : 'unknown';
      const isPreselected = checkbox ? checkbox.checked : !/optional|suggested|donation|starting at|from\s*[$€£]/i.test(context);
      const exclusionReason = !isPreselected ? 'Option is not selected or is only suggested.'
        : amountKind !== 'charge' ? 'Credit or refund; application and timing require review.'
        : unitRate.test(local) ? 'Usage-based or per-unit rate; payable quantity is not verified.'
        : /billed\s+annually|paid\s+annually|annual\s+billing|billed\s+(?:every|for)\s+12\s+months/i.test(context) && cadence === 'monthly' ? 'Monthly equivalent of an annual bill; not a separate monthly obligation.'
        : future || /after\s+(?:\d+\s*(?:month|day|year)|(?:the\s+)?trial)|following\s+(?:the\s+)?trial|renewal rate|future rate/i.test(local) ? 'Future or promotional renewal rate.'
        : /cancellation fee|late fee|if you|may apply|up to/i.test(local) ? 'Conditional charge; applicability is unknown.'
        : /\b(subtotal|grand total|total due|total today|estimated total|order total|monthly total|total monthly|total:)\b/i.test(context) || row.hasAttribute('data-receipt-total') ? 'Displayed aggregate; line items are counted separately.'
        : currency !== 'USD' ? 'Non-USD or unrecognized currency is listed separately; no conversion is assumed.'
        : cadence === 'annual' ? 'Annual commitment is listed separately, not converted to monthly.'
        : cadence === 'unknown' ? 'Billing cadence is unknown.' : undefined;
      const clearviewId = elementId(element);
      commitments.push({ id: 'price-' + clearviewId + '-' + match.index, clearviewId, label: context.slice(0, 160), amountText: match[0], numericValue, cadence, isPreselected,
        isHiddenOrLowContrast: isLowVisibility(element), currency, amountKind, includedInTotals: !exclusionReason,
        ...(exclusionReason ? { exclusionReason } : {}) });
    }
  }
  return commitments;
}

export function receiptTotals(commitments: FinancialCommitment[]): { totalImmediateDue: number; totalRecurringMonthly: number } {
  const sum = (cadence: BillingCadence) => commitments.filter(item => item.includedInTotals && item.cadence === cadence)
    .reduce((cents, item) => cents + Math.round(item.numericValue * 100), 0) / 100;
  return { totalImmediateDue: sum('one-time'), totalRecurringMonthly: sum('monthly') };
}
