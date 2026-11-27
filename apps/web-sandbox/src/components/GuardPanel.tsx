import { useState } from 'react';
import { ShieldCheck, ShieldAlert, RotateCcw, ArrowUpRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import type { AuditReport, FindingCategory } from '@clearview/analyzer';
import { ReceiptCard } from './ReceiptCard';
import { FindingItem } from './FindingItem';

type Baseline = { trustScore: number; accessibilityScore: number } | null;
export function GuardPanel({ report, baseline, onToggle, onLocate, onRescan, error }: { report: AuditReport | null; baseline: Baseline; onToggle: () => void; onLocate: (id: string) => void; onRescan: () => void; error: string }) {
  const [filter, setFilter] = useState<'all' | FindingCategory>('all');
  const tabs: [typeof filter, string][] = [['all', 'All'], ['dark-pattern', 'Dark Patterns'], ['hidden-fee', 'Hidden Fees'], ['accessibility', 'Accessibility']];
  const active = report?.safeModeActive ?? false;
  const filtered = report?.findings.filter(finding => filter === 'all' || finding.category === filter) ?? [];
  return <aside className="guard-column" data-testid="guard-panel" aria-label="ClearView audit inspector">
    <div className="pane-heading"><span><ShieldCheck size={14} /> YOUR INDEPENDENT INSPECTOR</span><span className="local-badge">On-device</span></div>
    <section className="guard-panel"><header className="guard-header"><div><span className="guard-kicker">CLEARVIEW GUARD</span><h2>Clarity before commitment.</h2></div><ShieldCheck size={29} strokeWidth={1.4} /></header>
      <div className="score-section"><Score label="Trust score" value={report?.summary.trustScore} before={baseline?.trustScore} active={active} /><Score label="Accessibility" value={report?.summary.accessibilityScore} before={baseline?.accessibilityScore} active={active} /></div>
      <div className="score-caption">Heuristic scores · Selected rules, not a certification</div>
      <div className="safe-control"><button data-testid="safe-toggle" className={`safe-toggle ${active ? 'active' : ''}`} onClick={onToggle} aria-pressed={active} disabled={!report}>{active ? <RotateCcw size={19} /> : <ShieldCheck size={20} />}<span>{active ? 'Safe Mode Active — Revert Changes' : 'Activate Safe & Accessible Mode'}</span>{!active && <ArrowUpRight size={18} />}</button><p>{active ? 'Changes are local. Revert restores the original page.' : 'Expose fees. Remove selected add-ons. Repair access.'}</p></div>
      {error && <p className="error-message" role="alert">{error}</p>}
      {report && <ReceiptCard report={report} onLocate={onLocate} />}
      <section className="audit-section" aria-labelledby="audit-heading"><div className="audit-heading"><h3 id="audit-heading">Audit findings <span>{report?.summary.totalFindings ?? '—'}</span></h3><button onClick={onRescan} className="rescan" aria-label="Rescan portal"><RefreshCw size={14} /> Rescan</button></div><div className="filter-tabs" aria-label="Filter audit findings">{tabs.map(([id, label]) => <button key={id} onClick={() => setFilter(id)} aria-pressed={filter === id}>{label}</button>)}</div>
        <div className="findings-feed">{!report ? <p className="feed-empty">Scanning the sample portal…</p> : filtered.length ? filtered.map(finding => <FindingItem key={finding.id} finding={finding} onLocate={onLocate} />) : <div className="feed-empty"><CheckCircle2 size={24} /><strong>No findings in this filter</strong><p>Only the selected automated rules were checked.</p></div>}</div>
      </section>
      <footer className="guard-footer"><ShieldAlert size={14} /><span>Your page stays in your browser. No account. No cloud analysis.</span></footer>
    </section>
  </aside>;
}

function Score({ label, value, before, active }: { label: string; value?: number; before?: number; active: boolean }) {
  const delta = value !== undefined && before !== undefined ? value - before : 0;
  return <div className="score"><div className="score-label">{label}{active && delta > 0 && <span className="delta">+{delta}</span>}</div><div className="score-number"><strong>{value ?? '—'}</strong><span>/100</span></div><div className="score-track" aria-hidden="true"><span style={{ width: `${value ?? 0}%`, background: (value ?? 0) >= 80 ? '#15803d' : (value ?? 0) >= 50 ? '#b45309' : '#b91c1c' }} /></div></div>;
}
