import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applySafeMode, revertSafeMode, scanDocument } from '@clearview/analyzer';
import type { AuditReport, FinancialCommitment } from '@clearview/analyzer';
import { AUDIT_EXPORT_LIMITS, createAuditExport, formatAuditMarkdown, parseAuditExport } from '../src/index';
import type { AuditExport } from '../src/index';

function price(overrides: Partial<FinancialCommitment> = {}): FinancialCommitment {
  return { id: 'price-cv-1-0', clearviewId: 'cv-1', label: 'Setup fee $149.00', amountText: '$149.00', numericValue: 149,
    cadence: 'one-time', currency: 'USD', amountKind: 'charge', isPreselected: true, isHiddenOrLowContrast: false, includedInTotals: true, ...overrides };
}

function report(): AuditReport {
  return {
    timestamp: '2026-11-27T12:00:00.000Z', safeModeActive: false, repairState: 'inactive', repairSummary: { applied: 0, skipped: 0, conflicted: 0, nodes: 0 },
    summary: { totalFindings: 2, critical: 1, warning: 1, info: 0, trustScore: 82, accessibilityScore: 92, overallScore: 87, totalImmediateDue: 149, totalRecurringMonthly: 29.99 },
    findings: [
      { id: 'cv-fee-1', clearviewId: 'cv-1', category: 'hidden-fee', ruleId: 'FEE-1', severity: 'critical', title: 'Fee needs review', plainLanguageExplanation: 'The fee is hard to read.', recommendedAction: 'Review the fee.', evidenceText: 'Setup fee $149.00', isAutoRepairable: true },
      { id: 'cv-label-1', clearviewId: 'cv-3', category: 'accessibility', ruleId: 'LABEL-1', wcagCriterion: 'WCAG 1.3.1', severity: 'warning', title: 'Missing label', plainLanguageExplanation: 'The field lacks an accessible name.', recommendedAction: 'Add the existing visible label.', evidenceText: '', isAutoRepairable: true }
    ],
    financialCommitments: [price(), price({ id: 'price-cv-2-0', clearviewId: 'cv-2', label: 'Membership $29.99/mo', amountText: '$29.99/mo', numericValue: 29.99, cadence: 'monthly' }),
      price({ id: 'price-cv-4-0', clearviewId: 'cv-4', label: 'Usage $0.28/kWh', amountText: '$0.28/kWh', numericValue: .28, cadence: 'unknown', includedInTotals: false, exclusionReason: 'Usage quantity is unknown.' }),
      price({ id: 'price-cv-5-0', clearviewId: 'cv-5', label: 'Credit -$10.00', amountText: '-$10.00', numericValue: -10, amountKind: 'credit', includedInTotals: false, exclusionReason: 'Credit application requires review.' })],
    limitations: ['Selected automated checks only.']
  };
}

const metadata = { sourceLabel: 'Medical sample', sourceKind: 'sample' as const, origin: 'https://example.com' };
const exported = (): AuditExport => createAuditExport(report(), metadata);
const parseChanged = (change: (value: AuditExport) => void) => { const value = exported(); change(value); return parseAuditExport(JSON.stringify(value)); };

beforeEach(() => { document.body.innerHTML = ''; });

