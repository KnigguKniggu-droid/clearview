import { documentOf, elementId, findElement, isFindingCurrent, isReportForRoot, normalize, reviewedFindingIds, styleOf, visibleText } from './dom';
import { canClearCheckbox } from './darkPatterns';
import type { AuditFinding, AuditReport, AuditRoot, ElementRepairRecord, RepairOptions, RepairSnapshot } from './types';

interface AttributePatch { before: string | null; after: string | null }
interface RuntimeRecord {
  element: HTMLElement;
  record: ElementRepairRecord;
  patches: Map<string, AttributePatch>;
  checked?: { before: boolean; after: boolean };
  keyListener?: EventListener;
  badge?: HTMLElement;
}
const active = new WeakMap<AuditRoot, RepairSnapshot>();
const runtime = new WeakMap<RepairSnapshot, { root: AuditRoot; records: RuntimeRecord[] }>();
const inScope = (root: AuditRoot, element: HTMLElement): boolean => element.isConnected && (root === element || root.contains(element));
function currentAttribute(element: HTMLElement, name: string): string | null {
  const highlight = highlights.get(element);
  if (name !== 'style') return element.getAttribute(name);
  if (!highlight) return element.style.cssText;
  const style = element.ownerDocument.createElement('div').style;
  style.cssText = element.style.cssText;
  if (highlight.outline) style.setProperty('outline', highlight.outline, highlight.priority); else style.removeProperty('outline');
  if (highlight.offset) style.setProperty('outline-offset', highlight.offset, highlight.offsetPriority); else style.removeProperty('outline-offset');
  return style.cssText;
}
function hasOwnedPatch(root: AuditRoot, entry: RuntimeRecord): boolean {
  return inScope(root, entry.element) && (
    Boolean(entry.checked && (entry.element as HTMLInputElement).checked === entry.checked.after)
    || [...entry.patches].some(([name, patch]) => currentAttribute(entry.element, name) === patch.after)
  );
}
export function getRepairStatus(root: AuditRoot): Pick<AuditReport, 'safeModeActive' | 'repairState' | 'repairSummary'> {
  const snapshot = active.get(root);
  const data = snapshot && runtime.get(snapshot);
  const repairSummary = { applied: 0, skipped: 0, conflicted: 0, nodes: 0 };
  if (!snapshot || !data) return { safeModeActive: false, repairState: 'inactive', repairSummary };
  for (const outcome of snapshot.outcomes) {
    if (outcome.status === 'applied') repairSummary.applied++;
    else if (outcome.status === 'skipped') repairSummary.skipped++;
    else repairSummary.conflicted++;
  }
  const changed = data.records.filter(entry => entry.checked || entry.patches.size);
  const owned = changed.filter(entry => hasOwnedPatch(root, entry));
  repairSummary.nodes = owned.length;
  const lostMutation = changed.some(entry => !inScope(root, entry.element)
    || entry.checked && (entry.element as HTMLInputElement).checked !== entry.checked.after
    || [...entry.patches].some(([name, patch]) => currentAttribute(entry.element, name) !== patch.after));
  // An obsolete badge must not continue to claim success after a host update.
  for (const entry of changed) if (!hasOwnedPatch(root, entry)) entry.badge?.remove();
  const repairState = !owned.length ? repairSummary.applied ? 'expired' : 'inactive'
    : repairSummary.skipped || repairSummary.conflicted || lostMutation ? 'partial' : 'active';
  return { safeModeActive: Boolean(owned.length), repairState, repairSummary };
}
export const isSafeModeActive = (root: AuditRoot): boolean => getRepairStatus(root).safeModeActive;

function setChecked(element: HTMLInputElement, checked: boolean): void {
  const window = element.ownerDocument.defaultView!;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'checked')?.set;
  if (setter) setter.call(element, checked); else element.checked = checked;
  element.dispatchEvent(new window.Event('input', { bubbles: true }));
  element.dispatchEvent(new window.Event('change', { bubbles: true }));
}
function inferredName(element: HTMLElement): string {
  return normalize(element.getAttribute('placeholder')) || normalize(element.getAttribute('name')) || normalize(element.id.replace(/[-_]/g, ' '))
    || (element.previousElementSibling ? visibleText(element.previousElementSibling).slice(0, 80) : '') || 'Unlabeled field — confirm its purpose';
}
function dispose(records: RuntimeRecord[]): void {
  for (const entry of records) {
    entry.badge?.remove();
    if (entry.keyListener) entry.element.removeEventListener('keydown', entry.keyListener);
  }
}

