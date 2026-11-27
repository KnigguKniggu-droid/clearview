import { documentOf, elementId, findElement, isReportForRoot, normalize, styleOf, visibleText } from './dom';
import type { AuditReport, AuditRoot, ElementRepairRecord, RepairSnapshot } from './types';

interface RuntimeRecord {element:HTMLElement;record:ElementRepairRecord;keyListener?:EventListener;badge?:HTMLElement}
const active=new WeakMap<AuditRoot,RepairSnapshot>();
const runtime=new WeakMap<RepairSnapshot,{root:AuditRoot;records:RuntimeRecord[]}>();
export const isSafeModeActive=(root:AuditRoot):boolean=>active.has(root);

function setChecked(element: HTMLInputElement,checked:boolean):void {
  const window=element.ownerDocument.defaultView!;
  const setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'checked')?.set;
  if (setter) setter.call(element,checked); else element.checked=checked;
  element.dispatchEvent(new window.Event('input',{bubbles:true}));
  element.dispatchEvent(new window.Event('change',{bubbles:true}));
}
function inferredName(element: HTMLElement): string {
  return normalize(element.getAttribute('placeholder')) || normalize(element.getAttribute('name')) || normalize(element.id.replace(/[-_]/g,' ')) || (element.previousElementSibling ? visibleText(element.previousElementSibling).slice(0,80) : '') || 'Unlabeled field — confirm its purpose';
}
export function applySafeMode(root:AuditRoot,report:AuditReport):RepairSnapshot {
  if(!isReportForRoot(root,report))throw new Error('Scan this root before applying Safe Mode.');
  const previous=active.get(root);
  if (previous) return previous;
  const snapshot:RepairSnapshot={appliedAt:Date.now(),records:[]};
  const records:RuntimeRecord[]=[];
  active.set(root,snapshot);
  runtime.set(snapshot,{root,records});
  const capture=(element:HTMLElement):RuntimeRecord=>{
    const existing=records.find(entry=>entry.element===element);
    if(existing)return existing;
    clearHighlight(element);
    const record:ElementRepairRecord={clearviewElementId:elementId(element),originalStyleCssText:element.style.cssText,originalStyleAttribute:element.getAttribute('style'),originalAriaLabel:element.getAttribute('aria-label'),originalRole:element.getAttribute('role'),originalTabIndex:element.getAttribute('tabindex')};
    const entry:RuntimeRecord={element,record};records.push(entry);snapshot.records.push(record);return entry;
  };
  const grouped=new Map<string,Set<string>>();
  for (const finding of report.findings.filter(finding=>finding.isAutoRepairable)) {
    const rules=grouped.get(finding.clearviewId) ?? new Set<string>();
    rules.add(finding.ruleId);grouped.set(finding.clearviewId,rules);
  }
  for (const [id,rules] of grouped) {
    const element=findElement(root,id);
    if (!element) continue;
    const entry=capture(element),record=entry.record;
    if(rules.has('DP-001') && element.tagName==='INPUT' && (element as HTMLInputElement).type==='checkbox') {
      record.originalChecked=(element as HTMLInputElement).checked;
      setChecked(element as HTMLInputElement,false);
    }
    if(rules.has('DP-002') || rules.has('WCAG-1.4.3')) {
      for(const [property,value] of Object.entries({'background-color':'#FEF08A',color:'#111827','font-size':'13px',opacity:'1',padding:'2px 6px','border-radius':'4px','font-weight':'600'}))element.style.setProperty(property,value,'important');
      for(let ancestor=element.parentElement;ancestor && (root.nodeType===9 || root.contains(ancestor));ancestor=ancestor.parentElement) {
        if(Number(styleOf(ancestor).opacity || 1)<1){capture(ancestor);ancestor.style.setProperty('opacity','1','important');}
        if(ancestor===root)break;
      }
    }
    if(rules.has('WCAG-3.3.2'))element.setAttribute('aria-label',inferredName(element));
    if(rules.has('WCAG-2.1.1')) {
      element.setAttribute('role','button');element.setAttribute('tabindex','0');
      entry.keyListener=(event:Event)=>{
        const key=event as KeyboardEvent;
        if(event.target===element && !key.repeat && !element.hasAttribute('disabled') && element.getAttribute('aria-disabled')!=='true' && (key.key==='Enter' || key.key===' ')){event.preventDefault();element.click();}
      };
      element.addEventListener('keydown',entry.keyListener);record.addedKeyListener=true;
    }
    if(rules.has('WCAG-2.4.3'))element.setAttribute('tabindex','0');
    const badge=documentOf(root).createElement('span');
    badge.setAttribute('data-clearview-badge',id);badge.setAttribute('aria-hidden','true');
    badge.textContent=rules.has('DP-001') ? 'ClearView · option cleared' : 'ClearView · adjusted';
    badge.style.cssText='display:inline-block!important;font:600 10px/1.4 system-ui!important;color:#166534!important;background:#dcfce7!important;border:1px solid #86efac!important;border-radius:4px!important;padding:2px 5px!important;margin:3px!important;pointer-events:none!important;';
    if(element.parentElement && !['OPTION','TR','TD','TH','TBODY','THEAD','TFOOT'].includes(element.tagName)) {
      element.insertAdjacentElement('afterend',badge);entry.badge=badge;
    }
  }
  return snapshot;
}
export function revertSafeMode(root:AuditRoot,snapshot:RepairSnapshot):void {
  const data=runtime.get(snapshot);
  if(!data || data.root!==root || active.get(root)!==snapshot)return;
  for(const {element,record,keyListener,badge} of data.records) {
    clearHighlight(element);
    badge?.remove();
    if(keyListener)element.removeEventListener('keydown',keyListener);
    const restore=(name:string,value:string|null|undefined)=>{
      if(value!=null){element.setAttribute(name,value);return;}
      // Blink can defer serialization after CSSOM writes. Flush the style
      // attribute before removal so a later read cannot recreate style="".
      if(name==='style')element.getAttribute('style');
      element.removeAttribute(name);
    };
    restore('style',record.originalStyleAttribute);
    restore('aria-label',record.originalAriaLabel);restore('role',record.originalRole);restore('tabindex',record.originalTabIndex);
    if(record.originalChecked!==undefined)setChecked(element as HTMLInputElement,record.originalChecked);
  }
  active.delete(root);runtime.delete(snapshot);
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
  element.style.setProperty('outline','3px solid #dc2626','important');element.style.setProperty('outline-offset','4px');
  const animation=!reducedMotion && typeof element.animate==='function' ? element.animate(
    [{outlineOffset:'4px'},{outlineOffset:'8px'},{outlineOffset:'4px'}],
    {duration:1000,iterations:2,easing:'ease-in-out'},
  ) : undefined;
  const timer=setTimeout(()=>clearHighlight(element),2000);
  highlights.set(element,{...initial,timer,animation});
  return true;
}
