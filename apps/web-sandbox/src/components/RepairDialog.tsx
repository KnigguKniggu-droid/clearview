import { useEffect, useRef, useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import type { AuditReport } from '@clearview/analyzer';
export function RepairDialog({report,onApply,onClose}: {report:AuditReport;onApply:(ids:string[])=>void;onClose:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null);
  const choices=report.findings.filter(item=>item.isAutoRepairable);
  const [selected,setSelected]=useState(()=>new Set(choices.filter(item=>item.ruleId!=='DP-001').map(item=>item.id)));
  useEffect(()=>{const node=dialog.current;const opener=document.activeElement instanceof HTMLElement?document.activeElement:null;node?.showModal();return()=>{node?.close();if(opener?.isConnected)opener.focus({preventScroll:true});};},[]);
  return <dialog ref={dialog} className="repair-dialog" aria-labelledby="repair-title" onCancel={onClose} onKeyDown={event=>{
    if(event.key!=='Tab'||!dialog.current)return;
    const controls=Array.from(dialog.current.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),summary,[tabindex="0"]')).filter(node=>node.getClientRects().length>0);
    const first=controls[0],last=controls.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  }}>
    <div className="dialog-heading"><span className="eyebrow">You stay in control</span><button className="icon-button" aria-label="Close repair review" onClick={onClose}><X size={22}/></button></div>
    <h2 id="repair-title">Choose what ClearView changes.</h2><p className="dialog-intro">Review each change below. Removing a selected add-on is always your choice.</p>
    <div className="repair-choices">{choices.map(item=><div key={item.id} className={'repair-choice '+(item.ruleId==='DP-001'?'choice-financial':'')}><label><input type="checkbox" checked={selected.has(item.id)} onChange={event=>setSelected(previous=>{const next=new Set(previous);if(event.target.checked)next.add(item.id);else next.delete(item.id);return next;})}/><span><strong>{item.ruleId==='DP-001'?'Remove selected add-on':item.title}</strong><span>{item.recommendedAction}</span><small>{item.evidenceText||'Unnamed page control'}</small></span></label><details className="rule-details"><summary>Technical rule details</summary><p><code>{item.ruleId}</code>{item.wcagCriterion&&<> · {item.wcagCriterion}</>}</p></details></div>)}</div>
    <footer className="dialog-actions"><span>{selected.size} change{selected.size===1?'':'s'} selected. You can undo these.</span><button className="primary-button" disabled={!selected.size} onClick={()=>onApply([...selected])}><ShieldCheck size={20}/>Apply selected changes</button></footer>
  </dialog>;
}
