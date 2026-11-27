# Analyzer contract

This package contains deterministic DOM heuristics. It has no runtime dependencies. It does not inspect the browser accessibility tree, certify WCAG conformance, or verify a merchant's intentions.

## Public API

`scanDocument(root: Document | HTMLElement): AuditReport` scans only the supplied root and its descendants. It assigns stable `data-clearview-id` values to finding targets and price sources. Keep the same root object for Safe Mode state.

`applySafeMode(root, report, options?: { findingIds?: readonly string[] }): RepairSnapshot` applies the chosen eligible repairs. Omit `findingIds` for all repairable findings in that exact report. Pass `[]` for no changes. An ID outside the reviewed report throws before mutation. Repeated calls on the same active root return the same snapshot; revert before choosing a new set. The snapshot preserves raw style attributes, affected ARIA attributes, tabindex, role, and checkbox properties. Ancestor opacity is restored only within the scan scope. Native `input` and `change` events bubble after a checkbox update.

Pass the original report object returned by a scan of the same root. Cross-scope reports and serialized report copies are rejected before mutation. Element targets are resolved through internal object identity. A host-inserted duplicate `data-clearview-id` cannot redirect a repair or highlight. Removed nodes require a new scan; copied attributes on replacement nodes do not authorize repairs. A report-time fingerprint also rejects changed same-node evidence. Required, disabled, and consent-related checkboxes remain manual-review items. A checked property alone does not prove that the site preselected an option.

`revertSafeMode(root, snapshot)` restores captured properties only while they still equal the values ClearView applied. Later host changes are preserved as conflicts. It removes only this snapshot's listeners and badges. Inspect `snapshot.revertOutcomes` for each property's `restored`, `conflict`, or `detached` result. This supersedes unconditional rollback on changed pages; unchanged pages still restore exact original attributes. Snapshots have in-memory DOM references; they are not transferable between pages or serializable rollback transactions.

`highlightElement(root, id): boolean` scrolls to a finding and shows a 1.5-second crimson/cyan pulse through the Web Animations API. Reduced-motion preferences and browsers without that API receive a static crimson outline. It returns `false` when the original target is absent from the scope. Repeated highlights reset the timer and cancel the previous animation. Highlight styles do not enter repair snapshots or expire an active repair. Rollback cancels active animations before restoring styles.

## Repair outcomes and lifecycle

Each snapshot contains `outcomes: { findingId, clearviewId, status: 'applied' | 'skipped' | 'conflict', reason? }[]`. A rejected checkbox change produces a conflict and no success badge. The analyzer reads back the synchronous event result. Consumers must rescan after asynchronous host updates to reconcile changes accepted later.

Every report includes `repairState: 'inactive' | 'active' | 'partial' | 'expired'` and `repairSummary: { applied, skipped, conflicted, nodes }`:

- `applied`, `skipped`, and `conflicted` count the latest session's action outcomes. They do not count remaining findings.
- `nodes` counts unique connected DOM nodes that still have at least one ClearView-owned mutation, including affected opacity ancestors. Several findings on one node count once. One finding can repair more than one node.
- `active` means current owned mutations without a skipped/conflicted action. `partial` also has live mutations, with a skipped/conflicted action or lost mutation target. `safeModeActive` is true for these two states only.
- `expired` means the session had applied actions but none remain connected and owned. It retains historical action counts, has zero nodes, and allows fresh Apply after a new scan.
- `inactive` has no live applied session. A failed/no-op attempt can retain skipped/conflicted counts. Revert clears the current session and all report counts.

These values are local DOM outcomes. They do not establish a server-side subscription change or a verified bill.

## React adapter

The analyzer uses the native checkbox setter, then dispatches `input` and `change`. React's checkbox `onChange` normally uses click extraction and may not run for those synthetic events. Controlled application adapters must subscribe to native input/change events and update state. Arbitrary websites may use different adapters; users must confirm the host page totals.

## Receipt additions

The `FinancialCommitment` contract includes these fields:

- `currency`: USD, EUR, GBP, CAD, AUD, NZD, or `unknown`. Explicit prefixes/codes take precedence. A bare dollar symbol still assumes USD; locale ambiguity requires manual review.
- `amountKind`: `charge`, `credit`, `refund`, or `unknown`. Signed tokens retain their sign in `numericValue` and exact text in `amountText`. Credits/refunds remain separate; the analyzer does not assume when they apply.
- `includedInTotals`: whether the candidate contributes to current USD totals.
- `exclusionReason`: why a candidate remains listed without contributing to the totals.

`AuditReport.limitations` describes scan boundaries. Fixed current one-time USD charges contribute to `totalImmediateDue`. Fixed monthly USD charges contribute to `totalRecurringMonthly`. Annual charges and their monthly equivalents, conditional penalties, future renewals, usage/per-seat rates, credits, refunds, aggregate display totals, unchecked options, uncertain cadence, and other currencies remain separate. Each amount uses its own suffix and nearby clause; it does not inherit a neighbouring amount's billing cadence. Payable refundable deposits remain charges. Money arithmetic sums rounded integer cents. Zero identified fixed charges is not a verified zero bill.

Use a semantic label or a `data-charge` / `data-price-row` attribute around a split description/price row. Mark aggregate display rows `data-receipt-total`. These hints improve scope but do not inject prices or fake results. Generic visible text still works.

## Scores

Each critical finding deducts 18 points. Each warning deducts 8. Each informational finding deducts 3. Trust includes dark-pattern and hidden-fee findings. Accessibility includes accessibility findings. Both scores clamp at zero. Overall is the rounded equal-weight mean. These are demonstration heuristics, not assurance metrics.

## Coverage and limitations

`npm run test:coverage -w @clearview/analyzer` enforces 80% statement, branch, function, and line coverage. Tests cover all specified rule families, alpha compositing, ancestor opacity, receipt exclusions, event dispatch, rollback, scoped repairs, and stable IDs.

Contrast uses the specified WCAG sRGB math and composites solid RGBA backgrounds and opacity. Background images, filters, and blending are excluded because their contrast cannot be established from computed solid colors. Closed shadow roots, iframes, pseudo-elements, generated text, CSS clipping, offscreen layout, and a complete accessible-name algorithm require a broader audit.
