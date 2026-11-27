import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, Info, LocateFixed, LockKeyhole, Receipt, RefreshCw, RotateCcw, ScanLine, ShieldCheck, ShieldAlert } from 'lucide-react';
import type { AuditFinding, AuditReport, FindingCategory, FinancialCommitment } from '@clearview/analyzer';
import { ScanIllustration } from './ScanIllustration';
import { ClearViewMark } from '../../../../packages/brand/ClearViewBrand';
import type { GuardAction, GuardRequest, GuardResponse } from '../protocol';

type Filter = 'all' | FindingCategory;
type TabInfo = { id: number; title: string; url?: string };
type ReportState = { tabId: number; documentToken: string; url: string; report: AuditReport };
const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' }, { value: 'dark-pattern', label: 'Dark Patterns' },
  { value: 'hidden-fee', label: 'Hidden Fees' }, { value: 'accessibility', label: 'Accessibility' }
];
const money = (value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

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
  return <div className="score">
    <span className="score-label">{label}</span>
    <div className="score-number"><strong>{value}</strong><span>/100</span>{before !== undefined && <span className="delta">{value - before >= 0 ? '+' : ''}{value - before}</span>}</div>
  </div>;
}

function ReceiptLine({ item, busy, locate }: { item: FinancialCommitment; busy: boolean; locate: (id: string) => void }) {
  return <li className="receipt-line">
    <button disabled={busy} onClick={() => locate(item.clearviewId)} className="source-link" title="Locate the source price on the page">
      <span>{item.label}</span><LocateFixed size={14} aria-hidden="true" />
    </button>
    <div className="receipt-meta"><strong>{item.amountText}</strong><span>{item.cadence === 'unknown' ? 'Cadence unknown' : item.cadence}</span></div>
    {!item.includedInTotals && <p className="exclusion">{item.exclusionReason || 'Not included in the displayed totals.'}</p>}
    {item.isHiddenOrLowContrast && <span className="tiny-warning">Low-visibility disclosure</span>}
  </li>;
}