describe('export contract', () => {
  it('round-trips every required field and produces an independent plain snapshot', () => {
    const original = report();
    const value = createAuditExport(original, metadata);
    expect(parseAuditExport(JSON.stringify(value, null, 2))).toEqual(value);
    expect(value.report).toEqual(original);
    original.findings[0].title = 'Changed after export';
    expect(value.report.findings[0].title).toBe('Fee needs review');
    expect(Number.isFinite(Date.parse(value.createdAt))).toBe(true);
  });

  it('strips credentials, path, query, and fragment from both created and imported metadata', () => {
    const value = createAuditExport(report(), { ...metadata, origin: 'https://person:secret@example.com:8443/private/bill?token=secret#patient' });
    expect(value.source.origin).toBe('https://example.com:8443');
    expect(JSON.stringify(value)).not.toContain('secret');
    value.source.origin = 'https://other:password@example.org/a?password=x#fragment';
    expect(parseAuditExport(JSON.stringify(value)).source.origin).toBe('https://example.org');
  });

  it('supports a source with no origin and never adds raw page/input fields', () => {
    const value = createAuditExport(report(), { sourceLabel: 'Local sample', sourceKind: 'sample' });
    expect(value.source).toEqual({ label: 'Local sample', kind: 'sample' });
    expect(Object.keys(value.report).sort()).toEqual(['timestamp', 'safeModeActive', 'repairState', 'repairSummary', 'summary', 'findings', 'financialCommitments', 'limitations'].sort());
    expect(() => parseChanged(value => Reflect.set(value.report, 'inputValues', { password: 'secret' }))).toThrow(/unsupported field/);
    expect(() => parseChanged(value => Reflect.set(value, 'rawDOM', '<form>private</form>'))).toThrow(/unsupported field/);
  });

  it('accepts live analyzer output before repair, after repair, and after exact revert', () => {
    document.body.innerHTML = '<p>Setup fee $149.00</p><label><input type="checkbox" checked>Membership $29.99/mo</label><p>CA$20.00/month</p><p>Credit -$10.00</p>';
    const original = scanDocument(document);
    const snapshot = applySafeMode(document, original);
    const repaired = scanDocument(document);
    revertSafeMode(document, snapshot);
    const reverted = scanDocument(document);
    for (const actual of [original, repaired, reverted]) {
      expect(parseAuditExport(JSON.stringify(createAuditExport(actual, metadata))).report).toEqual(actual);
    }
    expect(repaired.summary.totalRecurringMonthly).toBe(0);
    expect(reverted.summary.totalRecurringMonthly).toBe(29.99);
  });
});

describe('bounded structural validation', () => {
  it.each(['', '{', '<script>alert(1)</script>', 'null', '[]', 'true', '1'])('rejects non-report JSON or malformed input: %s', input => {
    expect(() => parseAuditExport(input)).toThrow(Error);
  });

  it('checks actual UTF-8 bytes before parsing and rejects an overlong source field', () => {
    expect(() => parseAuditExport(' '.repeat(AUDIT_EXPORT_LIMITS.maxBytes + 1))).toThrow(/too large/);
    const wide = '"' + '界'.repeat(350_000) + '"';
    expect(wide.length).toBeLessThan(AUDIT_EXPORT_LIMITS.maxBytes);
    expect(() => parseAuditExport(wide)).toThrow(/too large/);
    expect(() => createAuditExport(report(), { ...metadata, sourceLabel: 'x'.repeat(201) })).toThrow(/source.label/);
  });

  it('bounds array counts and nested text independently of overall file size', () => {
    expect(() => parseChanged(value => { value.report.findings = Array(501).fill(value.report.findings[0]); })).toThrow(/at most 500/);
    expect(() => parseChanged(value => { value.report.financialCommitments = Array(501).fill(value.report.financialCommitments[0]); })).toThrow(/at most 500/);
    expect(() => parseChanged(value => { value.report.limitations = Array(33).fill('Limit'); })).toThrow(/at most 32/);
    expect(() => parseChanged(value => { value.report.findings[0].evidenceText = 'x'.repeat(4_097); })).toThrow(/evidenceText/);
  });

  it('rejects a structurally valid report that exceeds the pretty-printed export byte budget', () => {
    const value = report();
    value.findings = Array.from({ length: 500 }, (_, index) => ({ ...value.findings[0], id: `finding-${index}`, evidenceText: 'x'.repeat(4_000) }));
    value.summary.totalFindings = 500; value.summary.critical = 500; value.summary.warning = 0;
    expect(() => createAuditExport(value, metadata)).toThrow(/too large/);
  });

  it('rejects a deeply nested wrong-shape value without traversing the attacker tree', () => {
    const tree = '['.repeat(20_000) + '0' + ']'.repeat(20_000);
    expect(() => parseAuditExport(`{"schemaVersion":1,"createdAt":"2026-11-27T12:00:00Z","source":${tree},"report":{}}`)).toThrow(/source must be an object/);
  });

  it.each(['__proto__', 'constructor', 'prototype'])('rejects forbidden key %s at nested boundaries', key => {
    const value = exported();
    const payload = JSON.stringify(value).replace('"summary":{', `"summary":{"${key}":{"polluted":true},`);
    expect(() => parseAuditExport(payload)).toThrow(/forbidden prototype key/);
    expect(Reflect.get(Object.prototype, 'polluted')).toBeUndefined();
  });

  it('rejects an unexpected prototype or accessor without executing a getter', () => {
    const original = report();
    Object.setPrototypeOf(original.summary, { polluted: true });
    expect(() => createAuditExport(original, metadata)).toThrow(/plain data/);
    const getter = vi.fn(() => 'secret');
    const other = report();
    Object.defineProperty(other.findings[0], 'title', { get: getter });
    expect(() => createAuditExport(other, metadata)).toThrow(/accessors/);
    expect(getter).not.toHaveBeenCalled();
  });

  it.each([
    ['missing nested field', (value: AuditExport) => { Reflect.deleteProperty(value.report.findings[0], 'recommendedAction'); }],
    ['wrong nested boolean', (value: AuditExport) => { Reflect.set(value.report.financialCommitments[0], 'includedInTotals', 'yes'); }],
    ['wrong severity', (value: AuditExport) => { Reflect.set(value.report.findings[0], 'severity', 'urgent'); }],
    ['wrong category', (value: AuditExport) => { Reflect.set(value.report.findings[0], 'category', 'billing'); }],
    ['wrong source kind', (value: AuditExport) => { Reflect.set(value.source, 'kind', 'website'); }],
    ['wrong version', (value: AuditExport) => { Reflect.set(value, 'schemaVersion', 2); }],
    ['invalid source ID', (value: AuditExport) => { value.report.findings[0].clearviewId = 'javascript:alert(1)'; }],
    ['unknown nested field', (value: AuditExport) => { Reflect.set(value.report.financialCommitments[0], 'html', '<p>x</p>'); }],
    ['duplicate finding ID', (value: AuditExport) => { value.report.findings[1].id = value.report.findings[0].id; }],
    ['duplicate price ID', (value: AuditExport) => { value.report.financialCommitments[1].id = value.report.financialCommitments[0].id; }]
  ])('rejects %s', (_, change) => { expect(() => parseChanged(change)).toThrow(/Invalid audit export/); });

  it.each(['2026-02-30T12:00:00.000Z', '2026-13-01T00:00:00Z', '2026-11-27T24:00:00Z', 'yesterday'])('rejects invalid calendar timestamp %s', timestamp => {
    expect(() => parseChanged(value => { value.report.timestamp = timestamp; })).toThrow(/timestamp/);
  });

  it.each(['javascript:alert(1)', 'data:text/html,test', 'file:///private', '//example.com', 'not a URL'])('rejects non-HTTP(S) origin %s', origin => {
    expect(() => createAuditExport(report(), { ...metadata, origin })).toThrow(/origin/);
  });
});

