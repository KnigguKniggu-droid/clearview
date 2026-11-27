import { useCallback, useEffect, useRef, useState } from 'react';
import { ShieldCheck, RotateCcw, HeartPulse, Wifi, Zap, ArrowUpRight } from 'lucide-react';
import { applySafeMode, highlightElement, revertSafeMode, scanDocument } from '@clearview/analyzer';
import type { AuditReport, RepairSnapshot } from '@clearview/analyzer';
import { MedicalPortal } from './portals/MedicalPortal';
import { SubscriptionCheckout } from './portals/SubscriptionCheckout';
import { UtilityPlanPortal } from './portals/UtilityPlanPortal';
import { PortalFrame } from './components/PortalFrame';
import { GuardPanel } from './components/GuardPanel';

type Scenario = 'medical' | 'subscription' | 'utility';
const scenarios = [
  { id: 'medical' as const, label: 'Medical Billing', short: 'Medical', icon: HeartPulse, domain: 'patient.stjude-regional.example / intake' },
  { id: 'subscription' as const, label: 'Telecom & Stream', short: 'Telecom', icon: Wifi, domain: 'checkout.swiftnet.example / your-plan' },
  { id: 'utility' as const, label: 'LoneStar Utility', short: 'Utility', icon: Zap, domain: 'enroll.lonestar-grid.example / residential' }
];
function Portal({ scenario }: { scenario: Scenario }) { return scenario === 'medical' ? <MedicalPortal /> : scenario === 'subscription' ? <SubscriptionCheckout /> : <UtilityPlanPortal />; }

export default function App() {
  const standalone = new URLSearchParams(location.search).get('standalone');
  if (standalone && ['medical', 'subscription', 'utility'].includes(standalone)) return <main className="standalone"><div className="standalone-note">ClearView sample portal · Simulated data · No real transaction</div><Portal scenario={standalone as Scenario} /></main>;
  return <Sandbox />;
}

function Sandbox() {
  const [scenario, setScenario] = useState<Scenario>('medical');
  const [generation, setGeneration] = useState(0);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [baseline, setBaseline] = useState<{ trustScore: number; accessibilityScore: number } | null>(null);
  const [error, setError] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const snapshot = useRef<RepairSnapshot | null>(null);
  const scan = useCallback(() => {
    if (!root.current) return;
    try { setReport(scanDocument(root.current)); setError(''); } catch (cause) { setError(cause instanceof Error ? cause.message : 'The scan failed. Reset the portal and try again.'); }
  }, []);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => { clearTimeout(timer); timer = setTimeout(scan, 40); };
    element.addEventListener('input', schedule);
    element.addEventListener('change', schedule);
    const observer = new MutationObserver(schedule);
    observer.observe(element, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['style', 'checked', 'hidden', 'aria-label', 'role', 'tabindex'] });
    scan();
    return () => { observer.disconnect(); clearTimeout(timer); element.removeEventListener('input', schedule); element.removeEventListener('change', schedule); if (snapshot.current) { revertSafeMode(element, snapshot.current); snapshot.current = null; } };
  }, [scenario, generation, scan]);
  const reset = (next = scenario) => {
    if (root.current && snapshot.current) revertSafeMode(root.current, snapshot.current);
    snapshot.current = null; setBaseline(null); setReport(null); setScenario(next); setGeneration(value => value + 1);
  };
  const toggle = () => {
    if (!root.current || !report) return;
    try {
      if (snapshot.current) { revertSafeMode(root.current, snapshot.current); snapshot.current = null; setBaseline(null); }
      else { setBaseline(report.summary); snapshot.current = applySafeMode(root.current, report); }
      scan();
      setTimeout(scan, 60);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Safe Mode could not update the page.'); }
  };
  const locate = (id: string) => { if (root.current) highlightElement(root.current, id); };
  const selected = scenarios.find(item => item.id === scenario)!;
  return <>
    <a className="skip-link" href="#workspace">Skip to workspace</a>
    <header className="topbar"><a className="brand" href="/" aria-label="ClearView home"><span><ShieldCheck size={21} /></span>ClearView<span className="brand-divider" /><small>INTERACTIVE LAB</small></a><div className="topbar-right"><span className="privacy-dot" /> Private by design<span className="version">v1.0</span></div></header>
    <main id="workspace" className="workspace"><div className="intro-row"><div><div className="eyebrow">A LITTLE CLARITY GOES A LONG WAY</div><h1>See what you’re agreeing to.</h1><p>Find the fine print. Understand the cost. Take back control.</p></div><div className="demo-note"><span>THREE REAL-WORLD SCENARIOS</span><p>Simulated portals. Real, reversible repairs.</p><ArrowUpRight size={20} /></div></div>
      <nav className="scenario-bar" aria-label="Choose a sample scenario"><div className="scenario-pills">{scenarios.map((item, index) => <button key={item.id} data-testid={`scenario-${item.id}`} className={scenario === item.id ? 'selected' : ''} aria-pressed={scenario === item.id} onClick={() => { if (scenario !== item.id) reset(item.id); }}><item.icon size={16} /><span><span className="scenario-index">0{index + 1}</span> {item.label}</span></button>)}</div><button data-testid="reset-portal" className="reset-button" aria-label="Reset portal state" onClick={() => reset()}><RotateCcw size={14} /><span>Reset portal state</span></button></nav>
      <div className="split-view"><PortalFrame key={`${scenario}-${generation}`} portalRef={root} domain={selected.domain} scenario={scenario}><Portal scenario={scenario} /></PortalFrame><GuardPanel report={report} baseline={baseline} onToggle={toggle} onLocate={locate} onRescan={scan} error={error} /></div>
      <footer className="page-footer"><span><ShieldCheck size={14} /> BUILT FOR CLEARER CHOICES</span><p>Deterministic checks. No AI API. No page data sent to a server.</p><span>Code for Change · 2026</span></footer>
    </main>
  </>;
}
