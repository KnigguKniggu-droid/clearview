# @clearview/reporting

Local export/import for ClearView audit snapshots. This source-only workspace has no runtime dependencies. Vite consumers compile its TypeScript exports. It imports analyzer types only; analyzer code is used in integration tests, not the reporting runtime.

```ts
import { createAuditExport, parseAuditExport, formatAuditMarkdown, AUDIT_EXPORT_LIMITS } from '@clearview/reporting';

const snapshot = createAuditExport(report, {
  sourceLabel: 'Medical sample',
  sourceKind: 'sample', // or 'extension'
  origin: location.href,
});
const json = JSON.stringify(snapshot, null, 2);
const imported = parseAuditExport(json);
const markdown = formatAuditMarkdown(imported);
```

The envelope is `{schemaVersion:1, createdAt, source:{label, kind, origin?}, report}`. The report includes required `repairState` and `repairSummary:{applied,skipped,conflicted,nodes}`, plus each amount's `amountKind`. Node counts describe currently owned repaired nodes at scan time, not action counts. An action can affect several nodes.

The API throws readable `Error` messages. `createAuditExport` creates a detached plain-data snapshot and checks the size of its two-space JSON representation. `parseAuditExport` checks the actual UTF-8 input size before parsing. Consumers should also check `File.size <= AUDIT_EXPORT_LIMITS.maxBytes` before reading a file.

Validation caps input at 1 MiB, findings and commitments at 500 each, limitations at 32, source labels at 200 characters, and general text at 4,096 characters. It rejects unknown/missing fields, prototype keys, accessors, wrong enums, invalid UTC timestamps, nonfinite numbers, duplicate IDs, inconsistent counts/totals, and contradictory repair states. Fixed totals include only selected USD charges with one-time or monthly cadence. Other currencies, credits/refunds, annual amounts, unknown cadence, and unselected options remain excluded with reasons. Validation checks structure and arithmetic; it does not authenticate the author or independently verify the page.

Metadata accepts only HTTP(S) URLs and stores `URL.origin`. Credentials, path, query, and fragment are discarded on both export and import. The schema has no raw HTML, DOM nodes, form values, scripts, or executable actions. Evidence text can still contain visible page content; this API does not promise personal-data redaction.

HTML-like text is allowed as data. Markdown output escapes HTML characters and Markdown syntax, and keeps each field on one line. This is an explicit text-escaping policy, not an HTML sanitizer. UI consumers must render imported fields as text, never through `innerHTML`/`dangerouslySetInnerHTML`. Imported IDs must never be passed to page location or repair functions. A saved report remains read-only even if it records an active repair state from the original session.

Run `npm run test -w @clearview/reporting` and `npm run typecheck -w @clearview/reporting` from the repository root. Tests include actual analyzer output before and after repair/revert, nested malformed data, bounds, prototype/accessor payloads, nonfinite values, arithmetic consistency, currency exclusions, node-state consistency, origin stripping, and escaped HTML-like evidence.
