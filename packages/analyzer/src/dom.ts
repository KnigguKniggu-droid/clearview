import type { AuditFinding, AuditReport, AuditRoot, FindingCategory, FindingSeverity } from './types';

const ids = new WeakMap<Element, string>();
const counters = new WeakMap<Document, number>();
const reportRoots = new WeakMap<AuditReport, AuditRoot>();
export function registerReport(root: AuditRoot, report: AuditReport): AuditReport {
  reportRoots.set(report, root);
  return report;
}
export const isReportForRoot = (root: AuditRoot, report: AuditReport): boolean => reportRoots.get(report) === root;
export const documentOf = (root: AuditRoot): Document => root.nodeType === 9 ? root as Document : root.ownerDocument!;
export const elements = (root: AuditRoot): HTMLElement[] => [
  ...(root.nodeType === 1 ? [root as HTMLElement] : []),
  ...Array.from(root.querySelectorAll<HTMLElement>('*')),
];
export const styleOf = (element: Element): CSSStyleDeclaration => element.ownerDocument.defaultView!.getComputedStyle(element);
export function elementId(element: Element): string {
  let id = ids.get(element);
  if (!id) {
    const document = element.ownerDocument;
    const next = (counters.get(document) ?? 0) + 1;
    counters.set(document, next);
    id = `cv-${next}`;
    ids.set(element, id);
  }
  if (element.getAttribute('data-clearview-id') !== id) element.setAttribute('data-clearview-id', id);
  return id;
}
export function findElement(root: AuditRoot, id: string): HTMLElement | undefined {
  // Host-controlled attributes are presentation metadata, not identity proof.
  return elements(root).find(element => ids.get(element) === id);
}
export function isVisible(element: Element): boolean {
  if (element.closest('[data-clearview-badge], [data-clearview-ignore], script, style, template, noscript')) return false;
  if (element.tagName === 'INPUT' && element.getAttribute('type') === 'hidden') return false;
  for (let current: Element | null = element; current; current = current.parentElement) {
    const style = styleOf(current);
    if (current.hasAttribute('hidden') || style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse' || Number(style.opacity || 1) === 0) return false;
    if (current.tagName === 'DETAILS' && !current.hasAttribute('open') && element !== current && !current.querySelector('summary')?.contains(element)) return false;
  }
  return true;
}
export const normalize = (text: string | null | undefined): string => (text ?? '').replace(/\s+/g, ' ').trim();
export function ownText(element: Element): string {
  if(element.closest('input, textarea, [contenteditable="true"], [contenteditable=""]'))return '';
  return normalize(Array.from(element.childNodes).filter(node => node.nodeType === 3).map(node => node.textContent).join(' '));
}
export function visibleText(element: Element): string {
  if(element.closest('input, textarea, [contenteditable="true"], [contenteditable=""]'))return '';
  return normalize(Array.from(element.childNodes).map(node => node.nodeType === 3 ? node.textContent : node.nodeType === 1 && isVisible(node as Element) ? visibleText(node as Element) : '').join(' '));
}
export function labelText(element: Element): string {
  const id = element.id;
  const labels = Array.from(element.ownerDocument.querySelectorAll('label')).filter(label => label.htmlFor === id && id || label.contains(element));
  return normalize(labels.map(label => visibleText(label)).join(' '));
}
export function accessibleName(element: Element): string {
  const references = element.getAttribute('aria-labelledby')?.trim().split(/\s+/) ?? [];
  const referenced = normalize(references.map(id => {const target=element.ownerDocument.getElementById(id);return target ? visibleText(target) : '';}).join(' '));
  return referenced || normalize(element.getAttribute('aria-label')) || labelText(element) || visibleText(element) || normalize(element.getAttribute('title')) || normalize(element.getAttribute('alt'));
}
export function hasControlLabel(element: Element): boolean {
  const references = element.getAttribute('aria-labelledby')?.trim().split(/\s+/) ?? [];
  return Boolean(normalize(element.getAttribute('aria-label')) || labelText(element) || references.some(id => {const target=element.ownerDocument.getElementById(id);return target ? visibleText(target) : '';}));
}
export function finding(element: Element, ruleId: string, category: FindingCategory, severity: FindingSeverity, title: string, explanation: string, action: string, repairable: boolean, evidence?: string): AuditFinding {
  const clearviewId = elementId(element);
  const identifier=element.tagName==='INPUT' ? `input (${(element as HTMLInputElement).type})` : element.tagName.toLowerCase();
  return {id: `${ruleId}-${clearviewId}`, clearviewId, ruleId, category, severity, title,
    plainLanguageExplanation: explanation, recommendedAction: action,
    evidenceText: normalize(evidence || visibleText(element) || element.getAttribute('placeholder') || identifier).slice(0,120),
    isAutoRepairable: repairable,
    ...(ruleId.startsWith('WCAG-') ? {wcagCriterion: `WCAG 2.1 ${ruleId.slice(5)}`} : {}),
  };
}
