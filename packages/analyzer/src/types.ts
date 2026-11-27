export type FindingCategory = 'dark-pattern' | 'hidden-fee' | 'accessibility';
export type FindingSeverity = 'critical' | 'warning' | 'info';
export type BillingCadence = 'one-time' | 'monthly' | 'annual' | 'unknown';
export type AuditRoot = Document | HTMLElement;

export interface AuditFinding {
  id: string;
  clearviewId: string;
  category: FindingCategory;
  ruleId: string;
  wcagCriterion?: string;
  severity: FindingSeverity;
  title: string;
  plainLanguageExplanation: string;
  recommendedAction: string;
  evidenceText: string;
  isAutoRepairable: boolean;
}
export interface FinancialCommitment {
  id: string;
  clearviewId: string;
  label: string;
  amountText: string;
  numericValue: number;
  cadence: BillingCadence;
  isPreselected: boolean;
  isHiddenOrLowContrast: boolean;
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'NZD' | 'unknown';
  amountKind: 'charge' | 'credit' | 'refund' | 'unknown';
  includedInTotals: boolean;
  exclusionReason?: string;
}
export interface AuditReport {
  timestamp: string;
  safeModeActive: boolean;
  repairState: 'inactive' | 'active' | 'partial' | 'expired';
  repairSummary: { applied: number; skipped: number; conflicted: number; nodes: number };
  summary: {
    totalFindings: number; critical: number; warning: number; info: number;
    accessibilityScore: number; trustScore: number; overallScore: number;
    totalImmediateDue: number; totalRecurringMonthly: number;
  };
  findings: AuditFinding[];
  financialCommitments: FinancialCommitment[];
  limitations: string[];
}
export interface ElementRepairRecord {
  clearviewElementId: string;
  originalChecked?: boolean;
  originalAriaLabel?: string | null;
  originalRole?: string | null;
  originalTabIndex?: string | null;
  originalStyleCssText: string;
  originalStyleAttribute?: string | null;
  addedKeyListener?: boolean;
}
export interface RepairOptions { findingIds?: readonly string[] }
export interface RepairOutcome {
  findingId: string;
  clearviewId: string;
  status: 'applied' | 'skipped' | 'conflict';
  reason?: string;
}
export interface RevertOutcome {
  clearviewId: string;
  property: string;
  status: 'restored' | 'conflict' | 'detached';
}
export interface RepairSnapshot {
  appliedAt: number;
  records: ElementRepairRecord[];
  outcomes: RepairOutcome[];
  revertOutcomes: RevertOutcome[];
}
