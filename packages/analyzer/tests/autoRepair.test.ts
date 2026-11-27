import {beforeEach,describe,expect,it,vi} from 'vitest';
import {applySafeMode,highlightElement,revertSafeMode,scanDocument} from '../src/index';

beforeEach(()=>{document.body.innerHTML='';});
describe('safe repair and rollback',()=>{
  it('repairs the original node when the host inserts a duplicate data id',()=>{
    vi.useFakeTimers();
    document.body.innerHTML='<label><input type="checkbox" checked>Membership $20/mo</label>';
    const original=document.querySelector('input')!;
    const report=scanDocument(document);
    const id=report.findings.find(item=>item.ruleId==='DP-001')!.clearviewId;
    const impostor=document.createElement('input');impostor.type='checkbox';impostor.checked=true;
    impostor.setAttribute('data-clearview-id',id);document.body.prepend(impostor);
    expect(highlightElement(document,id)).toBe(true);
    expect(original.style.outline).toContain('3px');
    expect(impostor.style.outline).toBe('');
    const snapshot=applySafeMode(document,report);
    expect(original.checked).toBe(false);
    expect(impostor.checked).toBe(true);
    revertSafeMode(document,snapshot);
    expect(original.checked).toBe(true);
    expect(impostor.checked).toBe(true);
    vi.runAllTimers();vi.useRealTimers();
  });
  it('does not act on an unscanned replacement bearing a copied data id',()=>{
    document.body.innerHTML='<input placeholder="DOB">';
    const report=scanDocument(document);
    const id=report.findings[0].clearviewId;
    document.body.innerHTML=`<input placeholder="Different field" data-clearview-id="${id}">`;
    const replacement=document.querySelector('input')!;
    expect(highlightElement(document,id)).toBe(false);
    const snapshot=applySafeMode(document,report);
    expect(replacement.getAttribute('aria-label')).toBeNull();
    expect(snapshot.records).toHaveLength(0);
    revertSafeMode(document,snapshot);
  });
  it('rejects a report from another scope and ignores rollback for another scope',()=>{
    document.body.innerHTML='<section><input placeholder="A"></section><aside><input placeholder="B"></aside>';
    const first=document.querySelector('section')!,second=document.querySelector('aside')!;
    const report=scanDocument(first);
    expect(()=>applySafeMode(second,report)).toThrow('Scan this root before applying Safe Mode.');
    expect(scanDocument(second).safeModeActive).toBe(false);
    const snapshot=applySafeMode(first,report);
    revertSafeMode(second,snapshot);
    expect(first.querySelector('input')!.getAttribute('aria-label')).toBe('A');
    expect(scanDocument(first).safeModeActive).toBe(true);
    revertSafeMode(first,snapshot);
    expect(first.querySelector('input')!.getAttribute('aria-label')).toBeNull();
  });
  it('repairs ancestor opacity inside the scan scope and restores it exactly',()=>{
    document.body.innerHTML='<section style="opacity:0.6"><div style="opacity:0.5"><p>Facility fee $100</p></div></section>';
    const root=document.querySelector('section')!;
    const original=root.getAttribute('style');
    const snapshot=applySafeMode(root,scanDocument(root));
    expect(root.style.opacity).toBe('1');
    expect(scanDocument(root).findings.filter(finding=>finding.ruleId==='DP-002')).toHaveLength(0);
    revertSafeMode(root,snapshot);
    expect(root.getAttribute('style')).toBe(original);
    expect(root.querySelector('div')!.style.opacity).toBe('0.5');
  });
  it('repairs styles, labels, focus and choices then restores exact attributes and state',()=>{
    document.body.innerHTML='<section id="root"><label><input type="checkbox" checked>Membership $20/mo</label><p style="color:#9ca3af;font-size:9px">Facility fee $149.00</p><input placeholder="Patient DOB"><div data-clickable tabindex="5">Submit</div></section>';
    const root=document.getElementById('root')!;
    const checkbox=root.querySelector('input')!;
    const events:string[]=[];
    checkbox.addEventListener('change',()=>events.push('change'));
    checkbox.addEventListener('input',()=>events.push('input'));
    const report=scanDocument(root);
    const initial=Array.from(root.querySelectorAll('*')).map(element=>({element,style:element.getAttribute('style'),label:element.getAttribute('aria-label'),role:element.getAttribute('role'),tab:element.getAttribute('tabindex')}));
    const snapshot=applySafeMode(root,report);
    expect(checkbox.checked).toBe(false);
    expect(events).toEqual(['input','change']);
    expect(root.querySelector('[placeholder]')?.getAttribute('aria-label')).toBe('Patient DOB');
    const button=root.querySelector('div')!;
    expect(button.getAttribute('role')).toBe('button');
    expect(button.tabIndex).toBe(0);
    const click=vi.fn();button.addEventListener('click',click);
    button.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
    button.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true}));
    expect(click).toHaveBeenCalledTimes(2);
    expect(document.querySelector('[data-clearview-badge]')).not.toBeNull();
    expect(scanDocument(root).safeModeActive).toBe(true);
    expect(scanDocument(root).summary.totalRecurringMonthly).toBe(0);
    expect(applySafeMode(root,scanDocument(root))).toBe(snapshot);
    revertSafeMode(root,snapshot);
    expect(checkbox.checked).toBe(true);
    expect(events).toEqual(['input','change','input','change']);
    expect(scanDocument(root).safeModeActive).toBe(false);
    for(const saved of initial){expect(saved.element.getAttribute('style')).toBe(saved.style);expect(saved.element.getAttribute('aria-label')).toBe(saved.label);expect(saved.element.getAttribute('role')).toBe(saved.role);expect(saved.element.getAttribute('tabindex')).toBe(saved.tab);}
    expect(document.querySelector('[data-clearview-badge]')).toBeNull();
    button.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
    expect(click).toHaveBeenCalledTimes(2);
    revertSafeMode(root,snapshot);
    expect(events).toHaveLength(4);
  });
  it('keeps repairs scoped and retains existing empty style attributes',()=>{
    document.body.innerHTML='<section><input placeholder="A" style=""></section><aside><input placeholder="B"></aside>';
    const root=document.querySelector('section')!;
    const snapshot=applySafeMode(root,scanDocument(root));
    expect(document.querySelector('aside input')!.hasAttribute('aria-label')).toBe(false);
    revertSafeMode(root,snapshot);
    expect(root.querySelector('input')!.getAttribute('style')).toBe('');
  });
  it('does not add names for unknown images or empty controls',()=>{
    document.body.innerHTML='<img src="test.png"><button></button>';
    const snapshot=applySafeMode(document,scanDocument(document));
    expect(document.querySelector('img')!.hasAttribute('alt')).toBe(false);
    expect(document.querySelector('button')!.hasAttribute('aria-label')).toBe(false);
    revertSafeMode(document,snapshot);
  });
  it('highlights a finding and restores previous outline after two seconds',()=>{
    vi.useFakeTimers();
    document.body.innerHTML='<p style="outline:1px solid blue">Fee $10</p>';
    const p=document.querySelector('p')!;
    const id=scanDocument(document).financialCommitments[0].clearviewId;
    highlightElement(document,id);
    expect(p.style.outline).toContain('3px');
    highlightElement(document,id);
    vi.advanceTimersByTime(2100);
    expect(p.style.outline).toBe('1px solid blue');
    highlightElement(document,'missing');
    vi.useRealTimers();
  });
  it('does not persist a temporary highlight in the repair snapshot',()=>{
    vi.useFakeTimers();
    document.body.innerHTML='<input placeholder="DOB">';
    const input=document.querySelector('input')!;
    const report=scanDocument(document);
    highlightElement(document,report.findings[0].clearviewId);
    const snapshot=applySafeMode(document,report);
    highlightElement(document,report.findings[0].clearviewId);
    revertSafeMode(document,snapshot);
    vi.advanceTimersByTime(2100);
    expect(input.getAttribute('style')).toBeNull();
    vi.useRealTimers();
  });
  it('pulses the outline for two seconds and cancels animation during rollback',()=>{
    vi.useFakeTimers();
    document.body.innerHTML='<input placeholder="DOB">';
    const input=document.querySelector('input')!;
    const cancel=vi.fn();
    const animate=vi.fn(()=>({cancel}));
    Object.defineProperty(input,'animate',{value:animate});
    const report=scanDocument(document);
    const id=report.findings[0].clearviewId;
    highlightElement(document,id);
    expect(animate).toHaveBeenCalledWith(
      [{outlineOffset:'4px'},{outlineOffset:'8px'},{outlineOffset:'4px'}],
      {duration:1000,iterations:2,easing:'ease-in-out'},
    );
    vi.advanceTimersByTime(2000);
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(input.getAttribute('style')).toBeNull();
    const snapshot=applySafeMode(document,report);
    highlightElement(document,id);
    revertSafeMode(document,snapshot);
    expect(cancel).toHaveBeenCalledTimes(2);
    expect(input.getAttribute('style')).toBeNull();
    vi.useRealTimers();
  });
  it('keeps a static ring when the user requests reduced motion',()=>{
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia',vi.fn(()=>({matches:true})));
    document.body.innerHTML='<input placeholder="DOB">';
    const input=document.querySelector('input')!;
    const animate=vi.fn();
    Object.defineProperty(input,'animate',{value:animate});
    const report=scanDocument(document);
    highlightElement(document,report.findings[0].clearviewId);
    expect(animate).not.toHaveBeenCalled();
    expect(input.style.outline).toContain('3px');
    vi.advanceTimersByTime(2000);
    expect(input.getAttribute('style')).toBeNull();
    vi.unstubAllGlobals();vi.useRealTimers();
  });
});
