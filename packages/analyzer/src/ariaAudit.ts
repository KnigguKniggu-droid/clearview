import { accessibleName, elements, finding, hasControlLabel, isVisible, styleOf } from './dom';
import type { AuditFinding, AuditRoot } from './types';

export function auditAria(root: AuditRoot): AuditFinding[] {
  const findings: AuditFinding[]=[];
  for (const element of elements(root).filter(isVisible)) {
    if (element.closest('[aria-hidden="true"], [inert]')) continue;
    const tag=element.tagName;
    if ((tag==='INPUT' && !['hidden','submit','button','reset','image'].includes((element as HTMLInputElement).type) || tag==='SELECT' || tag==='TEXTAREA') && !hasControlLabel(element)) {
      findings.push(finding(element,'WCAG-3.3.2','accessibility','critical','Form field has no label','Assistive technology may not identify this field. A placeholder is not a persistent label.','Safe Mode infers an accessible label. Confirm that its wording is correct.',true));
    }
    if ((tag==='BUTTON' || tag==='A' && element.hasAttribute('href') || element.getAttribute('role')==='button') && !accessibleName(element)) {
      findings.push(finding(element,'WCAG-4.1.2','accessibility','warning','Control has no accessible name','This interactive control has no readable name.','The site author must supply a meaningful accessible name.',false));
    }
    const nonsemantic=['DIV','SPAN','A'].includes(tag) && !(tag==='A' && element.hasAttribute('href'));
    const clickable=element.hasAttribute('onclick') || typeof element.onclick==='function' || element.hasAttribute('data-clickable') || styleOf(element).cursor==='pointer';
    if (nonsemantic && clickable && !(element.getAttribute('role')==='button' && element.hasAttribute('tabindex') && element.tabIndex>=0)) {
      findings.push(finding(element,'WCAG-2.1.1','accessibility','warning','Clickable control lacks keyboard access','This custom control may not be reachable or identifiable from a keyboard.','Safe Mode adds button semantics, natural focus order, and Enter/Space activation.',true));
    }
    if (element.tabIndex>0) findings.push(finding(element,'WCAG-2.4.3','accessibility','warning','Focus order overrides the page order','A positive tabindex moves this element ahead of natural keyboard order.','Safe Mode resets this tabindex to zero.',true));
    if (tag==='IMG' && !element.hasAttribute('alt') && !['presentation','none'].includes(element.getAttribute('role') ?? '')) findings.push(finding(element,'WCAG-1.1.1','accessibility','warning','Image has no text alternative','The image has no alt attribute. Its purpose requires human review.','The site author must add a meaningful alternative or mark the image decorative.',false));
  }
  return findings;
}