describe('semantic consistency', () => {
  it('rejects nonfinite JSON numbers and nonfinite typed input', () => {
    const text = JSON.stringify(exported()).replace('"totalImmediateDue":149', '"totalImmediateDue":1e400');
    expect(() => parseAuditExport(text)).toThrow(/finite/);
    for (const bad of [NaN, Infinity, -Infinity]) {
      const value = report(); value.financialCommitments[0].numericValue = bad;
      expect(() => createAuditExport(value, metadata)).toThrow(/finite/);
    }
  });

  it('rejects negative totals, fractional finding counts, and mismatched totals/counts', () => {
    expect(() => parseChanged(value => { value.report.summary.totalImmediateDue = -1; })).toThrow(/finite/);
    expect(() => parseChanged(value => { value.report.summary.totalFindings = 1.5; })).toThrow(/integer/);
    expect(() => parseChanged(value => { value.report.summary.totalFindings = 1; })).toThrow(/does not match/);
    expect(() => parseChanged(value => { value.report.summary.critical = 0; })).toThrow(/does not match/);
    expect(() => parseChanged(value => { value.report.summary.totalRecurringMonthly = 0; })).toThrow(/included charges/);
    expect(() => parseChanged(value => { value.report.summary.overallScore = 100; })).toThrow(/rounded mean/);
  });

  it.each(['EUR', 'GBP', 'CAD', 'AUD', 'NZD', 'unknown'] as const)('preserves excluded %s and rejects counting it as USD', currency => {
    const value = exported(); const item = value.report.financialCommitments[2]; item.currency = currency;
    expect(parseAuditExport(JSON.stringify(value)).report.financialCommitments[2].currency).toBe(currency);
    item.includedInTotals = true; item.cadence = 'one-time';
    expect(() => parseAuditExport(JSON.stringify(value))).toThrow(/selected USD charges/);
  });

  it('requires exclusion explanations and prevents credit/annual/unselected inclusion', () => {
    expect(() => parseChanged(value => { Reflect.deleteProperty(value.report.financialCommitments[2], 'exclusionReason'); })).toThrow(/exclusionReason/);
    expect(() => parseChanged(value => { value.report.financialCommitments[3].includedInTotals = true; })).toThrow(/selected USD charges/);
    expect(() => parseChanged(value => { value.report.financialCommitments[0].cadence = 'annual'; })).toThrow(/selected USD charges/);
    expect(() => parseChanged(value => { value.report.financialCommitments[0].isPreselected = false; })).toThrow(/selected USD charges/);
    expect(() => parseChanged(value => { value.report.financialCommitments[0].numericValue = -149; })).toThrow(/negative amount/);
  });

  it('validates active/partial/expired repair state without confusing findings with session counts', () => {
    const value = exported();
    value.report.repairState = 'active'; value.report.safeModeActive = true; value.report.repairSummary.applied = 3; value.report.repairSummary.nodes = 5;
    expect(parseAuditExport(JSON.stringify(value)).report.repairSummary.applied).toBe(3);
    value.report.repairState = 'partial'; value.report.repairSummary.skipped = 1;
    expect(parseAuditExport(JSON.stringify(value)).report.repairState).toBe('partial');
    value.report.repairState = 'expired'; value.report.safeModeActive = false; value.report.repairSummary.nodes = 0;
    expect(parseAuditExport(JSON.stringify(value)).report.repairSummary.applied).toBe(3);
    value.report.safeModeActive = true;
    expect(() => parseAuditExport(JSON.stringify(value))).toThrow(/safeModeActive/);
  });

  it('roundtrips a partial repair after host drift without rewriting historical action outcomes', () => {
    const report = exported().report;
    report.safeModeActive = true;
    report.repairState = 'partial';
    report.repairSummary = { applied: 1, skipped: 0, conflicted: 0, nodes: 1 };
    const value = createAuditExport(report, { sourceLabel: 'Host drift', sourceKind: 'extension' });
    expect(parseAuditExport(JSON.stringify(value)).report.repairSummary).toEqual(report.repairSummary);
    expect(parseAuditExport(JSON.stringify(value)).report.repairState).toBe('partial');
  });

  it('requires real node counts with the correct active state while allowing multiple nodes per action', () => {
    expect(() => parseChanged(value => { Reflect.deleteProperty(value.report.repairSummary, 'nodes'); })).toThrow(/nodes/);
    expect(() => parseChanged(value => { value.report.repairSummary.nodes = 1; })).toThrow(/nodes/);
    const value = exported(); value.report.safeModeActive = true; value.report.repairState = 'active';
    value.report.repairSummary.applied = 1; value.report.repairSummary.nodes = 3;
    expect(parseAuditExport(JSON.stringify(value)).report.repairSummary.nodes).toBe(3);
    value.report.repairSummary.nodes = 0;
    expect(() => parseAuditExport(JSON.stringify(value))).toThrow(/nodes/);
  });
});

