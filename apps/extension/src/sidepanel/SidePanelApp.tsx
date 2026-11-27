import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, Download, Info, LocateFixed, LockKeyhole, Receipt, RefreshCw, RotateCcw, ScanLine, ShieldCheck, ShieldAlert } from 'lucide-react';
import type { AuditFinding, AuditReport, FinancialCommitment } from '@clearview/analyzer';
import { createAuditExport } from '@clearview/reporting';
import { ClearViewMark } from '../../../../packages/brand/ClearViewBrand';
import type { GuardAction, GuardRequest, GuardResponse, OperationResult } from '../protocol';

type Filter = 'all' | 'money' | 'readability';
type TabInfo = { id: number; title: string; url?: string };
type ReportState = { tabId: number; documentToken: string; reportId: string; url: string; report: AuditReport; selectedMonthlyOptionIds: string[] };
const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All Issues' }, { value: 'money', label: 'Money Traps' },
  { value: 'readability', label: 'Hard to Read' }
];
const money = (value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const defaultSelection = (report: AuditReport) => report.findings.filter(item => item.isAutoRepairable && item.ruleId !== 'DP-001').map(item => item.id);

function operationNotice(operation?: OperationResult): string {
  if (!operation) return '';
  if (operation.action === 'apply') return `${operation.appliedNodes} page targets changed for ${operation.applied} findings. ${operation.skipped} skipped. ${operation.conflicted} could not be applied. Confirm the site’s own totals.`;
  return `${operation.restored} properties restored. ${operation.conflicted} later changes preserved. ${operation.detached} detached targets skipped.`;
}

async function activeTab(): Promise<TabInfo> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (typeof tab?.id !== 'number') throw new Error('No active tab was found. Open a webpage and try again.');
  return { id: tab.id, title: tab.title || 'Active tab', url: tab.url };
}
function hostname(url?: string): string {
  if (!url) return 'Click the toolbar icon to grant page access';
  try { return new URL(url).hostname || 'Browser page'; } catch { return 'Active tab'; }
}
function friendlyError(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  if (/cannot access|missing host permission|extensions gallery|chrome:\/\/|not allowed/i.test(text)) return 'Page access is not available. Switch to a regular webpage, click the ClearView toolbar icon on that tab, then scan again.';
  if (/receiving end|message port|frame.*removed|tab.*closed/i.test(text)) return 'The tab changed while ClearView was working. Scan the active tab again.';
  return text;
}

function Score({ label, value, before }: { label: string; value: number; before?: number }) {
  const [displayed, setDisplayed] = useState(value);
  const current = useRef(value);
  useEffect(() => {
    const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const settle = () => { cancelAnimationFrame(frame); current.current = value; setDisplayed(value); };
    if (motion?.matches || typeof requestAnimationFrame !== 'function') { settle(); return; }
    const from = current.current;
    const start = performance.now();
    const paint = (now: number) => {
      const progress = Math.min(1, (now - start) / 300);
      current.current = Math.round(from + (value - from) * (1 - (1 - progress) ** 3));
      setDisplayed(current.current);
      if (progress < 1) frame = requestAnimationFrame(paint);
    };
    frame = requestAnimationFrame(paint);
    motion?.addEventListener('change', settle);
    return () => { cancelAnimationFrame(frame); motion?.removeEventListener('change', settle); };
  }, [value]);
  return <div className="score" aria-label={`${label}: ${value} out of 100`}>
    <span className="score-label">{label}</span>
    <div className="score-number" aria-hidden="true"><strong>{displayed}</strong><span>/100</span>{before !== undefined && <span className="delta">{value - before >= 0 ? '+' : ''}{value - before}</span>}</div>
    <div className="score-segments" aria-hidden="true">{Array.from({ length: 10 }, (_, index) => <span key={index} className={value >= (index + 1) * 10 ? 'filled' : ''} />)}</div>
  </div>;
}

