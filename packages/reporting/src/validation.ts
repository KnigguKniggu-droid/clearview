import type { AuditFinding, AuditReport, FinancialCommitment } from '@clearview/analyzer';
import type { AuditExport, AuditExportSource } from './types';

export const AUDIT_EXPORT_LIMITS = Object.freeze({
  maxBytes: 1_048_576,
  maxFindings: 500,
  maxCommitments: 500,
  maxLimitations: 32,
  maxTextLength: 4_096,
  maxLabelLength: 1_024,
  maxSourceLabelLength: 200,
  maxFinancialMagnitude: 1_000_000_000_000,
  maxRepairCount: 10_000
});

function invalid(path: string, message: string): never {
  throw new Error(`Invalid audit export: ${path} ${message}.`);
}

export function objectFields(value: unknown, path: string, required: readonly string[], optional: readonly string[] = []): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid(path, 'must be an object');
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) invalid(path, 'must contain plain data');
  if (Object.getOwnPropertySymbols(value).length) invalid(path, 'must not contain symbol properties');
  for (const key of Object.getOwnPropertyNames(value)) {
    if (['__proto__', 'constructor', 'prototype'].includes(key)) invalid(path, 'contains a forbidden prototype key');
    if (!required.includes(key) && !optional.includes(key)) invalid(path, `contains an unsupported field (${key.slice(0, 80)})`);
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor?.get || descriptor?.set) invalid(path, 'must contain data properties, not accessors');
  }
  for (const key of required) if (!Object.hasOwn(value, key)) invalid(`${path}.${key}`, 'is required');
  return value as Record<string, unknown>;
}

export function textValue(value: unknown, path: string, max: number = AUDIT_EXPORT_LIMITS.maxTextLength, allowEmpty = false): string {
  if (typeof value !== 'string') invalid(path, 'must be text');
  if ((!allowEmpty && !value.trim()) || value.length > max) invalid(path, `must contain ${allowEmpty ? '0' : '1'} to ${max} characters`);
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value)) invalid(path, 'contains unsupported control characters');
  return value;
}

function enumValue<T extends string>(value: unknown, path: string, values: readonly T[]): T {
  if (typeof value !== 'string' || !values.includes(value as T)) invalid(path, `must be one of ${values.join(', ')}`);
  return value as T;
}

function numberValue(value: unknown, path: string, min: number, max: number, integer = false): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) {
    invalid(path, `must be a finite ${integer ? 'integer ' : ''}number from ${min} to ${max}`);
  }
  return value;
}

function booleanValue(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') invalid(path, 'must be true or false');
  return value;
}

function arrayValue(value: unknown, path: string, max: number): unknown[] {
  if (!Array.isArray(value) || value.length > max) invalid(path, `must be an array with at most ${max} items`);
  return value;
}

function timestamp(value: unknown, path: string): string {
  const result = textValue(value, path, 32);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(result)) invalid(path, 'must be an ISO 8601 UTC timestamp');
  const date = new Date(result);
  const normalized = result.includes('.') ? result.replace(/\.(\d{1,3})Z$/, (_, fraction: string) => `.${fraction.padEnd(3, '0')}Z`) : result.replace('Z', '.000Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== normalized) invalid(path, 'must be a valid calendar timestamp');
  return result;
}

function identifier(value: unknown, path: string): string {
  const result = textValue(value, path, 160);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(result)) invalid(path, 'must be a plain identifier');
  return result;
}

function sourceId(value: unknown, path: string): string {
  const result = identifier(value, path);
  if (!/^cv-\d{1,9}$/.test(result)) invalid(path, 'must be a ClearView element identifier');
  return result;
}