describe('safe Markdown output', () => {
  it('preserves HTML-like evidence as escaped text and cannot introduce raw HTML or Markdown links', () => {
    const value = exported();
    const payload = '<img src=x onerror=alert(1)> [open](javascript:alert(1)) ![x](https://example.test) `code` | cell\n# heading &lt;script&gt;';
    value.source.label = '<svg onload=alert(1)>';
    value.report.findings[0].evidenceText = payload;
    value.report.findings[0].title = '<script>alert(1)</script>';
    value.report.financialCommitments[0].label = payload;
    value.report.limitations = [payload];
    const parsed = parseAuditExport(JSON.stringify(value));
    expect(parsed.report.findings[0].evidenceText).toBe(payload);
    const markdown = formatAuditMarkdown(parsed);
    expect(markdown).not.toContain('<img'); expect(markdown).not.toContain('<script'); expect(markdown).not.toContain('<svg');
    expect(markdown).not.toContain('[open](javascript:');
    expect(markdown).toContain('&lt;img'); expect(markdown).toContain('\\[open\\]\\(javascript:');
    expect(markdown).toContain('\\| cell \\# heading &amp;lt;script&amp;gt;');
    expect(markdown).toContain('Read-only snapshot');
  });

  it('includes exclusions, limitations, and counts without turning imported data into actions', () => {
    const markdown = formatAuditMarkdown(exported());
    expect(markdown).toContain('$149.00'); expect(markdown).toContain('$29.99');
    expect(markdown).toContain('Usage quantity is unknown'); expect(markdown).toContain('Credit application requires review');
    expect(markdown).toContain('does not authenticate the page');
    expect(markdown).not.toContain('onclick=');
    expect(() => { const value = exported(); value.report.summary.totalFindings = 99; formatAuditMarkdown(value); }).toThrow(/does not match/);
  });
});
