import type { ReactNode, RefObject } from 'react';
import { LockKeyhole, ExternalLink } from 'lucide-react';

export function PortalFrame({ children, portalRef, domain, scenario }: { children: ReactNode; portalRef: RefObject<HTMLDivElement | null>; domain: string; scenario: string }) {
  return <section className="portal-column" aria-label="Interactive sample portal">
    <div className="pane-heading"><h2>The original page</h2><a href={`?standalone=${scenario}`} target="_blank" rel="noreferrer" title="Open this sample for extension testing">Open sample <ExternalLink size={14} /></a></div>
    <div className="browser-frame"><div className="browser-chrome"><div className="address"><LockKeyhole size={13} /><span>{domain}</span></div><span className="sample-tag">Sample</span></div><div className="portal-viewport"><div ref={portalRef} data-testid="portal-root">{children}</div></div></div>
    <div className="portal-caption"><p>This is a working sample. Change an option, or select a receipt line to find it on the page.</p></div>
  </section>;
}
