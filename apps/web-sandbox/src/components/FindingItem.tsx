import { Eye, CircleDollarSign, Accessibility } from 'lucide-react';
import type { AuditFinding } from '@clearview/analyzer';
function friendlyTitle(finding: AuditFinding): string {
  if (finding.ruleId === 'DP-001') {
    const price = finding.evidenceText.match(/\$\s*\d[\d,.]*(?:\s*\/mo)?/)?.[0];
    return price ? `A ${price} extra is already selected` : 'An extra option is already selected';
  }
  return ({'DP-002':'A price is easy to miss','DP-003':'This wording pressures your choice','DP-004':'A countdown may rush your decision','WCAG-3.3.2':'A form field needs a clear label','WCAG-2.1.1':'A button is hard to use with a keyboard','WCAG-2.4.3':'The keyboard order may be confusing','WCAG-1.4.3':'Text is difficult to read','WCAG-1.1.1':'An image needs a description'} as Record<string,string>)[finding.ruleId] ?? finding.title;
}
export function FindingItem({finding,onLocate}: {finding: AuditFinding; onLocate?: (id:string) => void}) {
  const title = friendlyTitle(finding);
  return <article className={'finding finding-' + finding.severity} data-finding-category={finding.category}>
    <div className="finding-body"><div className="finding-title">{finding.category === 'accessibility' ? <Accessibility size={22} /> : <CircleDollarSign size={22} />}<h4>{title}</h4></div>
      <p>{finding.plainLanguageExplanation}</p>
      {onLocate && <button className="show-source" data-cv-source={finding.clearviewId} onClick={() => onLocate(finding.clearviewId)} aria-label={'Show on Page: ' + title}><Eye size={19} />Show on Page</button>}
      <details className="rule-details"><summary>Rule ID &amp; WCAG Reference</summary><p><code>{finding.ruleId}</code>{finding.wcagCriterion && <> · {finding.wcagCriterion}</>}</p><blockquote>{finding.evidenceText || 'Unnamed control'}</blockquote><p>{finding.isAutoRepairable ? 'A local repair is available for review.' : 'This issue needs manual review.'}</p></details>
    </div>
  </article>;
}
