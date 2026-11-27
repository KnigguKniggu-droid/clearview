import { LocateFixed, TriangleAlert, Accessibility, ReceiptText } from 'lucide-react';
import type { AuditFinding } from '@clearview/analyzer';

export function FindingItem({ finding, onLocate }: { finding: AuditFinding; onLocate: (id: string) => void }) {
  const Icon = finding.category === 'accessibility' ? Accessibility : finding.category === 'hidden-fee' ? ReceiptText : TriangleAlert;
  return <article className={`finding finding-${finding.severity}`} data-finding-category={finding.category}>
    <div className="finding-icon"><Icon size={17} /></div><div className="finding-body"><div className="finding-title"><h4>{finding.title}</h4><span className={`severity ${finding.severity}`}>{finding.severity}</span></div><p>{finding.plainLanguageExplanation}</p><div className="finding-evidence">“{finding.evidenceText || 'Unnamed control'}”</div><div className="finding-meta"><span className="rule-id">{finding.wcagCriterion || finding.ruleId}</span><span>{finding.isAutoRepairable ? 'Safe Mode repair' : 'Review needed'}</span><button onClick={() => onLocate(finding.clearviewId)} aria-label={`Locate: ${finding.title}`}><LocateFixed size={14} /> Locate</button></div></div>
  </article>;
}
