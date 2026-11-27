import type { AuditReport } from '@clearview/analyzer';

export type GuardAction = 'scan' | 'apply' | 'revert' | 'locate';
export type OperationResult = { action: 'apply'; applied: number; appliedNodes: number; skipped: number; conflicted: number } | { action: 'revert'; restored: number; conflicted: number; detached: number };
export interface GuardRequest {
  source: 'clearview-panel';
  action: GuardAction;
  documentToken?: string;
  reportId?: string;
  clearviewId?: string;
  findingIds?: string[];
}
export type GuardResponse = {
  ok: true;
  documentToken: string;
  reportId: string;
  url: string;
  title: string;
  report: AuditReport;
  operation?: OperationResult;
  selectedMonthlyOptionIds: string[];
  removedMonthlyOptionIds: string[];
} | { ok: false; error: string; code?: 'STALE_REPORT' | 'PAGE_CHANGED' };

export function isGuardRequest(value: unknown): value is GuardRequest {
  if (typeof value !== 'object' || value === null) return false;
  const request = value as Record<string, unknown>;
  if (request.source !== 'clearview-panel' || !['scan', 'apply', 'revert', 'locate'].includes(String(request.action))) return false;
  if (request.action !== 'scan' && typeof request.documentToken !== 'string') return false;
  if (request.action === 'apply' && (typeof request.reportId !== 'string' || !Array.isArray(request.findingIds) || request.findingIds.length > 10000 || !request.findingIds.every(id => typeof id === 'string'))) return false;
  if (request.action === 'locate' && (typeof request.clearviewId !== 'string' || !/^cv-\d+$/.test(request.clearviewId))) return false;
  return true;
}