function ReceiptLine({ item, busy, locate, removed = false }: { item: FinancialCommitment; busy: boolean; locate: (id: string) => void; removed?: boolean }) {
  return <li className="receipt-line">
    <div className="receipt-status">{removed ? <Check size={18} aria-hidden="true" /> : item.isHiddenOrLowContrast ? <AlertTriangle size={18} aria-hidden="true" /> : <Info size={18} aria-hidden="true" />}<span>{removed ? 'Selected extra removed from this page' : item.isHiddenOrLowContrast ? 'Hard-to-read amount' : item.includedInTotals ? 'Included in identified charges' : 'Listed separately'}</span></div>
    <button disabled={busy} onClick={() => locate(item.clearviewId)} className="source-link" title="Show the source price on the page"><span>{item.label}</span><LocateFixed size={18} aria-hidden="true" /></button>
    <div className="receipt-meta"><strong>{removed ? <s>{item.amountText}</s> : item.amountText}</strong><span>{item.cadence === 'unknown' ? 'Timing unknown' : item.cadence}</span></div>
    {!item.includedInTotals && <p className="exclusion">{item.exclusionReason || 'Not included in the displayed totals.'}</p>}
  </li>;
}

function Finding({ finding, locate, busy }: { finding: AuditFinding; locate: (id: string) => void; busy: boolean }) {
  return <article className={`finding ${finding.severity}`}>
    <div className="finding-heading"><AlertTriangle size={21} aria-hidden="true" /><h3>{finding.title}</h3></div>
    <p>{finding.plainLanguageExplanation}</p>
    {finding.evidenceText && <blockquote>{finding.evidenceText}</blockquote>}
    <p className="recommendation">{finding.recommendedAction}</p>
    <div className="finding-bottom"><span>{finding.isAutoRepairable ? 'A local fix is available' : 'Please review this choice'}</span><button disabled={busy} onClick={() => locate(finding.clearviewId)}><LocateFixed size={18} aria-hidden="true" /> Show on Page</button></div>
    <details className="technical-reference"><summary>Rule ID &amp; WCAG Reference</summary><p>{finding.ruleId}{finding.ruleId.startsWith('WCAG-') ? ' — a limited automated check, not a compliance finding.' : ' — a ClearView heuristic, not proof of deception.'}</p></details>
  </article>;
}