function Finding({ finding, locate, busy }: { finding: AuditFinding; locate: (id: string) => void; busy: boolean }) {
  return <article className={`finding ${finding.severity}`}>
    <div className="finding-meta"><span className={`severity ${finding.severity}`}>{finding.severity}</span><span className="rule">{finding.ruleId}</span></div>
    <h3>{finding.title}</h3>
    <p>{finding.plainLanguageExplanation}</p>
    {finding.evidenceText && <blockquote>{finding.evidenceText}</blockquote>}
    <p className="recommendation">{finding.recommendedAction}</p>
    <div className="finding-bottom"><span>{finding.isAutoRepairable ? 'Repair available' : 'Review needed'}</span><button disabled={busy} onClick={() => locate(finding.clearviewId)}><LocateFixed size={14} aria-hidden="true" /> Locate</button></div>
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
      const message: GuardRequest = { source: 'clearview-panel', action, documentToken: result?.documentToken, clearviewId };
      const response = await chrome.tabs.sendMessage<GuardRequest, GuardResponse>(current.id, message);
      if (requestEpoch !== epoch.current) return;
      const confirmed = await activeTab();
      if (requestEpoch !== epoch.current || confirmed.id !== current.id) return;
      if (!response || typeof response !== 'object' || typeof response.ok !== 'boolean') throw new Error('ClearView received an invalid page response. Scan again.');
      if (!response.ok) throw new Error(response.error);
      if (confirmed.url !== response.url) {
        setResult(null);
        setBefore(null);
        throw new Error('The page navigated during this operation. Scan the active tab again.');
      }
      if (!Array.isArray(response.report?.findings) || !Array.isArray(response.report.financialCommitments)) throw new Error('The page report is incomplete. Scan again.');
      if (action === 'apply' && report) setBefore(report.summary);
      if (action === 'revert' || !response.report.safeModeActive) setBefore(null);
      setResult({ tabId: current.id, documentToken: response.documentToken, url: response.url, report: response.report });
      setTab({ id: current.id, title: response.title || current.title, url: response.url });
      setNotice(action === 'apply' ? 'Local page changes applied. Review the site’s own totals before continuing.' : action === 'revert' ? 'Recorded page changes restored.' : action === 'locate' ? 'Source highlighted on the page.' : `${response.report.summary.totalFindings} findings from the current page.`);
    } catch (failure) {
      if (requestEpoch === epoch.current) setError(friendlyError(failure));
    } finally {
      if (requestEpoch === epoch.current) setBusy(false);
    }
  }

  const locate = (id: string) => { void run('locate', id); };
  const matching = report?.findings.filter(item => filter === 'all' || item.category === filter) ?? [];
  const repairable = report?.findings.filter(item => item.isAutoRepairable).length ?? 0;
  const included = report?.financialCommitments.filter(item => item.includedInTotals) ?? [];
  const excluded = report?.financialCommitments.filter(item => !item.includedInTotals) ?? [];

  return <div className="panel">
    <header className="brand"><div className="brand-mark"><ClearViewMark /></div><div><h1>ClearView</h1><p>Your page, made clear.</p></div><span className="local"><LockKeyhole size={12} aria-hidden="true" /> On device</span></header>
    <main>
      <section className="page-context" aria-label="Current page"><strong title={tab?.title}>{tab?.title || 'Finding your active tab…'}</strong><span className="host"><span className="live-dot" />{hostname(tab?.url)}</span></section>
      <button className="scan-button" disabled={busy || !tab} onClick={() => { void run('scan'); }}><ScanLine size={17} aria-hidden="true" />{busy ? 'Working on this page…' : report ? 'Scan page again' : 'Scan active tab'}{report && !busy && <RefreshCw size={14} aria-hidden="true" />}</button>
      {error && <div className="error" role="alert"><AlertTriangle size={18} aria-hidden="true" /><p>{error}</p></div>}
      <p className="notice" role="status" aria-live="polite">{notice}</p>
      {!report && <section className="intro"><ScanIllustration /><h2>See what the page is asking.</h2><p>Inspect selected add-ons, hard-to-read fees, and common accessibility problems.</p><ol><li>Open the page you want to inspect.</li><li>Click the ClearView toolbar icon on that tab.</li><li>Scan the page, then review each source.</li></ol><p className="footnote">Pages stay on your device. ClearView does not submit forms or make payments.</p></section>}
      {report && <>
        <section className="receipt" aria-labelledby="receipt-title"><div className="section-title"><Receipt size={18} aria-hidden="true" /><h2 id="receipt-title">Page receipt</h2></div><div className="totals"><div><span>Due today · USD</span><strong key={`today-${report.summary.totalImmediateDue}`}>{money(report.summary.totalImmediateDue)}</strong></div><div><span>Monthly · USD</span><strong key={`monthly-${report.summary.totalRecurringMonthly}`}>{money(report.summary.totalRecurringMonthly)}</strong></div></div><p className="footnote">Current fixed charges found on this page. Confirm the final amount with the provider.</p>{included.length ? <ul>{included.map(item => <ReceiptLine key={item.id} item={item} locate={locate} busy={busy} />)}</ul> : <p className="empty-line">No current fixed USD charges identified.</p>}{excluded.length > 0 && <details><summary>Other price disclosures ({excluded.length})</summary><ul>{excluded.map(item => <ReceiptLine key={item.id} item={item} locate={locate} busy={busy} />)}</ul></details>}</section>
        <button className={`safe-button ${report.safeModeActive ? 'active' : ''}`} aria-pressed={report.safeModeActive} disabled={busy || (!report.safeModeActive && !repairable)} onClick={() => { void run(report.safeModeActive ? 'revert' : 'apply'); }}>{report.safeModeActive ? <RotateCcw size={20} aria-hidden="true" /> : <ShieldCheck size={20} aria-hidden="true" />}<span>{report.safeModeActive ? 'Revert changes' : 'Apply safe mode'}<small>{report.safeModeActive ? 'Safe mode is on. Restore the recorded page state.' : `${repairable} findings have a local repair`}</small></span></button>
        <section className="scores" aria-label="Page scores"><Score label="Trust score" value={report.summary.trustScore} before={before?.trustScore} /><Score label="Accessibility" value={report.summary.accessibilityScore} before={before?.accessibilityScore} /></section>
        <p className="score-note">Heuristic checks, not a compliance rating.</p>
        <section className="audit" aria-labelledby="audit-title"><div className="section-title"><ShieldAlert size={18} aria-hidden="true" /><h2 id="audit-title">Audit findings</h2><span className="count">{report.summary.totalFindings}</span></div><div className="filters" aria-label="Filter findings">{filters.map(item => <button key={item.value} aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>{item.label}</button>)}</div><div className="finding-list">{matching.map(finding => <Finding key={finding.id} finding={finding} locate={locate} busy={busy} />)}{!matching.length && <div className="empty"><Check size={24} aria-hidden="true" /><p>No findings in this filter.</p><span>This does not prove the page has no other issues.</span></div>}</div></section>
        <details className="limitations"><summary><Info size={15} aria-hidden="true" /> What this scan can tell you</summary><ul>{report.limitations.map(line => <li key={line}>{line}</li>)}<li>Repairs only change the current page. A site may ignore synthetic events or restore its own content.</li><li>Revert restores the captured state and can replace choices you made after activation.</li></ul></details>
      </>}
    </main>
    <footer><LockKeyhole size={13} aria-hidden="true" /><span>Runs on this device. No account. No uploads.</span></footer>
  </div>;
}