export function applySafeMode(root: AuditRoot, report: AuditReport, options: RepairOptions = {}): RepairSnapshot {
  if (!isReportForRoot(root, report)) throw new Error('Scan this root before applying Safe Mode.');
  const allowed = new Set(reviewedFindingIds(report));
  if (options.findingIds?.some(id => !allowed.has(id))) throw new Error('Select findings from the reviewed report.');
  const previous = active.get(root);
  if (previous && getRepairStatus(root).safeModeActive) return previous;
  if (previous) { dispose(runtime.get(previous)?.records ?? []); runtime.delete(previous); }
  const snapshot: RepairSnapshot = { appliedAt: Date.now(), records: [], outcomes: [], revertOutcomes: [] };
  const records: RuntimeRecord[] = [];
  active.set(root, snapshot);
  runtime.set(snapshot, { root, records });
  const capture = (element: HTMLElement): RuntimeRecord => {
    const existing = records.find(entry => entry.element === element);
    if (existing) return existing;
    clearHighlight(element);
    const record: ElementRepairRecord = { clearviewElementId: elementId(element), originalStyleCssText: element.style.cssText,
      originalStyleAttribute: element.getAttribute('style'), originalAriaLabel: element.getAttribute('aria-label'),
      originalRole: element.getAttribute('role'), originalTabIndex: element.getAttribute('tabindex') };
    const entry: RuntimeRecord = { element, record, patches: new Map() };
    records.push(entry); snapshot.records.push(record);
    return entry;
  };
  const patch = (entry: RuntimeRecord, name: string, change: () => void): void => {
    const previousPatch = entry.patches.get(name);
    const before = previousPatch ? previousPatch.before : entry.element.getAttribute(name);
    change();
    const after = currentAttribute(entry.element, name);
    if (before !== after) entry.patches.set(name, { before, after });
  };
  const selected = options.findingIds === undefined ? undefined : new Set(options.findingIds);
  const grouped = new Map<string, AuditFinding[]>();
  for (const finding of report.findings) {
    if (selected ? !selected.has(finding.id) : !finding.isAutoRepairable) continue;
    const group = grouped.get(finding.clearviewId) ?? [];
    group.push(finding); grouped.set(finding.clearviewId, group);
  }
  for (const [id, findings] of grouped) {
    const element = findElement(root, id);
    if (element) clearHighlight(element);
    const eligible = findings.filter(finding => {
      const reason = !finding.isAutoRepairable ? 'This finding requires manual review.'
        : !element || !isFindingCurrent(root, report, finding) ? 'Page evidence changed. Rescan before choosing this repair.' : undefined;
      if (reason) snapshot.outcomes.push({ findingId: finding.id, clearviewId: id, status: 'skipped', reason });
      return !reason;
    });
    if (!element || !eligible.length) continue;
    const entry = capture(element);
    let applied = false;
    for (const finding of eligible) {
      const rule = finding.ruleId;
      let failure: string | undefined;
      if (rule === 'DP-001') {
        const checkbox = element as HTMLInputElement;
        if (element.tagName !== 'INPUT' || checkbox.type !== 'checkbox' || !canClearCheckbox(checkbox)) {
          snapshot.outcomes.push({ findingId: finding.id, clearviewId: id, status: 'skipped', reason: 'This choice is no longer eligible to clear.' });
          continue;
        }
        const before = checkbox.checked;
        setChecked(checkbox, false);
        if (checkbox.checked) failure = 'The page did not accept the checkbox change. Review the original page.';
        else { entry.checked = { before, after: false }; entry.record.originalChecked = before; }
      } else if (rule === 'DP-002' || rule === 'WCAG-1.4.3') {
        const readableFontSize = `${Math.max(16, Number.parseFloat(styleOf(element).fontSize) || 16)}px`;
        patch(entry, 'style', () => {
          for (const [property, value] of Object.entries({ 'background-color': '#FEF08A', color: '#111827', 'font-size': readableFontSize, opacity: '1', padding: '2px 6px', 'border-radius': '4px', 'font-weight': '600' })) element.style.setProperty(property, value, 'important');
        });
        for (let ancestor = element.parentElement; ancestor && (root.nodeType === 9 || root.contains(ancestor)); ancestor = ancestor.parentElement) {
          if (Number(styleOf(ancestor).opacity || 1) < 1) {
            const parentEntry = capture(ancestor);
            patch(parentEntry, 'style', () => ancestor!.style.setProperty('opacity', '1', 'important'));
          }
          if (ancestor === root) break;
        }
      } else if (rule === 'WCAG-3.3.2') {
        patch(entry, 'aria-label', () => element.setAttribute('aria-label', inferredName(element)));
      } else if (rule === 'WCAG-2.1.1') {
        patch(entry, 'role', () => element.setAttribute('role', 'button'));
        patch(entry, 'tabindex', () => element.setAttribute('tabindex', '0'));
        entry.keyListener = (event: Event) => {
          const key = event as KeyboardEvent;
          if (event.target === element && !key.repeat && !element.hasAttribute('disabled') && element.getAttribute('aria-disabled') !== 'true' && (key.key === 'Enter' || key.key === ' ')) {
            event.preventDefault(); element.click();
          }
        };
        element.addEventListener('keydown', entry.keyListener); entry.record.addedKeyListener = true;
      } else if (rule === 'WCAG-2.4.3') {
        patch(entry, 'tabindex', () => element.setAttribute('tabindex', '0'));
      } else failure = 'No supported repair is available for this rule.';
      snapshot.outcomes.push({ findingId: finding.id, clearviewId: id, status: failure ? 'conflict' : 'applied', ...(failure ? { reason: failure } : {}) });
      if (!failure) applied = true;
    }
    if (applied) {
      const badge = documentOf(root).createElement('span');
      badge.setAttribute('data-clearview-badge', id); badge.setAttribute('aria-hidden', 'true');
      badge.textContent = '✓';
      badge.title = entry.checked ? 'ClearView · option cleared' : 'ClearView · adjusted';
      badge.style.cssText = 'display:inline-block!important;flex:0 0 auto!important;font:600 14px/1.4 system-ui!important;color:#065F46!important;background:#ECFDF5!important;border:1px solid #6EE7B7!important;border-radius:4px!important;padding:2px 5px!important;margin:3px!important;white-space:nowrap!important;pointer-events:none!important;';
      if (element.parentElement && !['OPTION', 'TR', 'TD', 'TH', 'TBODY', 'THEAD', 'TFOOT'].includes(element.tagName)) {
        element.insertAdjacentElement('afterend', badge); entry.badge = badge;
      }
    }
  }
  return snapshot;
}

