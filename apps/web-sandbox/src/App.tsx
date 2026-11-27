import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowRight, ChevronDown, FileJson, FileText, FolderOpen, LockKeyhole, PanelRight, RefreshCw, RotateCcw, ShieldCheck, X } from 'lucide-react';
import { applySafeMode, highlightElement, revertSafeMode, scanDocument } from '@clearview/analyzer';
import type { AuditReport, FinancialCommitment, RepairSnapshot } from '@clearview/analyzer';
import { AUDIT_EXPORT_LIMITS, createAuditExport, formatAuditMarkdown, parseAuditExport } from '@clearview/reporting';
import type { AuditExport } from '@clearview/reporting';
import { MedicalPortal } from './portals/MedicalPortal';
import { SubscriptionCheckout } from './portals/SubscriptionCheckout';
import { UtilityPlanPortal } from './portals/UtilityPlanPortal';
import { SeniorTaxReliefPortal } from './portals/SeniorTaxReliefPortal';
import { PortalFrame } from './components/PortalFrame';
import { GuardPanel } from './components/GuardPanel';
import { RepairDialog } from './components/RepairDialog';
import { InstallExtension } from './components/InstallExtension';
import { useAuditMotion } from './hooks/useAuditMotion';
import './hooks/auditMotion.css';
import './portals/portals.css';