/** Accept an HTTP(S) URL; retain only its origin, never its credentials or page path. */
export function normalizeOrigin(value: unknown, path: string): string {
  const input = textValue(value, path, 2_048);
  let url: URL;
  try { url = new URL(input); } catch { invalid(path, 'must be an absolute HTTP or HTTPS URL'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.origin === 'null') invalid(path, 'must be an HTTP or HTTPS origin');
  return url.origin;
}

function finding(value: unknown, index: number): AuditFinding {
  const path = `report.findings[${index}]`;
  const item = objectFields(value, path, ['id', 'clearviewId', 'category', 'ruleId', 'severity', 'title', 'plainLanguageExplanation', 'recommendedAction', 'evidenceText', 'isAutoRepairable'], ['wcagCriterion']);
  return {
    id: identifier(item.id, `${path}.id`),
    clearviewId: sourceId(item.clearviewId, `${path}.clearviewId`),
    category: enumValue(item.category, `${path}.category`, ['dark-pattern', 'hidden-fee', 'accessibility']),
    ruleId: textValue(item.ruleId, `${path}.ruleId`, 160),
    ...(item.wcagCriterion === undefined ? {} : { wcagCriterion: textValue(item.wcagCriterion, `${path}.wcagCriterion`, 160) }),
    severity: enumValue(item.severity, `${path}.severity`, ['critical', 'warning', 'info']),
    title: textValue(item.title, `${path}.title`, 512),
    plainLanguageExplanation: textValue(item.plainLanguageExplanation, `${path}.plainLanguageExplanation`),
    recommendedAction: textValue(item.recommendedAction, `${path}.recommendedAction`),
    evidenceText: textValue(item.evidenceText, `${path}.evidenceText`, AUDIT_EXPORT_LIMITS.maxTextLength, true),
    isAutoRepairable: booleanValue(item.isAutoRepairable, `${path}.isAutoRepairable`)
  };
}

function commitment(value: unknown, index: number): FinancialCommitment {
  const path = `report.financialCommitments[${index}]`;
  const item = objectFields(value, path, ['id', 'clearviewId', 'label', 'amountText', 'numericValue', 'cadence', 'isPreselected', 'isHiddenOrLowContrast', 'currency', 'amountKind', 'includedInTotals'], ['exclusionReason']);
  const result: FinancialCommitment = {
    id: identifier(item.id, `${path}.id`), clearviewId: sourceId(item.clearviewId, `${path}.clearviewId`),
    label: textValue(item.label, `${path}.label`, AUDIT_EXPORT_LIMITS.maxLabelLength),
    amountText: textValue(item.amountText, `${path}.amountText`, 256),
    numericValue: numberValue(item.numericValue, `${path}.numericValue`, -AUDIT_EXPORT_LIMITS.maxFinancialMagnitude, AUDIT_EXPORT_LIMITS.maxFinancialMagnitude),
    cadence: enumValue(item.cadence, `${path}.cadence`, ['one-time', 'monthly', 'annual', 'unknown']),
    isPreselected: booleanValue(item.isPreselected, `${path}.isPreselected`),
    isHiddenOrLowContrast: booleanValue(item.isHiddenOrLowContrast, `${path}.isHiddenOrLowContrast`),
    currency: enumValue(item.currency, `${path}.currency`, ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NZD', 'unknown']),
    amountKind: enumValue(item.amountKind, `${path}.amountKind`, ['charge', 'credit', 'refund', 'unknown']),
    includedInTotals: booleanValue(item.includedInTotals, `${path}.includedInTotals`),
    ...(item.exclusionReason === undefined ? {} : { exclusionReason: textValue(item.exclusionReason, `${path}.exclusionReason`) })
  };
  if (result.amountKind === 'charge' && result.numericValue < 0) invalid(path, 'cannot classify a negative amount as a charge');
  if (result.includedInTotals && (result.currency !== 'USD' || result.amountKind !== 'charge' || !result.isPreselected || !['one-time', 'monthly'].includes(result.cadence))) {
    invalid(path, 'can include only selected USD charges with one-time or monthly cadence');
  }
  if (!result.includedInTotals && !result.exclusionReason) invalid(`${path}.exclusionReason`, 'is required for an excluded amount');
  if (result.includedInTotals && result.exclusionReason !== undefined) invalid(path, 'cannot include an amount with an exclusion reason');
  return result;
}

function uniqueIds(items: { id: string }[], path: string): void {
  if (new Set(items.map(item => item.id)).size !== items.length) invalid(path, 'contains duplicate identifiers');
}

export function validateReport(value: unknown): AuditReport {
  const report = objectFields(value, 'report', ['timestamp', 'safeModeActive', 'repairState', 'repairSummary', 'summary', 'findings', 'financialCommitments', 'limitations']);
  const findings = arrayValue(report.findings, 'report.findings', AUDIT_EXPORT_LIMITS.maxFindings).map(finding);
  const financialCommitments = arrayValue(report.financialCommitments, 'report.financialCommitments', AUDIT_EXPORT_LIMITS.maxCommitments).map(commitment);
  uniqueIds(findings, 'report.findings'); uniqueIds(financialCommitments, 'report.financialCommitments');
  const summary = objectFields(report.summary, 'report.summary', ['totalFindings', 'critical', 'warning', 'info', 'accessibilityScore', 'trustScore', 'overallScore', 'totalImmediateDue', 'totalRecurringMonthly']);
  const validatedSummary: AuditReport['summary'] = {
    totalFindings: numberValue(summary.totalFindings, 'report.summary.totalFindings', 0, AUDIT_EXPORT_LIMITS.maxFindings, true),
    critical: numberValue(summary.critical, 'report.summary.critical', 0, AUDIT_EXPORT_LIMITS.maxFindings, true),
    warning: numberValue(summary.warning, 'report.summary.warning', 0, AUDIT_EXPORT_LIMITS.maxFindings, true),
    info: numberValue(summary.info, 'report.summary.info', 0, AUDIT_EXPORT_LIMITS.maxFindings, true),
    accessibilityScore: numberValue(summary.accessibilityScore, 'report.summary.accessibilityScore', 0, 100, true),
    trustScore: numberValue(summary.trustScore, 'report.summary.trustScore', 0, 100, true),
    overallScore: numberValue(summary.overallScore, 'report.summary.overallScore', 0, 100, true),
    totalImmediateDue: numberValue(summary.totalImmediateDue, 'report.summary.totalImmediateDue', 0, AUDIT_EXPORT_LIMITS.maxFinancialMagnitude),
    totalRecurringMonthly: numberValue(summary.totalRecurringMonthly, 'report.summary.totalRecurringMonthly', 0, AUDIT_EXPORT_LIMITS.maxFinancialMagnitude)
  };
  if (validatedSummary.totalFindings !== findings.length) invalid('report.summary.totalFindings', 'does not match the findings');
  for (const severity of ['critical', 'warning', 'info'] as const) {
    if (validatedSummary[severity] !== findings.filter(item => item.severity === severity).length) invalid(`report.summary.${severity}`, 'does not match the findings');
  }
  if (validatedSummary.overallScore !== Math.round((validatedSummary.trustScore + validatedSummary.accessibilityScore) / 2)) invalid('report.summary.overallScore', 'does not match the rounded mean of its component scores');
  for (const [field, cadence] of [['totalImmediateDue', 'one-time'], ['totalRecurringMonthly', 'monthly']] as const) {
    const expected = financialCommitments.filter(item => item.includedInTotals && item.cadence === cadence).reduce((cents, item) => cents + Math.round(item.numericValue * 100), 0) / 100;
    if (validatedSummary[field] !== expected) invalid(`report.summary.${field}`, 'does not match its included charges');
  }
  const repair = objectFields(report.repairSummary, 'report.repairSummary', ['applied', 'skipped', 'conflicted', 'nodes']);
  const repairSummary = {
    applied: numberValue(repair.applied, 'report.repairSummary.applied', 0, AUDIT_EXPORT_LIMITS.maxRepairCount, true),
    skipped: numberValue(repair.skipped, 'report.repairSummary.skipped', 0, AUDIT_EXPORT_LIMITS.maxRepairCount, true),
    conflicted: numberValue(repair.conflicted, 'report.repairSummary.conflicted', 0, AUDIT_EXPORT_LIMITS.maxRepairCount, true),
    nodes: numberValue(repair.nodes, 'report.repairSummary.nodes', 0, AUDIT_EXPORT_LIMITS.maxRepairCount, true)
  };
  const repairState = enumValue(report.repairState, 'report.repairState', ['inactive', 'active', 'partial', 'expired']);
  const safeModeActive = booleanValue(report.safeModeActive, 'report.safeModeActive');
  if (safeModeActive !== (repairState === 'active' || repairState === 'partial')) invalid('report.safeModeActive', 'does not match repairState');
  if (safeModeActive !== (repairSummary.nodes > 0)) invalid('report.repairSummary.nodes', 'must be positive for active/partial repairs and zero for inactive/expired repairs');
  if ((repairState === 'inactive') !== (repairSummary.applied === 0)) invalid('report.repairSummary.applied', 'does not match repairState');
  if (repairState === 'active' && repairSummary.skipped + repairSummary.conflicted !== 0) invalid('report.repairState', 'must be partial when active repairs have skipped or conflicted outcomes');
  // A host can overwrite one patch after all actions applied. The session is
  // then partial while the historical skipped/conflicted counts remain zero.
  return {
    timestamp: timestamp(report.timestamp, 'report.timestamp'), safeModeActive, repairState, repairSummary,
    summary: validatedSummary, findings, financialCommitments,
    limitations: arrayValue(report.limitations, 'report.limitations', AUDIT_EXPORT_LIMITS.maxLimitations).map((item, index) => textValue(item, `report.limitations[${index}]`))
  };
}

export function validateEnvelope(value: unknown): AuditExport {
  const envelope = objectFields(value, 'export', ['schemaVersion', 'createdAt', 'source', 'report']);
  if (envelope.schemaVersion !== 1) invalid('schemaVersion', 'must be 1 (unsupported export version)');
  const source = objectFields(envelope.source, 'source', ['label', 'kind'], ['origin']);
  const validatedSource: AuditExportSource = {
    label: textValue(source.label, 'source.label', AUDIT_EXPORT_LIMITS.maxSourceLabelLength),
    kind: enumValue(source.kind, 'source.kind', ['sample', 'extension']),
    ...(source.origin === undefined ? {} : { origin: normalizeOrigin(source.origin, 'source.origin') })
  };
  return { schemaVersion: 1, createdAt: timestamp(envelope.createdAt, 'createdAt'), source: validatedSource, report: validateReport(envelope.report) };
}

export function assertByteLimit(text: string): void {
  if (text.length > AUDIT_EXPORT_LIMITS.maxBytes || new TextEncoder().encode(text).byteLength > AUDIT_EXPORT_LIMITS.maxBytes) {
    throw new Error(`Audit export is too large. The limit is ${AUDIT_EXPORT_LIMITS.maxBytes} UTF-8 bytes (1 MiB).`);
  }
}
