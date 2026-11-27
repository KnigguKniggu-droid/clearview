import type { AuditExport } from './types';
import { assertByteLimit, validateEnvelope } from './validation';

/** Plain Markdown text: escape HTML and Markdown syntax, and keep fields on one line. */
function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/[\\`*_{}[\]()#+\-.!|~]/g, '\\$&').replace(/[\r\n\t]+/g, ' ');
}

export function formatAuditMarkdown(value: AuditExport): string {
  const audit = validateEnvelope(value);
  assertByteLimit(JSON.stringify(audit));
  const { report, source } = audit;
  const lines = [
    '# ClearView saved audit', '',
    'Read-only snapshot. Imported data does not authorize source navigation or page repairs.', '',
    `Source: ${escapeText(source.label)} (${source.kind})`,
    ...(source.origin ? [`Origin: ${escapeText(source.origin)}`] : []),
    `Exported: ${audit.createdAt}`, `Scanned: ${report.timestamp}`, '',
    '## Identified charges', '',
    `- Identified one-time USD charges: $${report.summary.totalImmediateDue.toFixed(2)}`,
    `- Identified monthly USD charges: $${report.summary.totalRecurringMonthly.toFixed(2)}`,
    '- These are identified fixed charges, not a verified complete bill. Excluded rates, future prices, credits, and other currencies remain separate.', '',
    '| Description | Amount shown | Currency | Cadence | Treatment |',
    '|---|---|---|---|---|',
    ...report.financialCommitments.map(item => `| ${escapeText(item.label)} | ${escapeText(item.amountText)} | ${item.currency} | ${item.cadence} | ${item.includedInTotals ? 'Included' : `Excluded: ${escapeText(item.exclusionReason ?? '')}`} |`),
    ...(report.financialCommitments.length ? [] : ['| No charges identified | — | — | — | This does not establish a zero bill. |']), '',
    '## Repair session', '',
    `State: ${report.repairState}. Applied: ${report.repairSummary.applied}; skipped: ${report.repairSummary.skipped}; conflicted: ${report.repairSummary.conflicted}.`,
    `Owned repaired DOM nodes at scan time: ${report.repairSummary.nodes}. One repair action can affect more than one node.`,
    'These are recorded session outcomes, not a guarantee that another page or later page state is repaired.', '',
    '## Selected automated checks', '',
    `${report.summary.totalFindings} findings: ${report.summary.critical} critical, ${report.summary.warning} warning, ${report.summary.info} informational.`,
    `Recorded heuristic scores: trust ${report.summary.trustScore}/100; accessibility ${report.summary.accessibilityScore}/100; combined ${report.summary.overallScore}/100. These are not a trust guarantee or accessibility certification.`, '',
    ...report.findings.flatMap((finding, index) => [
      `### ${index + 1}. ${escapeText(finding.title)}`, '',
      `${finding.severity} · ${finding.category} · ${escapeText(finding.wcagCriterion ?? finding.ruleId)}`,
      escapeText(finding.plainLanguageExplanation),
      `Evidence: ${escapeText(finding.evidenceText) || '(No visible evidence text)'}`,
      `Suggested action: ${escapeText(finding.recommendedAction)}`,
      `Recorded repair availability: ${finding.isAutoRepairable ? 'supported in the source session' : 'manual review needed'}.`, ''
    ]),
    ...(report.findings.length ? [] : ['No findings from the selected checks. This does not establish that a page is safe or fully accessible.', '']),
    '## Limitations', '',
    ...report.limitations.map(item => `- ${escapeText(item)}`),
    '- This file is data supplied by its author. Schema validation does not authenticate the page or verify the claims.', ''
  ];
  return lines.join('\n');
}
