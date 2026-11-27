import { useState } from 'react';
import { ShieldCheck, RotateCcw, ArrowRight, AlertTriangle, LockKeyhole, CircleCheck } from 'lucide-react';
import type { AuditReport, FinancialCommitment } from '@clearview/analyzer';
import { ReceiptCard } from './ReceiptCard';
import { FindingItem } from './FindingItem';
const dollars = (amount: number) => amount.toLocaleString('en-US', {style:'currency',currency:'USD'});

export function GuardPanel({ report, baseline, verifiedRemovals, selectedOptions, onReview, onRevert, onLocate, readOnly = false, error }: {
  report: AuditReport | null; baseline: AuditReport | null; onReview: () => void; onRevert: () => void;
  onLocate?: (id: string) => void; readOnly?: boolean; error: string; verifiedRemovals: FinancialCommitment[]; selectedOptions: FinancialCommitment[];
}) {
  const [filter, setFilter] = useState<'all' | 'money' | 'access'>('all');
  const tabs = [['all','All Issues'],['money','Money Traps'],['access','Hard to Read']] as const;
  const active = report?.safeModeActive ?? false;
  const fullApply = report?.repairState === 'active' && report.repairSummary.skipped === 0 && report.repairSummary.conflicted === 0;
  const filtered = report?.findings.filter(item => filter === 'all' || (filter === 'access' ? item.category === 'accessibility' : item.category !== 'accessibility')) ?? [];
  const repairable = report?.findings.filter(item => item.isAutoRepairable).length ?? 0;
  const money = report?.findings.filter(item => item.category !== 'accessibility').length ?? 0;
  const barriers = report?.findings.filter(item => item.category === 'accessibility').length ?? 0;
  const optionTotal = selectedOptions.reduce((sum,item) => sum + Math.round(item.numericValue * 100),0) / 100;
  const removedTotal = verifiedRemovals.reduce((sum,item) => sum + Math.round(item.numericValue * 100),0) / 100;
  return <aside id="clearview-review" className="guard-column" tabIndex={-1} data-testid="guard-panel" aria-label="ClearView Assistant">
    <div className="pane-heading"><h2><ShieldCheck size={22} />ClearView Assistant</h2>{readOnly && <span className="review-state">Saved report</span>}</div>
    <div className="hud-scroll">
      {readOnly ? <div className="snapshot-notice"><LockKeyhole size={22} /><p>This is a saved report. Open the original page with the extension to check it again or make changes.</p></div> :
      <section className={'protection-card ' + (active ? 'is-protected' : '')}>
        <div className="protection-heading">{active ? <CircleCheck size={25} /> : <AlertTriangle size={25} />}<h3>{!report ? 'Let’s check this page.' : active ? fullApply ? 'Your selected changes are applied.' : 'Some selected changes are applied.' : report.findings.length ? `We found ${money} potential money traps and ${barriers} accessibility barriers.` : 'No issues found in these checks.'}</h3></div>
        {!active && report && <p>Review the details below. You decide which changes to make.</p>}
        {!active && optionTotal > 0 && <div className="money-at-a-glance"><strong>{dollars(optionTotal)}<span>/month</span></strong><span>in currently selected extras</span></div>}
        {active && <p>{report!.repairSummary.nodes} page elements changed. {removedTotal > 0 ? `${dollars(removedTotal)}/month in selected extras removed from this page.` : 'You can review or restore the changes below.'}</p>}
        <button data-testid="safe-toggle" className={'safe-toggle ' + (active ? 'active' : '')} onClick={active ? onRevert : onReview} aria-pressed={active} disabled={!report || Boolean(error) || (!active && !repairable)}>{active ? <RotateCcw size={21} /> : <ShieldCheck size={21} />}<span>{active ? 'Restore Original Page' : 'Protect Me & Fix This Page'}</span></button>
        <p className="safe-control-meta">{active ? 'Changes are local. Check any remaining issues below.' : 'You review every change first. Removing extras is optional.'}</p>
        {report?.repairState === 'partial' && <p className="partial-notice">Some changes no longer match the page or could not be applied. Restore the original page, then check again.</p>}
        {report?.repairState === 'expired' && <p className="partial-notice">The page replaced the changed elements. Review the new content before making changes again.</p>}
        {!!report && (report.repairSummary.skipped > 0 || report.repairSummary.conflicted > 0) && <p className="partial-notice">{report.repairSummary.skipped} changes skipped. {report.repairSummary.conflicted} conflicts need review.</p>}
      </section>}
      {report && <ReceiptCard report={report} baseline={baseline} verifiedRemovals={verifiedRemovals} selectedOptions={selectedOptions} onLocate={onLocate} />}
      <section className="audit-section" aria-labelledby="audit-heading"><div className="audit-heading"><h3 id="audit-heading">What We Found on This Page <span aria-live="polite">{report ? filter === 'all' ? report.summary.totalFindings : filtered.length + ' of ' + report.summary.totalFindings : '—'}</span></h3></div>
        <div className="filter-tabs" role="group" aria-label="Filter page issues">{tabs.map(([id,label]) => <button key={id} onClick={() => setFilter(id)} aria-pressed={filter === id}>{label}</button>)}</div>
        <div className="findings-feed">{!report ? <p className="feed-empty">{error ? 'We could not finish this check. Resolve the error and try again.' : 'Checking the sample page…'}</p> : filtered.length ? filtered.map(finding => <FindingItem key={finding.id} finding={finding} onLocate={onLocate} />) : <div className="feed-empty"><CircleCheck size={25} /><strong>No issues in this filter</strong><p>These checks cannot find every issue. Always review the final terms.</p>{filter !== 'all' && <button className="text-link" onClick={() => setFilter('all')}>Show all issues <ArrowRight size={18} /></button>}</div>}</div>
      </section>
      {report && <details className="technical-summary"><summary>Technical rule details</summary><p>Trust score: {report.summary.trustScore}/100. Accessibility score: {report.summary.accessibilityScore}/100. These scores describe selected automated checks. They are not certification.</p><p>Several findings can refer to the same page element.</p></details>}
    </div>
  </aside>;
}
