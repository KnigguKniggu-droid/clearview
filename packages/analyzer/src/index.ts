import { auditAria } from './ariaAudit';
import { isSafeModeActive } from './autoRepair';
import { auditContrast } from './contrast';
import { auditDarkPatterns } from './darkPatterns';
import { extractReceipt, receiptTotals } from './receiptExtractor';
import { calculateScores } from './scoring';
import { registerReport } from './dom';
import type { AuditReport, AuditRoot } from './types';

export * from './types';
export {applySafeMode,revertSafeMode,highlightElement} from './autoRepair';
export {parseColor,relativeLuminance,contrastRatio,resolveBackground,getContrastRatio,composite} from './contrast';
export function scanDocument(root:AuditRoot):AuditReport {
  const findings=[...auditDarkPatterns(root),...auditAria(root),...auditContrast(root)];
  const financialCommitments=extractReceipt(root);
  return registerReport(root,{timestamp:new Date().toISOString(),safeModeActive:isSafeModeActive(root),findings,financialCommitments,
    summary:{totalFindings:findings.length,critical:findings.filter(item=>item.severity==='critical').length,warning:findings.filter(item=>item.severity==='warning').length,info:findings.filter(item=>item.severity==='info').length,...calculateScores(findings),...receiptTotals(financialCommitments)},
    limitations:['Heuristic DOM checks are not a full accessibility audit or a guarantee of safety.','Totals include identifiable current fixed USD charges only. Unknown, annual, usage-based, conditional, future, and non-USD amounts remain listed separately.','Closed shadow roots, cross-origin frames, pseudo-elements, background images, and unavailable content require manual review.','Synthetic events may not update every site framework. Confirm the host page totals before proceeding.']});
}
