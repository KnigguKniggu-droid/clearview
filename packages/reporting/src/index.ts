import type { AuditReport } from '@clearview/analyzer';
import type { AuditExport, AuditExportMetadata } from './types';
import { assertByteLimit, objectFields, validateEnvelope } from './validation';

export type { AuditExport, AuditExportMetadata, AuditExportSource } from './types';
export { AUDIT_EXPORT_LIMITS } from './validation';
export { formatAuditMarkdown } from './markdown';

export function createAuditExport(report: AuditReport, meta: AuditExportMetadata): AuditExport {
  const metadata = objectFields(meta, 'metadata', ['sourceLabel', 'sourceKind'], ['origin']);
  const result = validateEnvelope({
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    source: { label: metadata.sourceLabel, kind: metadata.sourceKind, ...(metadata.origin === undefined ? {} : { origin: metadata.origin }) },
    report
  });
  assertByteLimit(JSON.stringify(result, null, 2));
  return result;
}

export function parseAuditExport(text: string): AuditExport {
  if (typeof text !== 'string') throw new Error('Audit export must be JSON text.');
  assertByteLimit(text);
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { throw new Error('Audit export is not valid JSON. Choose a ClearView JSON export file.'); }
  return validateEnvelope(parsed);
}
