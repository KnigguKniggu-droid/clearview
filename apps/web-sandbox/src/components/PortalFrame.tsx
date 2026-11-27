import type {ReactNode, RefObject} from 'react';
import {LockKeyhole, ExternalLink, ArrowUpRight, ShieldCheck, AlertTriangle} from 'lucide-react';
export function PortalFrame({children,portalRef,domain,scenario,active,selectedSource,onReturn}: {
  children: ReactNode; portalRef: RefObject<HTMLDivElement|null>; domain:string; scenario:string; active:boolean; selectedSource:string|null; onReturn:() => void;
}) {
  return <section id="source-panel" className="portal-column" aria-label="Interactive sample portal">
    <div className="pane-heading"><h2>Try it on this sample page</h2><a href={'?standalone=' + scenario} target="_blank" rel="noreferrer">Open sample <ExternalLink size={17} /></a></div>
    <div className="browser-frame"><div className={'portal-protection ' + (active ? 'protected' : '')}>{active ? <ShieldCheck size={20} /> : <AlertTriangle size={20} />}<span>{active ? 'Protected by ClearView — selected repairs applied' : 'Unprotected Page — Demo Traps Active'}</span></div>
      <div className="browser-chrome"><div className="address"><LockKeyhole size={16} /><span>{domain}</span></div></div>
      <div className="source-context"><span>Simulated website. No real transaction.</span>{selectedSource && <button onClick={onReturn}>Return to assistant <ArrowUpRight size={18} /></button>}</div>
      <div className="portal-viewport"><div ref={portalRef} data-testid="portal-root">{children}</div></div>
    </div><p className="portal-caption">This sample contains deliberate problems. ClearView’s changes stay inside this page.</p>
  </section>;
}
