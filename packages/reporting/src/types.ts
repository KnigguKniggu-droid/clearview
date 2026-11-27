import type { AuditReport } from '@clearview/analyzer';

export interface AuditExportSource {
  label: string;
  kind: 'sample' | 'extension';
  origin?: string;
}

/** A saved snapshot. Its element IDs must never authorize page interaction. */
export interface AuditExport {
  schemaVersion: 1;
  createdAt: string;
  source: AuditExportSource;
  report: AuditReport;
}

export interface AuditExportMetadata {
  sourceLabel: string;
  sourceKind: AuditExportSource['kind'];
  origin?: string;
}
