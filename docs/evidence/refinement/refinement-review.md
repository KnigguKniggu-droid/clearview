# ClearView refinement evidence — 2026-11-27

This is the compact public version of the development review. Captures contain fictional sample data. Large DOM snapshots, local filesystem paths, and unrelated diagnostics are omitted. This package documents the source refinement; it does not substitute for the separate production deployment gate.

## Changes supported by measurements

| Before | After |
|---|---|
| All filter measured 16.72px wide. | All audit controls have a 44px minimum target. Phone filters use two columns. |
| Doubled phone text made totals collide. | Intrinsic wrapping separates the total segments. See [before](text200-before.png) and [after](text200-after.png). |
| Phone names and amounts competed for one narrow row. | Charge names and amounts occupy separate rows on the same source keyline below 420px panel width. |
| Small labels fell below the caption scale. | Audit captions use 12px; actions use 14px or larger; primary body uses 16px. Intentional portal defects remain. |
| Filter heading showed only the full count. | A filtered result shows its subset, e.g. `1 of 10`. |
| Hover rules masked active fills in the first refinement. | Active rules follow hover rules. Press feedback is visible. |
| Old chrome styles and repeated overrides coexisted. | One semantic token system governs the chrome. The portal fixture styles remain isolated. |

No analyzer rule, financial calculation, portal data, or repair behavior changed. The shared brand was integrated. Full source text, uncertainty, source links, and revert guidance remain.

## Fifteen review categories

The review covered product hierarchy, keylines, responsive reflow, money layout, typography, reading density, surface hierarchy, color semantics, target size, pointer feedback, keyboard focus, motion, icons/imagery, state communication, and accessibility/trust. It did **not** invent fifteen defects. The changes above address measured issues. The existing receipt-first composition, transparent artwork, source links, keyboard flow, and scoped accessibility checks passed. A new generic hero, font replacement, decorative icons, financial numeral animation, and artificial loading delay were rejected.

## Sources applied

- **better-design**: semantic geometry, target sizing, motion-state checks, and actual helper execution. Helper failures remain below.
- **frontend-design-deslop** (`samber/cc-skills`): honored the existing DESIGN.md and consolidated semantic tokens instead of changing the product direction.
- **make-interfaces-feel-better**: immediate press feedback, explicit transition properties, reduced-motion cuts, and restrained frequent controls. Currency values never animate through invented intermediate amounts.
- [AffectUI Change Summary](https://www.affectui.com/components/change-summary), [public registry source](https://www.affectui.com/r/change-summary-clean.json): inspected its definition-list pattern and public MIT license statement. The existing Safe Mode summary now uses label-left/value-right structure, a small direction indicator, and a short before/after sentence. Values still come only from actual baseline/current reports. No dependency or animation was copied.
- [PrettySites Habitflow Light](https://prettysites.io/?prompt=habitflow): the coordinating agent inspected the live template. Its plain white task surface, pale context, left-aligned titles, compact context strip, and restrained separators informed the receipt styling. No code, prompt, fonts, backdrop, or assets were copied.

## Verification

- [Typecheck](typecheck.log): exit 0.
- [Browser suite](e2e.log): 13 passed in 11.1s against the source preview. One new test covers doubled-text receipt geometry. Existing tests cover exact revert, all scenarios, source return, filters, keyboard repair, reduced motion, target sizes, and scoped axe checks.
- [Compact layout measurements](layout-measurements.json): 21 states across three scenarios and widths 320, 360, 390, 768, 1024, 1440, and 1920px. No page errors, horizontal overflow, leaf-text overflow, or undersized visible audit controls were reported.
- [Normal-motion probe](motion-normal.json): exit 0, 23 controls, zero errors. Selected All has no distinct hover fill; selected-state precedence is intentional.
- Targeted ESLint and `git diff --check` passed during the source pass.

## Raw helper failures and triage

[Layout helper output](layout-report.txt) is retained unchanged: **FAIL, 19 errors, 1 warning; exit 1**. This is not a blanket layout pass.

- `/mo` and score `100` are unrelated keylines; the score label/bar have different vertical roles. Generic grouping misclassifies these as shared edges/rows.
- Charge controls are left-aligned multi-row source rows. Their text and right-edge source icons are intentionally not one centered block. The final screenshots show no label/value collision.
- A left-aligned disclosure summary is flagged for not centering. Two other controls have 1.5–1.8px optical box differences; visual review did not confirm a usability defect, so no speculative nudge was added.
- The inspector extends below the viewport because the document scrolls. No controls are lost. The monthly span extends beyond its typographic line box without clipping; the independent money-layout test confirms separate totals.
- Closed disclosure descendants appear in the generic dump and produce overflow/overlap errors although they are not displayed.
- Full-width structural receipt/control/footer regions have their own inner padding. They are not nested floating cards. The tight-edge flags assume a different structure.
- Heading, totals, summary, charges, and disclosure have different semantic spacing. The uneven-gap and zero-inset warning do not describe equivalent repeated items.

[Reduced-motion helper](motion-reduced-helper.json) returned **exit 1**, reporting no press feedback for Telecom, Utility, and Reset at 390px. A separate [targeted pointer test](press-reduced-targeted.json) scrolls each control into view, verifies the center hit, samples actual `:active`, and releases outside. All four context controls change fill/color within 60ms. The helper discrepancy remains unresolved; its cause is not asserted as proven.

## Captures and limits

- [Desktop audit](audit-1440.png): 1440×1459, repaired state.
- [Desktop audit, original state](audit-original-state-1440.png): 1440×1459, unrepaired medical scenario. Captured from the final preview with the workspace anchored 24px below the viewport top. The capture asserted Activate mode, $334.00 due, and $29.99/month before saving.
- [Phone receipt](mobile-receipt.png): 390×844, original state.
- [Phone Safe Mode](mobile-safe.png): 390×844, repaired state with actual change summary.
- [Text stress before](text200-before.png) and [after](text200-after.png): CSS doubles inspector leaf text. This is a diagnostic, **not actual browser zoom or operating-system text scaling**.

Actual browser zoom at 75%/150%, screen-reader behavior, field performance, and a separate slow-motion animation review were not measured in this refinement pass. Automated accessibility checks apply to app chrome and do not certify the intentionally flawed sample portals.