type Scenario = 'medical' | 'subscription' | 'senior' | 'utility';
type View = 'workspace' | 'report' | 'install';
type RemovalCandidate = { findingId: string; item: FinancialCommitment; source: HTMLElement; checkbox: HTMLInputElement };
function uniqueSource(root: HTMLElement, id: string): HTMLElement | undefined {
  const matches = Array.from(root.querySelectorAll<HTMLElement>('[data-clearview-id]')).filter(element => element.dataset.clearviewId === id);
  return matches.length === 1 ? matches[0] : undefined;
}
function removalCandidates(root: HTMLElement, reviewed: AuditReport, selectedIds: string[]): RemovalCandidate[] {
  const selected = new Set(selectedIds);
  const candidates: RemovalCandidate[] = [];
  for (const finding of reviewed.findings.filter(item => item.ruleId === 'DP-001' && selected.has(item.id))) {
    const target = uniqueSource(root, finding.clearviewId);
    if (!(target instanceof HTMLInputElement) || target.type !== 'checkbox' || !target.checked) continue;
    for (const item of reviewed.financialCommitments.filter(price => price.includedInTotals && price.currency === 'USD' && price.amountKind === 'charge' && price.cadence === 'monthly')) {
      const source = uniqueSource(root, item.clearviewId);
      if (!source) continue;
      const row = source.closest<HTMLElement>('label, [data-charge], [data-price-row], tr, li') ?? (['SPAN', 'STRONG', 'B', 'EM', 'SMALL'].includes(source.tagName) ? source.parentElement : source);
      const boxes = row?.querySelectorAll('input[type="checkbox"]');
      const linked = boxes?.length === 1 && boxes[0] === target
        || row instanceof HTMLLabelElement && row.control === target;
      if (linked) candidates.push({ findingId: finding.id, item, source, checkbox: target });
    }
  }
  return candidates;
}
function verifiedRemovals(root: HTMLElement | null, report: AuditReport | null, snapshot: RepairSnapshot | null, candidates: RemovalCandidate[]): FinancialCommitment[] {
  if (!root || !report?.safeModeActive || !snapshot) return [];
  const applied = new Set(snapshot.outcomes.filter(item => item.status === 'applied').map(item => item.findingId));
  return candidates.filter(candidate => {
    if (!applied.has(candidate.findingId) || !root.contains(candidate.checkbox) || candidate.checkbox.checked || uniqueSource(root, candidate.item.clearviewId) !== candidate.source) return false;
    const current = report.financialCommitments.find(item => item.id === candidate.item.id);
    return current && !current.includedInTotals && !current.isPreselected && current.exclusionReason === 'Option is not selected or is only suggested.'
      && current.label === candidate.item.label && current.amountText === candidate.item.amountText
      && current.numericValue === candidate.item.numericValue && current.cadence === candidate.item.cadence
      && current.currency === candidate.item.currency && current.amountKind === candidate.item.amountKind;
  }).map(candidate => candidate.item);
}
const scenarios = [
  { id: 'medical' as const, label: 'Medical Bill', number: '1', domain: 'https://billing.stjude-regional.example/pay', detail: 'A facility fee and a recurring membership.' },
  { id: 'subscription' as const, label: 'Internet Checkout', number: '2', domain: 'https://checkout.swiftnet.example/your-plan', detail: 'Selected add-ons and a future renewal rate.' },
  { id: 'senior' as const, label: 'Senior Tax Form', number: '3', domain: 'https://senior-relief.example/review', detail: 'A fictional service fee and support subscription.' }
];
function Portal({ scenario }: { scenario: Scenario }) {
  if (scenario === 'subscription') return <SubscriptionCheckout />;
  if (scenario === 'utility') return <UtilityPlanPortal />;
  if (scenario === 'senior') return <SeniorTaxReliefPortal />;
  return <MedicalPortal />;
}
function saveFile(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], {type}));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = name; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function App() {
  const standalone = new URLSearchParams(location.search).get('standalone');
  if (standalone && ['medical', 'subscription', 'utility', 'senior'].includes(standalone)) {
    return <main className="standalone"><div className="standalone-note">ClearView sample portal · Simulated data · No real transaction</div><Portal scenario={standalone as Scenario} /></main>;
  }
  return <Workspace />;
}
function Workspace() {
  const [view, setView] = useState<View>('workspace');
  const [scenario, setScenario] = useState<Scenario>('medical');
  const [generation, setGeneration] = useState(0);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [baseline, setBaseline] = useState<AuditReport | null>(null);
  const [review, setReview] = useState<AuditReport | null>(null);
  const [imported, setImported] = useState<AuditExport | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const snapshot = useRef<RepairSnapshot | null>(null);
  const removalEvidence = useRef<RemovalCandidate[]>([]);
  const upload = useRef<HTMLInputElement>(null);
  const importSequence = useRef(0);
  const selected = scenarios.find(item => item.id === scenario) ?? scenarios[0];
  const displayedReport = view === 'report' ? imported?.report ?? null : report;
  const removedOptions = view === 'workspace' ? verifiedRemovals(root.current, report, snapshot.current, removalEvidence.current) : [];
  const selectedOptions = view === 'workspace' && root.current && report ? removalCandidates(root.current, report, report.findings.map(item => item.id)).map(candidate => candidate.item) : [];
  useAuditMotion(view === 'workspace' ? report : null);

  const scan = useCallback((clearError = false) => {
    if (!root.current) return;
    try {
      const result = scanDocument(root.current);
      setReport(result);
      if (clearError) setError('');
      return result;
    } catch (cause) {
      setReport(null);
      setError(cause instanceof Error ? cause.message : 'The scan failed. Reset the sample and try again.');
    }
  }, []);
  useEffect(() => {
    if (view !== 'workspace' || !root.current) return;
    const element = root.current;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => { clearTimeout(timer); timer = setTimeout(scan, 80); };
    element.addEventListener('input', schedule); element.addEventListener('change', schedule);
    window.addEventListener('resize', schedule);
    void document.fonts?.ready.then(() => { if (!disposed) schedule(); });
    const observer = new MutationObserver(schedule);
    observer.observe(element, {childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['style', 'checked', 'hidden', 'aria-label', 'role', 'tabindex', 'disabled', 'required']});
    scan();
    return () => {
      disposed = true;
      observer.disconnect(); clearTimeout(timer);
      element.removeEventListener('input', schedule); element.removeEventListener('change', schedule);
      window.removeEventListener('resize', schedule);
      if (snapshot.current) { revertSafeMode(element, snapshot.current); snapshot.current = null; }
    };
  }, [view, scenario, generation, scan]);

  const clearSession = () => {
    if (root.current && snapshot.current) revertSafeMode(root.current, snapshot.current);
    snapshot.current = null; removalEvidence.current = []; setBaseline(null); setReport(null); setReview(null); setSelectedSource(null);
  };
  const navigate = (next: View) => {
    importSequence.current++;
    if (next !== view) clearSession();
    setView(next); setError(''); setNotice(''); setLoadingFile(false);
  };
  const reset = (next = scenario) => {
    importSequence.current++; setLoadingFile(false);
    if (upload.current) upload.current.value = '';
    clearSession(); setScenario(next); setGeneration(value => value + 1);
    setView('workspace'); setError(''); setNotice(next === scenario ? 'Sample restored to its starting state.' : '');
  };
  const rescan = () => {
    const result = scan(true);
    if (result) setNotice('Scan updated. ' + result.summary.totalFindings + ' findings on this page.');
  };
  const apply = (ids: string[]) => {
    if (!root.current || !review) return;
    try {
      if (snapshot.current) revertSafeMode(root.current, snapshot.current);
      setBaseline(review);
      const candidates = removalCandidates(root.current, review, ids);
      const applied = applySafeMode(root.current, review, {findingIds: ids});
      snapshot.current = applied;
      removalEvidence.current = candidates;
      setReview(null);
      const result = scan();
      setNotice(result ? result.repairSummary.nodes + ' page elements changed. ' + result.repairSummary.skipped + ' actions skipped. ' + result.repairSummary.conflicted + ' conflicts.' : 'Review the scan error before continuing.');
    } catch (cause) {
      setReview(null); setError(cause instanceof Error ? cause.message : 'The page could not be changed. Scan again.');
    }
  };
  const revert = () => {
    if (!root.current || !snapshot.current) return;
    const previous = snapshot.current;
    revertSafeMode(root.current, previous);
    snapshot.current = null; removalEvidence.current = []; setBaseline(null);
    const conflicts = previous.revertOutcomes.filter(item => item.status === 'conflict').length;
    scan(); setNotice(conflicts ? 'Reverted owned changes. ' + conflicts + ' newer page changes were preserved.' : 'ClearView changes reverted. Original page state restored.');
  };
  const locate = (id: string) => {
    if (!root.current) return;
    const found = highlightElement(root.current, id);
    if (!found) { setError('This source is no longer on the page. Rescan to review the current content.'); return; }
    setSelectedSource(id); setError('');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('source-panel')?.scrollIntoView({behavior: reduced ? 'instant' : 'smooth', block: 'nearest'});
    setNotice('Source highlighted in the page. Use Return to assistant to continue your review.');
  };
  const exportReport = (format: 'json' | 'markdown') => {
    if (!displayedReport) return;
    try {
      const value = view === 'report' && imported ? imported : createAuditExport(displayedReport, {sourceLabel: selected.label + ' · Simulated portal', sourceKind: 'sample', origin: location.origin});
      saveFile('clearview-audit.' + (format === 'json' ? 'json' : 'md'), format === 'json' ? JSON.stringify(value, null, 2) : formatAuditMarkdown(value), format === 'json' ? 'application/json' : 'text/markdown;charset=utf-8');
      setNotice((format === 'json' ? 'JSON' : 'Markdown') + ' report downloaded. It contains the visible audit evidence, not entered form values.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Report export failed.'); }
  };
  const importFile = async (file?: File) => {
    if (!file) return;
    const sequence = ++importSequence.current;
    setError(''); setNotice(''); setLoadingFile(true);
    try {
      if (file.size > AUDIT_EXPORT_LIMITS.maxBytes) throw new Error('This report is too large. Choose a ClearView JSON export smaller than 1 MB.');
      const value = parseAuditExport(await file.text());
      if (sequence !== importSequence.current) return;
      clearSession(); setImported(value); setView('report');
      setNotice('Report opened locally. This is a saved snapshot; it cannot change a live page.');
    } catch (cause) {
      if (sequence === importSequence.current) setError(cause instanceof Error ? cause.message : 'This file could not be opened.');
    } finally { if (sequence === importSequence.current) { setLoadingFile(false); if (upload.current) upload.current.value = ''; } }
  };

  return <div className="app-shell">
    <a className="skip-link" href="#live-audit">Skip to inspector</a>
    <header className="topbar">
      <button className="brand-pill" onClick={() => navigate('workspace')}><ShieldCheck size={29} /><span className="brand-copy"><strong>ClearView</strong><span className="privacy-badge">On-device protection · No page uploads</span></span></button>
      <nav className="scenario-pills" aria-label="Choose a sample scenario">{scenarios.map(item => <button key={item.id} data-testid={'scenario-' + item.id} aria-pressed={view === 'workspace' && scenario === item.id} className={view === 'workspace' && scenario === item.id ? 'selected' : ''} onClick={() => { if (scenario !== item.id || view !== 'workspace') reset(item.id); }}>{item.number}. {item.label}</button>)}</nav>
      <button data-testid="reset-portal" className="secondary-button reset-demo" onClick={() => reset()}><RotateCcw size={18} />Reset Demo</button>
    </header>
    <main id="live-audit" tabIndex={-1}>
      <input ref={upload} className="visually-hidden" type="file" accept=".json,application/json" aria-label="Open ClearView report file" onChange={event => { void importFile(event.target.files?.[0]); }} />
      {error && <div className="global-message error-message" role="alert"><span>{error}</span><button className="icon-button" aria-label="Dismiss error" onClick={() => setError('')}><X size={17} /></button></div>}
      {view === 'install' ? <InstallExtension /> : view === 'report' && !imported ? <section className="report-empty">
        <div className="report-empty-icon"><FileJson size={32} /></div><span className="eyebrow">Your saved reports</span><h1>Keep the evidence in view.</h1><p>Export a JSON report from the ClearView extension, then open it here to review its findings and charges in a full workspace.</p>
        <button className="primary-button" disabled={loadingFile} onClick={() => upload.current?.click()}><FolderOpen size={18} />{loadingFile ? 'Reading report…' : 'Open a ClearView report'}</button><span className="local-file-note"><LockKeyhole size={14} />The file is read on this device. Nothing is uploaded.</span>
        <button className="text-link" onClick={() => navigate('install')}>Need the extension? <ArrowRight size={15} /></button>
      </section> : <>
        <div className="workspace-toolbar"><div><h1>{view === 'report' ? imported?.source.label : selected.label}</h1><p>{view === 'report' ? 'Saved report · ' + new Date(imported!.createdAt).toLocaleString() : 'Sample page · ' + selected.detail}</p></div>
          <div className="toolbar-actions">{view === 'workspace' ? <><button className="secondary-button" onClick={rescan} aria-label="Rescan portal"><RefreshCw size={16} /><span>Rescan</span></button></> : <button className="secondary-button" onClick={() => upload.current?.click()} disabled={loadingFile}><FolderOpen size={16} />Open another</button>}
            <details className="export-menu"><summary className="secondary-button" aria-label="Export report"><ArrowDownToLine size={16} /><span>Export report</span><ChevronDown size={13} /></summary><div><button disabled={!displayedReport} onClick={event => { exportReport('json'); event.currentTarget.closest('details')?.removeAttribute('open'); }}><FileJson size={16} />JSON · Reopen in ClearView</button><button disabled={!displayedReport} onClick={event => { exportReport('markdown'); event.currentTarget.closest('details')?.removeAttribute('open'); }}><FileText size={16} />Markdown · Read and share</button></div></details>
          </div>
        </div>
        <div className="session-notice" role="status" aria-live="polite"><span className="status-line" aria-hidden="true" />{notice || (view === 'workspace' ? 'Try the demo. Every change is your choice, and you can undo it.' : 'Read-only report. Open the original page with the extension to run a fresh scan.')}</div>
        <div className={'split-view ' + (view === 'report' ? 'snapshot-view' : '')}>
          {view === 'workspace' ? <PortalFrame key={scenario + generation} portalRef={root} domain={selected.domain} scenario={scenario} active={report?.safeModeActive ?? false} selectedSource={selectedSource} onReturn={() => { document.getElementById('clearview-review')?.focus(); document.getElementById('clearview-review')?.scrollIntoView({block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'}); }}><Portal scenario={scenario} /></PortalFrame> :
            <section className="snapshot-context"><span className="eyebrow">Saved evidence</span><h2>{imported!.source.label}</h2><dl><div><dt>Source</dt><dd>{imported!.source.kind === 'extension' ? 'Chrome extension' : 'Simulated sample'}</dd></div><div><dt>Origin</dt><dd>{imported!.source.origin || 'Not included'}</dd></div><div><dt>Captured</dt><dd>{new Date(imported!.report.timestamp).toLocaleString()}</dd></div></dl><h3>What this report can tell you</h3><p>These findings describe the page when it was scanned. Prices, selections, and page content may have changed since then.</p><h3>Analysis limits</h3><ul>{imported!.report.limitations.map(item => <li key={item}>{item}</li>)}</ul><button className="secondary-button" onClick={() => navigate('install')}><PanelRight size={16} />Inspect a live page</button></section>}
          <GuardPanel key={view + scenario + generation} report={displayedReport} baseline={view === 'workspace' ? baseline : null} verifiedRemovals={removedOptions} selectedOptions={selectedOptions} onReview={() => { if (report) setReview(report); }} onRevert={revert} onLocate={view === 'workspace' ? locate : undefined} readOnly={view === 'report'} error={error} />
        </div>
      </>}
    </main>
    <footer className="page-footer"><div><span><LockKeyhole size={16} />Your page stays on your device.</span><p>Selected automated checks. Always confirm the final terms.</p></div><nav aria-label="More ClearView tools"><button className="text-link" onClick={() => navigate('workspace')}>Live workspace</button><button className="text-link" onClick={() => navigate('report')}><FolderOpen size={17} />Open report</button><button className="text-link" onClick={() => navigate('install')}><PanelRight size={17} />Get extension</button><a className="text-link" href="https://github.com/KnigguKniggu-droid/clearview" target="_blank" rel="noreferrer">View source ↗</a></nav></footer>
    {review && <RepairDialog report={review} onApply={apply} onClose={() => setReview(null)} />}
  </div>;
}
