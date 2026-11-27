import type { ReactNode, RefObject } from 'react';
import { LockKeyhole, ExternalLink } from 'lucide-react';

export function PortalFrame({ children, portalRef, domain, scenario }: { children: ReactNode; portalRef: RefObject<HTMLDivElement | null>; domain: string; scenario: string }) {
  return <section className="portal-column" aria-label="Interactive sample portal">
    <div className="pane-heading"><span><span className="live-dot" /> LIVE SAMPLE PORTAL</span><a href={`?standalone=${scenario}`} target="_blank" rel="noreferrer" title="Open this sample for extension testing">Open sample <ExternalLink size={13} /></a></div>
    <div className="browser-frame"><div className="browser-chrome"><div className="window-dots"><i /><i /><i /></div><div className="address"><LockKeyhole size={12} /><span>{domain}</span></div><span className="sample-tag">SIMULATED</span></div><div className="portal-viewport"><div ref={portalRef} data-testid="portal-root">{children}</div></div></div>
    <div className="portal-caption"><span className="caption-number">01 / INSPECT</span><p>Try the portal as it is. Then activate Safe Mode to see what changes.</p></div>
  </section>;
}
