import { ArrowUpRight } from 'lucide-react';
import type { AuditFinding } from '@clearview/analyzer';

export function FindingItem({ finding, onLocate }: { finding: AuditFinding; onLocate: (id: string) => void }) {
  return <article className={`finding finding-${finding.severity}`} data-finding-category={finding.category}>
    <div className="finding-body"><div className="finding-title"><h4>{finding.title}</h4><span className={`severity ${finding.severity}`}>{finding.severity}</span></div><p>{finding.plainLanguageExplanation}</p><blockquote className="finding-evidence">“{finding.evidenceText || 'Unnamed control'}”</blockquote><div className="finding-meta"><span className="rule-id">{finding.wcagCriterion || finding.ruleId}</span><span>{finding.isAutoRepairable ? 'Repair available' : 'Review needed'}</span><button data-cv-source={finding.clearviewId} onClick={() => onLocate(finding.clearviewId)} aria-label={`Locate: ${finding.title}`}>Locate <ArrowUpRight size={15} /></button></div></div>
  </article>;
}
