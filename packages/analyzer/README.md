# Analyzer contract

This package contains deterministic DOM heuristics. It has no runtime dependencies. It does not inspect the browser accessibility tree, certify WCAG conformance, or verify a merchant's intentions.

## Public API

`scanDocument(root: Document | HTMLElement): AuditReport` scans only the supplied root and its descendants. It assigns stable `data-clearview-id` values to finding targets and price sources. Keep the same root object for Safe Mode state.

`applySafeMode(root, report): RepairSnapshot` applies eligible repairs. Repeated calls on the same active root return the same snapshot. The snapshot preserves raw style attributes, affected ARIA attributes, tabindex, role, and checkbox properties. Ancestor opacity is restored only within the scan scope. Native `input` and `change` events bubble after a checkbox update.

Pass the original report object returned by a scan of the same root. Cross-scope reports and serialized report copies are rejected before mutation. Element targets are resolved through internal object identity. A host-inserted duplicate `data-clearview-id` cannot redirect a repair or highlight. Removed nodes require a new scan; copied attributes on replacement nodes do not authorize repairs.

`revertSafeMode(root, snapshot)` restores captured properties and removes only this snapshot's listeners and badges. Snapshots have in-memory DOM references; they are not transferable between pages or serializable rollback transactions. Site rerenders can replace nodes. Inspect the host page after a repair or rollback.

`highlightElement(root, id): boolean` scrolls to a finding and shows a two-second pulsing outline through the Web Animations API. Reduced-motion preferences and browsers without that API receive a static outline. It returns `false` when the original target is absent from the scope. Repeated highlights reset the timer and cancel the previous animation. Highlight styles do not enter repair snapshots. Rollback cancels active animations before restoring styles.

## React adapter

The analyzer uses the native checkbox setter, then dispatches `input` and `change`. React's checkbox `onChange` normally uses click extraction and may not run for those synthetic events. Controlled application adapters must subscribe to native input/change events and update state. Arbitrary websites may use different adapters; users must confirm the host page totals.

## Receipt additions

The requested `FinancialCommitment` contract includes three additive fields:

- `currency`: USD, EUR, or GBP. Dollar symbols are interpreted as USD; locale ambiguity requires manual review.
- `includedInTotals`: whether the candidate contributes to current USD totals.
- `exclusionReason`: why a candidate remains listed without contributing to the totals.

`AuditReport.limitations` describes scan boundaries. Fixed current one-time USD charges contribute to `totalImmediateDue`. Fixed monthly USD charges contribute to `totalRecurringMonthly`. Annual charges, conditional penalties, future renewals, usage rates, aggregate display totals, unchecked options, uncertain cadence, and other currencies remain separate. Money arithmetic sums rounded integer cents.

Use a semantic label or a `data-charge` / `data-price-row` attribute around a split description/price row. Mark aggregate display rows `data-receipt-total`. These hints improve scope but do not inject prices or fake results. Generic visible text still works.

## Scores

Each critical finding deducts 18 points. Each warning deducts 8. Each informational finding deducts 3. Trust includes dark-pattern and hidden-fee findings. Accessibility includes accessibility findings. Both scores clamp at zero. Overall is the rounded equal-weight mean. These are demonstration heuristics, not assurance metrics.

## Coverage and limitations

`npm run test:coverage -w @clearview/analyzer` enforces 80% statement, branch, function, and line coverage. Tests cover all specified rule families, alpha compositing, ancestor opacity, receipt exclusions, event dispatch, rollback, scoped repairs, and stable IDs.

Contrast uses the specified WCAG sRGB math and composites solid RGBA backgrounds and opacity. Background images, filters, and blending are excluded because their contrast cannot be established from computed solid colors. Closed shadow roots, iframes, pseudo-elements, generated text, CSS clipping, offscreen layout, and a complete accessible-name algorithm require a broader audit.
