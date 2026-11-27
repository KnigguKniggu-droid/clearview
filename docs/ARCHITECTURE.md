# Architecture and analysis boundaries

## Objective

Use one deterministic analyzer for the sandbox and the Chrome extension. Keep DOM analysis separate from React rendering and Chrome messaging. Link findings and financial entries to their source elements.

## Components

| Component | Responsibility | Boundary |
| --- | --- | --- |
| `packages/analyzer` | Read DOM and computed styles; classify findings; extract price evidence; apply and revert supported repairs | No React, Tailwind, Chrome API, external service, or runtime dependency |
| `apps/web-sandbox` | Render simulated portals and the inspector; coordinate scans with page state | Scan the portal root, not ClearView's own inspector |
| `apps/extension` | Open the side panel; request analysis of the active tab; display results; route repair and locate actions | Keep live DOM references in the content script; send serializable report data through Chrome messaging |

## Public API

The shared API exposes these operations:

```ts
scanDocument(root: Document | HTMLElement): AuditReport
applySafeMode(root: Document | HTMLElement, report: AuditReport): RepairSnapshot
revertSafeMode(root: Document | HTMLElement, snapshot: RepairSnapshot): void
highlightElement(root: Document | HTMLElement, clearviewId: string): void
```

`AuditFinding` contains a rule ID, category, severity, short evidence text, source-element ID, explanation, recommended action, and repairability flag. `FinancialCommitment` records a matched price, numeric value, cadence, selection state, and visibility warning. `AuditReport` contains findings, financial entries, and summary scores. `RepairSnapshot` records the original properties needed for rollback. The source of truth for exact types and additive fields is `packages/analyzer/src/types.ts`.

## Analysis sequence

1. Select the audit root and inspect eligible elements.
2. Associate evidence with stable `data-clearview-id` values.
3. Resolve text color and solid ancestor backgrounds.
4. Run accessibility rules and dark-pattern heuristics.
5. Extract price evidence and classify active financial entries.
6. Calculate deterministic scores and eligible financial totals.
7. Return serializable report data.

Safe Mode consumes that report and changes only supported targets. The caller rescans after host state updates. Revert restores captured properties and removes ClearView's repair listeners and badges. Snapshot data belongs to the inspected page session; it is not a portable undo file.

## Rules

| ID | Evidence | Supported response |
| --- | --- | --- |
| `DP-001` | Checked checkbox with recurring/add-on language in its context | Uncheck an eligible add-on and dispatch native input/change events |
| `DP-002` | Financial disclosure in small, translucent, or low-contrast text | Apply readable foreground, background, font, and opacity styles |
| `DP-003` | Decline control with specified guilt-inducing text | Explain the match; do not rewrite the merchant's offer |
| `DP-004` | Countdown or urgency language | Explain the match; do not claim the deadline is false |
| `WCAG-1.4.3` | Text contrast below the implemented size threshold | Apply readable styles where supported |
| `WCAG-3.3.2` | Form control without a recognized accessible label | Infer an `aria-label` from nearby field evidence |
| `WCAG-4.1.2` | Interactive control without a recognized name | Report the missing name for review |
| `WCAG-2.1.1` | Detected non-semantic click target without keyboard access | Add button semantics, focusability, and Enter/Space activation where supported |
| `WCAG-2.4.3` | Positive `tabindex` | Normalize the value to zero |
| `WCAG-1.1.1` | Image without `alt`, excluding specified decorative cases | Report the missing alternative; do not invent an image description |

Rule names identify relevant WCAG criteria. The implementation does not cover every requirement in those criteria.

## Contrast calculations

The analyzer linearizes sRGB channels at `0.04045`, computes relative luminance with `0.2126`, `0.7152`, and `0.0722`, and calculates `(Llighter + 0.05) / (Ldarker + 0.05)`. It compares normal text with `4.5:1` and qualifying large text with `3:1`. It composites supported alpha colors against ancestor backgrounds and uses white when no background is resolved.

Solid-color DOM analysis does not fully model image backgrounds, gradients, blend modes, text shadows, video, canvas content, or every browser painting effect. Browser rendering checks remain necessary. JSDOM tests do not establish real-browser visual equivalence.

## Financial interpretation

Price extraction is deterministic, not contract verification. A source amount and its cadence must remain inspectable. Current fixed totals must exclude unchecked optional items, duplicate order-total displays, future promotional prices, and usage-based rates. Annual and unknown cadence entries must remain distinguishable from fixed monthly commitments. Different currency symbols must not be added as if they represented one currency.

An entry can be readable and still be mandatory. Safe Mode must not subtract a fee merely because the fee received a visibility repair. A monthly estimate does not imply that the amount is collected today. A per-kWh price does not determine a bill without consumption.

## Limits and failure modes

- Keyword rules can produce false positives and false negatives. They do not establish intent.
- DOM accessible-name checks approximate a subset of naming behavior. They do not read the browser's complete accessibility tree.
- Event listeners registered outside observable DOM properties may not be detected.
- Cross-origin frames, closed shadow roots, off-page terms, and non-DOM content may be outside the scan.
- A page can mutate after a scan. A report describes the inspected state, not a permanent property.
- A page can remove or replace repaired nodes. Rollback cannot restore an independent server transaction or an entire browser history.
- Native event dispatch does not guarantee that every framework or merchant accepts the change. The sandbox's state integration needs browser verification.
- Inferred field labels can be wrong. The page owner should supply proper labels at the source.

## Verification obligations

Unit tests must exercise rule matches and exclusions, alpha compositing, cadence classification, numeric precision, reversible repairs, native event dispatch, and repeated apply/revert behavior. Browser checks must cover actual React totals, keyboard activation, finding location, extension messaging, tab changes, narrow layouts, and restricted-page errors. Record command outcomes and browser evidence separately.
