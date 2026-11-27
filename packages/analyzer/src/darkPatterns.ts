import { isLowVisibility } from './contrast';
import { elements, finding, isVisible, labelText, ownText, visibleText } from './dom';
import type { AuditFinding, AuditRoot } from './types';

const addOn=/auto[- ]?renew|monthly|recurring|trial|protection|shield|insurance|membership|subscription|billed|add[- ]?on|telehealth|offset|newsletter|router care/i;
const disclosure=/[$€£]\s*\d|auto[- ]?renew|cancellation fee|non[- ]?refundable|variable rate|surcharge|facility fee|after trial|per month|\/mo/i;
const shaming=/no thanks.*(prefer|like|want|hate|don't want|pay full|miss out|overpay|stay unprotected|risk)/i;
const urgency=/\b0?\d:\d{2}(:\d{2})?\b|expires in|offer ends|reserved for|act now/i;
export function checkboxContext(element: HTMLInputElement): string {
  const label=labelText(element);
  if (label) return label;
  const parent=element.parentElement;
  if (parent && parent.querySelectorAll('input[type="checkbox"]').length===1 && addOn.test(visibleText(parent))) return visibleText(parent);
  const grandparent=parent?.parentElement;
  return grandparent && grandparent.querySelectorAll('input[type="checkbox"]').length===1 ? visibleText(grandparent) : visibleText(parent ?? element);
}
export function canClearCheckbox(element: HTMLInputElement): boolean {
  return element.checked && !element.required && !element.disabled && element.getAttribute('aria-disabled') !== 'true'
    && !/\b(?:agree|consent|terms|privacy|mandatory|required)\b/i.test(checkboxContext(element));
}
export function auditDarkPatterns(root: AuditRoot): AuditFinding[] {
  const findings: AuditFinding[]=[];
  for (const element of elements(root).filter(isVisible)) {
    const text=ownText(element);
    if (element.tagName==='INPUT' && (element as HTMLInputElement).type==='checkbox' && (element as HTMLInputElement).checked && addOn.test(checkboxContext(element as HTMLInputElement))) {
      const repairable = canClearCheckbox(element as HTMLInputElement);
      findings.push(finding(element,'DP-001','dark-pattern',repairable ? 'critical' : 'info',repairable ? 'Recurring or add-on option is selected' : 'Selected commitment needs manual review','This choice is checked. A scan cannot establish who selected it or whether it is optional.',repairable ? 'You can choose to clear this option. Confirm the page accepts the change.' : 'This appears required, disabled, or related to consent. Review it on the original page.',repairable,checkboxContext(element as HTMLInputElement)));
    }
    if (text && disclosure.test(text) && isLowVisibility(element)) {
      findings.push(finding(element,'DP-002','hidden-fee','critical','Financial terms are hard to see','A price or billing condition appears in small, faint, or low-contrast text.','Safe Mode highlights these terms. Check whether they apply to you.',true,text));
    }
    if ((['BUTTON','A'].includes(element.tagName) || element.getAttribute('role')==='button') && shaming.test(visibleText(element))) findings.push(finding(element,'DP-003','dark-pattern','warning','Decline option uses pressure language','The wording may discourage you from declining an option.','Choose based on the actual terms. Safe Mode does not rewrite the site’s decision.',false));
    if (element.hasAttribute('data-countdown') || text && urgency.test(text)) findings.push(finding(element,'DP-004','dark-pattern','warning','Countdown or urgency language','The page uses a timer or urgency claim. This audit cannot verify whether its deadline is genuine.','Review the terms at your own pace. Confirm the deadline independently.',false,text));
  }
  return findings;
}
