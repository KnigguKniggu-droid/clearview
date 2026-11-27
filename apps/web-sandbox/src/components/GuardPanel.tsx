import { useState } from 'react';
import { ShieldCheck, LockKeyhole, RotateCcw, ArrowUpRight, RefreshCw } from 'lucide-react';
import type { AuditReport, FindingCategory } from '@clearview/analyzer';
import { ReceiptCard } from './ReceiptCard';
import { FindingItem } from './FindingItem';

type Baseline = AuditReport['summary'] | null;
export function GuardPanel({ report, baseline, onToggle, onLocate, onRescan, error }: { report: AuditReport | null; baseline: Baseline; onToggle: () => void; onLocate: (id: string) => void; onRescan: () => void; error: string }) {
  const [filter, setFilter] = useState<'all' | FindingCategory>('all');
  const tabs: [typeof filter, string][] = [['all', 'All'], ['dark-pattern', 'Dark Patterns'], ['hidden-fee', 'Hidden Fees'], ['accessibility', 'Accessibility']];
  const active = report?.safeModeActive ?? false;
  const filtered = report?.findings.filter(finding => filter === 'all' || finding.category === filter) ?? [];
  return <aside id="clearview-review" className="guard-column" tabIndex={-1} data-testid="guard-panel" aria-label="ClearView audit inspector">
    <div className="pane-heading"><h2>The clear view</h2><span className={`review-state ${active ? 'review-state-active' : ''}`}>{active ? 'Changes applied' : report ? `${report.summary.totalFindings} findings` : 'Scanning…'}</span></div>
    <section className={`guard-panel ${active ? 'guard-panel-active' : ''}`}>
      {error && <p className="error-message" role="alert">{error}</p>}
      {report && <ReceiptCard report={report} baseline={baseline} onLocate={onLocate} />}
      <div className="safe-control"><button data-testid="safe-toggle" className={`safe-toggle ${active ? 'active' : ''}`} onClick={onToggle} aria-pressed={active} disabled={!report}>{active ? <RotateCcw size={19} /> : <ShieldCheck size={20} />}<span>{active ? 'Safe Mode Active — Revert Changes' : 'Activate Safe & Accessible Mode'}</span>{!active && <ArrowUpRight size={18} />}</button><p>{active ? 'Changes are local. Revert restores the original page.' : 'Uncheck add-ons. Reveal terms. Improve keyboard access.'}</p></div>
      <div className="score-section"><Score label="Trust score" value={report?.summary.trustScore} before={baseline?.trustScore} active={active} /><Score label="Accessibility" value={report?.summary.accessibilityScore} before={baseline?.accessibilityScore} active={active} /></div>
      <div className="score-caption">Selected automated checks · Not a certification</div>
    </section>
      <section className="audit-section" aria-labelledby="audit-heading"><div className="audit-heading"><h3 id="audit-heading">Audit findings <span>{report?.summary.totalFindings ?? '—'}</span></h3><button onClick={onRescan} className="rescan" aria-label="Rescan portal"><RefreshCw size={14} /> Rescan</button></div><div className="filter-tabs" aria-label="Filter audit findings">{tabs.map(([id, label]) => <button key={id} onClick={() => setFilter(id)} aria-pressed={filter === id}>{label}</button>)}</div>
        <div className="findings-feed">{!report ? <p className="feed-empty">Scanning the sample portal…</p> : filtered.length ? filtered.map(finding => <FindingItem key={finding.id} finding={finding} onLocate={onLocate} />) : <div className="feed-empty"><img className="empty-search-art" src="/art/magnifier.webp" alt="" width="72" height="72" /><div><strong>No findings in this filter</strong><p>Only the selected automated rules were checked.</p></div></div>}</div>
      </section>
      <footer className="guard-footer"><LockKeyhole size={14} /><span>Page analysis stays in your browser.</span></footer>
  </aside>;
}

function Score({ label, value, before, active }: { label: string; value?: number; before?: number; active: boolean }) {
  const delta = value !== undefined && before !== undefined ? value - before : 0;
  return <div className="score"><div className="score-label">{label}{active && delta > 0 && <span className="delta">+{delta}</span>}</div><div className="score-number"><strong>{value ?? '—'}</strong><span>/100</span></div><div className="score-track" aria-hidden="true"><span style={{ width: `${value ?? 0}%`, background: (value ?? 0) >= 80 ? '#15803d' : (value ?? 0) >= 50 ? '#b45309' : '#b91c1c' }} /></div></div>;
}