export function SidePanelApp() {
  const [tab, setTab] = useState<TabInfo | null>(null);
  const [result, setResult] = useState<ReportState | null>(null);
  const [before, setBefore] = useState<AuditReport['summary'] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selection, setSelection] = useState<string[]>([]);
  const [stale, setStale] = useState(false);
  const [operation, setOperation] = useState<OperationResult>();
  const [removedExtras, setRemovedExtras] = useState<FinancialCommitment[]>([]);
  const epoch = useRef(0);
  const tabId = useRef<number | null>(null);
  const report = result?.report;

  useEffect(() => {
    let disposed = false;
    async function updateTab() {
      const request = ++epoch.current;
      setBusy(false);
      setResult(null);
      setBefore(null);
      setError('');
      setNotice('');
      setFilter('all');
      setSelection([]);
      setStale(false);
      setOperation(undefined);
      setRemovedExtras([]);
      try {
        const next = await activeTab();
        if (!disposed && request === epoch.current) {
          tabId.current = next.id;
          setTab(next);
        }
      } catch (failure) {
        if (!disposed && request === epoch.current) setError(friendlyError(failure));
      }
    }
    const onActivated = () => { void updateTab(); };
    const onUpdated = (id: number, change: chrome.tabs.TabChangeInfo) => {
      if (id === tabId.current && (change.status === 'loading' || change.url)) void updateTab();
    };
    const onRemoved = (id: number) => { if (id === tabId.current) void updateTab(); };
    chrome.tabs.onActivated.addListener(onActivated);
    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.tabs.onRemoved.addListener(onRemoved);
    void updateTab();
    return () => {
      disposed = true;
      epoch.current += 1;
      chrome.tabs.onActivated.removeListener(onActivated);
      chrome.tabs.onUpdated.removeListener(onUpdated);
      chrome.tabs.onRemoved.removeListener(onRemoved);
    };
  }, []);

  async function run(action: GuardAction, clearviewId?: string) {
    if (busy) return;
    const requestEpoch = ++epoch.current;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const current = await activeTab();
      if (requestEpoch !== epoch.current) return;
      if (action !== 'scan' && (!result || current.id !== result.tabId || current.url !== result.url)) {
        setResult(null);
        setBefore(null);
        throw new Error('The active tab changed. Scan this tab before applying changes.');
      }
      if (!current.url || !/^https?:\/\//i.test(current.url)) {
        throw new Error('Open a regular http or https webpage and click the ClearView toolbar icon on that tab. Browser pages cannot be audited.');
      }
      tabId.current = current.id;
      setTab(current);
      if (action === 'scan') {
        await chrome.scripting.executeScript({ target: { tabId: current.id }, files: ['contentScript.js'] });
      }
      const message: GuardRequest = { source: 'clearview-panel', action, documentToken: result?.documentToken, reportId: result?.reportId, clearviewId, ...(action === 'apply' ? { findingIds: selection } : {}) };
      const response = await chrome.tabs.sendMessage<GuardRequest, GuardResponse>(current.id, message);
      if (requestEpoch !== epoch.current) return;
      const confirmed = await activeTab();
      if (requestEpoch !== epoch.current || confirmed.id !== current.id) return;
      if (!response || typeof response !== 'object' || typeof response.ok !== 'boolean') throw new Error('ClearView received an invalid page response. Scan again.');
      if (!response.ok) {
        if (response.code === 'STALE_REPORT' || response.code === 'PAGE_CHANGED') setStale(true);
        throw new Error(response.error);
      }
      if (confirmed.url !== response.url) {
        setResult(null);
        setBefore(null);
        throw new Error('The page navigated during this operation. Scan the active tab again.');
      }
      if (!Array.isArray(response.report?.findings) || !Array.isArray(response.report.financialCommitments)) throw new Error('The page report is incomplete. Scan again.');
      if (action === 'apply' && report && response.operation?.action === 'apply' && response.operation.applied > 0) setBefore(report.summary);
      setRemovedExtras(response.report.financialCommitments.filter(item => response.removedMonthlyOptionIds?.includes(item.id)));
      if (action === 'revert' || !response.report.safeModeActive) setBefore(null);
      setResult({ tabId: current.id, documentToken: response.documentToken, reportId: response.reportId, url: response.url, report: response.report, selectedMonthlyOptionIds: response.selectedMonthlyOptionIds ?? [] });
      if (action !== 'locate') {
        setSelection(defaultSelection(response.report));
        setStale(false);
        setOperation(response.operation);
      }
      setTab({ id: current.id, title: response.title || current.title, url: response.url });
      setNotice(operationNotice(response.operation) || (action === 'locate' ? 'Source highlighted on the page.' : `${response.report.summary.totalFindings} findings from the current page.`));
    } catch (failure) {
      if (requestEpoch === epoch.current) setError(friendlyError(failure));
    } finally {
      if (requestEpoch === epoch.current) setBusy(false);
    }
  }

  const locate = (id: string) => { void run('locate', id); };
  function downloadReport() {
    if (!result) return;
    try {
      const data = createAuditExport(result.report, { sourceLabel: hostname(result.url), sourceKind: 'extension', origin: result.url });
      const url = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `clearview-report-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice('Report downloaded locally. It contains this scan’s evidence and source origin.');
    } catch (failure) { setError(friendlyError(failure)); }
  }
  const choose = (id: string, checked: boolean) => setSelection(current => checked ? [...new Set([...current, id])] : current.filter(item => item !== id));
  const matching = report?.findings.filter(item => filter === 'all' || (filter === 'money' ? item.category !== 'accessibility' : item.ruleId === 'DP-002' || item.ruleId === 'WCAG-1.4.3')) ?? [];
  const repairable = report?.findings.filter(item => item.isAutoRepairable) ?? [];
  const included = report?.financialCommitments.filter(item => item.includedInTotals) ?? [];
  const excluded = report?.financialCommitments.filter(item => !item.includedInTotals && !removedExtras.some(removed => removed.id === item.id)) ?? [];

  const moneyTraps = report?.findings.filter(item => item.category !== 'accessibility').length ?? 0;
  const accessBarriers = report?.findings.filter(item => item.category === 'accessibility').length ?? 0;
  const currentExtras = report?.financialCommitments.filter(item => result?.selectedMonthlyOptionIds.includes(item.id)) ?? [];
  const extraMonthly = currentExtras.reduce((cents, item) => cents + Math.round(item.numericValue * 100), 0) / 100;
  const removedMonthly = removedExtras.reduce((cents, item) => cents + Math.round(item.numericValue * 100), 0) / 100;
  const fullApply = report?.repairState === 'active' && report.repairSummary.skipped === 0 && report.repairSummary.conflicted === 0;

  return <div className="panel">
    <header className="brand"><div className="brand-mark"><ClearViewMark /></div><div><h1>ClearView Assistant</h1><p>Understand this page. Keep your choice.</p></div></header>
    <main>
      <section className="page-context" aria-label="Current page"><strong title={tab?.title}>{tab?.title || 'Finding your active tab…'}</strong><span className="host"><LockKeyhole size={16} aria-hidden="true" />{hostname(tab?.url)}</span></section>
      <button className="scan-button" disabled={busy || !tab} onClick={() => { void run('scan'); }}><ScanLine size={20} aria-hidden="true" />{busy ? 'Checking this page…' : stale ? 'Rescan changed page' : report ? 'Scan page again' : 'Scan active tab'}{report && !busy && <RefreshCw size={16} aria-hidden="true" />}</button>
      {error && <div className="error" role="alert"><AlertTriangle size={21} aria-hidden="true" /><p>{error}</p></div>}
      <p className="notice" role="status" aria-live="polite">{notice}</p>
      {!report && <section className="intro card"><ShieldCheck size={36} aria-hidden="true" /><h2>A clearer view before you continue.</h2><p>Check selected extras, hard-to-read charges, and common barriers to using this page.</p><ol><li>Open the page you want to inspect.</li><li>Click the ClearView toolbar icon.</li><li>Scan, review the sources, and choose your changes.</li></ol><p className="footnote">The page stays on your device. ClearView does not submit forms or make payments.</p></section>}
      {report && <>
        <section className={`summary-card card ${report.safeModeActive ? 'applied' : ''}`} aria-labelledby="summary-title">
          {report.safeModeActive ? <Check size={26} aria-hidden="true" /> : <ShieldCheck size={26} aria-hidden="true" />}
          <h2 id="summary-title">{fullApply ? 'Your selected changes are applied' : report.safeModeActive ? 'Some selected changes are applied' : `We found ${moneyTraps} potential money traps and ${accessBarriers} accessibility barriers`}</h2>
          {report.safeModeActive ? <p>{report.repairSummary.nodes} page items currently repaired. These changes do not make the entire page safe or certified.</p> : <p>Review these automated findings before you continue. Optional choices stay selected unless you choose to change them.</p>}
          {!report.safeModeActive && currentExtras.length > 0 && <p className="extra-summary"><strong>{money(extraMonthly)}/month</strong> in currently selected extras.</p>}
          {removedExtras.length > 0 && <p className="extra-summary"><strong>{money(removedMonthly)}/month</strong> in selected monthly extras removed from this page. Confirm the provider’s total; this does not cancel a subscription.</p>}
          <button className={`safe-button ${report.safeModeActive ? 'active' : ''}`} aria-pressed={report.safeModeActive} disabled={busy || (!report.safeModeActive && (stale || selection.length === 0))} onClick={() => { void run(report.safeModeActive ? 'revert' : 'apply'); }}>{report.safeModeActive ? <RotateCcw size={21} aria-hidden="true" /> : <ShieldCheck size={21} aria-hidden="true" />}<span>{report.safeModeActive ? 'Restore Original Page' : 'Protect Me & Fix This Page'}</span></button>
          <p className="action-scope">{report.safeModeActive ? 'Restores recorded properties. Later conflicting changes are preserved.' : `${selection.length} reviewed changes selected. Financial extras need your explicit choice below.`}</p>
          {!report.safeModeActive && <button className="review-link" onClick={() => { const section = document.getElementById('change-review'); section?.scrollIntoView({ block: 'start', behavior: 'auto' }); section?.focus(); }}>Review the selected changes</button>}
        </section>
        {(report.repairState === 'expired' || report.repairState === 'partial') && <p className="session-warning" role="status">{report.repairState === 'expired' ? 'The site changed the recorded repairs. Review the current findings before choosing new changes.' : 'Some recorded repairs changed or disappeared. Restore the remaining changes before choosing a new set.'}</p>}
        {operation && <p className="operation-result">{operationNotice(operation)}</p>}
        <section className="receipt card" aria-labelledby="receipt-title"><div className="section-title"><Receipt size={23} aria-hidden="true" /><h2 id="receipt-title">What You Are Actually Paying</h2></div><p className="receipt-scope">Identified amounts from this page, not a verified bill. Fixed USD charges only. Confirm the provider’s final amount.</p>{included.length > 0 && <div className="totals"><div><span>Due now · identified</span><strong key={`today-${report.summary.totalImmediateDue}`}>{money(report.summary.totalImmediateDue)}</strong></div><div><span>Monthly · identified</span><strong key={`monthly-${report.summary.totalRecurringMonthly}`}>{money(report.summary.totalRecurringMonthly)}</strong></div></div>}{included.length ? <ul>{included.map(item => <ReceiptLine key={item.id} item={item} locate={locate} busy={busy || stale} />)}</ul> : <p className="empty-line">No current fixed USD amount identified. That does not mean the page is free.</p>}{removedExtras.length > 0 && <ul className="removed-extras">{removedExtras.map(item => <ReceiptLine key={item.id} item={item} locate={locate} busy={busy || stale} removed />)}</ul>}{excluded.length > 0 && <details><summary>Other price disclosures ({excluded.length})</summary><ul>{excluded.map(item => <ReceiptLine key={item.id} item={item} locate={locate} busy={busy || stale} removed={removedExtras.some(removed => removed.id === item.id)} />)}</ul></details>}</section>
        {!report.safeModeActive && <section id="change-review" tabIndex={-1} className="repair-preview card" aria-labelledby="repair-title"><h2 id="repair-title">Choose what changes</h2><p>Read each choice before applying. Issue filters do not change this selection.</p>{[{ financial: false, title: 'Make the page easier to read and use' }, { financial: true, title: 'Optional extras — your choice' }].map(group => {
          const choices = repairable.filter(item => (item.ruleId === 'DP-001') === group.financial);
          return choices.length > 0 && <fieldset key={group.title} disabled={busy || stale}><legend>{group.title}</legend>{group.financial && <p>Check a change only if you want to uncheck that option on the page.</p>}{choices.map(item => <label className="repair-option" data-rule={item.ruleId} key={item.id}><input type="checkbox" checked={selection.includes(item.id)} onChange={event => choose(item.id, event.target.checked)} /><span><strong>{group.financial ? 'Uncheck this option' : item.title}</strong><span>{item.evidenceText || item.recommendedAction}</span></span></label>)}</fieldset>;
        })}{repairable.length === 0 && <p>No supported local changes in this report. Review the remaining issues on the page.</p>}</section>}
        <section className="audit" aria-labelledby="audit-title"><div className="section-title"><ShieldAlert size={23} aria-hidden="true" /><h2 id="audit-title">What needs attention</h2><span className="count">{report.summary.totalFindings}</span></div><div className="filters" aria-label="Filter issues">{filters.map(item => <button key={item.value} aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>{item.label}</button>)}</div><div className="finding-list">{matching.map(finding => <Finding key={finding.id} finding={finding} locate={locate} busy={busy || stale} />)}{!matching.length && <div className="empty card"><Check size={25} aria-hidden="true" /><p>No issues in this filter.</p><span>Other issues may still be present on the page.</span></div>}</div></section>
        <details className="score-details card"><summary>View automated check scores</summary><section className="scores" aria-label="Page scores"><Score label="Trust checks" value={report.summary.trustScore} before={before?.trustScore} /><Score label="Access checks" value={report.summary.accessibilityScore} before={before?.accessibilityScore} /></section><p className="score-note">These heuristic scores are not a safety or accessibility certification.</p></details>
        <div className="report-tools"><p className="footnote">Scanned {new Date(report.timestamp).toLocaleTimeString()}. {stale ? 'Please rescan this changed page.' : 'Relevant page changes are checked again before applying.'}</p><button className="export-button" disabled={busy} onClick={downloadReport}><Download size={19} aria-hidden="true" /> Save report JSON</button></div>
        <details className="limitations"><summary><Info size={19} aria-hidden="true" /> What this scan can tell you</summary><ul>{report.limitations.map(line => <li key={line}>{line}</li>)}<li>Changes stay on the current page. The site may reject or replace them.</li><li>Restore changes only recorded properties that still match the applied value. Later edits can be skipped.</li></ul></details>
      </>}
    </main>
    <footer><LockKeyhole size={17} aria-hidden="true" /><span>Private on this device. No account. No uploads.</span></footer>
  </div>;
}