export function revertSafeMode(root: AuditRoot, snapshot: RepairSnapshot): void {
  const data = runtime.get(snapshot);
  if (!data || data.root !== root || active.get(root) !== snapshot) return;
  for (const entry of data.records) {
    const { element, record } = entry;
    clearHighlight(element);
    entry.badge?.remove();
    if (entry.keyListener) element.removeEventListener('keydown', entry.keyListener);
    for (const [property, patch] of entry.patches) {
      let status: 'restored' | 'conflict' | 'detached' = 'restored';
      if (!inScope(root, element)) status = 'detached';
      else if (currentAttribute(element, property) !== patch.after) status = 'conflict';
      else if (patch.before !== null) element.setAttribute(property, patch.before);
      else {
        // Flush Blink's lazy CSSOM serialization before removing absent style.
        if (property === 'style') element.getAttribute('style');
        element.removeAttribute(property);
      }
      snapshot.revertOutcomes.push({ clearviewId: record.clearviewElementId, property, status });
    }
    if (entry.checked) {
      const checkbox = element as HTMLInputElement;
      let status: 'restored' | 'conflict' | 'detached' = 'restored';
      if (!inScope(root, element)) status = 'detached';
      else if (checkbox.checked !== entry.checked.after) status = 'conflict';
      else { setChecked(checkbox, entry.checked.before); if (checkbox.checked !== entry.checked.before) status = 'conflict'; }
      snapshot.revertOutcomes.push({ clearviewId: record.clearviewElementId, property: 'checked', status });
    }
  }
  active.delete(root); runtime.delete(snapshot);
}
const highlights=new WeakMap<HTMLElement,{timer:ReturnType<typeof setTimeout>;animation?:Animation;outline:string;priority:string;offset:string;offsetPriority:string;hadStyle:boolean}>();
function clearHighlight(element:HTMLElement):void {
  const initial=highlights.get(element);if(!initial)return;
  clearTimeout(initial.timer);
  initial.animation?.cancel();
  if(initial.outline)element.style.setProperty('outline',initial.outline,initial.priority);else element.style.removeProperty('outline');
  if(initial.offset)element.style.setProperty('outline-offset',initial.offset,initial.offsetPriority);else element.style.removeProperty('outline-offset');
  if(!initial.hadStyle && !element.style.cssText){element.getAttribute('style');element.removeAttribute('style');}
  highlights.delete(element);
}
export function highlightElement(root:AuditRoot,clearviewId:string):boolean {
  const element=findElement(root,clearviewId);if(!element)return false;
  const reducedMotion=element.ownerDocument.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  element.scrollIntoView?.({behavior:reducedMotion ? 'auto' : 'smooth',block:'center',inline:'nearest'});
  const existing=highlights.get(element);
  if(existing){clearTimeout(existing.timer);existing.animation?.cancel();}
  const initial=existing ?? {outline:element.style.getPropertyValue('outline'),priority:element.style.getPropertyPriority('outline'),offset:element.style.getPropertyValue('outline-offset'),offsetPriority:element.style.getPropertyPriority('outline-offset'),hadStyle:element.hasAttribute('style')};
  element.style.setProperty('outline','3px solid #EF4444','important');element.style.setProperty('outline-offset','4px');
  const animation=!reducedMotion && typeof element.animate==='function' ? element.animate(
    [{outlineOffset:'4px',boxShadow:'0 0 0 0 transparent'},{outlineOffset:'8px',boxShadow:'0 0 0 2px #090D16, 0 0 0 6px #38BDF8'},{outlineOffset:'4px',boxShadow:'0 0 0 0 transparent'}],
    {duration:750,iterations:2,easing:'ease-in-out'},
  ) : undefined;
  const timer=setTimeout(()=>clearHighlight(element),1500);
  highlights.set(element,{...initial,timer,animation});
  return true;
}
