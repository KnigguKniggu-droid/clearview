import type { AuditReport } from '@clearview/analyzer';

export type GuardAction = 'scan' | 'apply' | 'revert' | 'locate';
export interface GuardRequest {
  source: 'clearview-panel';
  action: GuardAction;
  documentToken?: string;
  clearviewId?: string;
}
export type GuardResponse = {
  ok: true;
  documentToken: string;
  url: string;
  title: string;
  report: AuditReport;
} | { ok: false; error: string };

export function isGuardRequest(value: unknown): value is GuardRequest {
  if (typeof value !== 'object' || value === null) return false;
  const request = value as Record<string, unknown>;
  if (request.source !== 'clearview-panel' || !['scan', 'apply', 'revert', 'locate'].includes(String(request.action))) return false;
  if (request.action !== 'scan' && typeof request.documentToken !== 'string') return false;
  if (request.action === 'locate' && (typeof request.clearviewId !== 'string' || !/^cv-\d+$/.test(request.clearviewId))) return false;
  return true;
}
