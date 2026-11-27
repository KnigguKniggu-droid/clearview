# ClearView design system — Warm Civic Daylight

## Current direction

Warm Civic Daylight supersedes the dark Guard HUD, its IBM Plex type, and its 58/42 split. The working interface places a light sample page beside a white ClearView Assistant on warm paper. The first screen contains the actual review workflow. Earlier dark, illustrated, and receipt-desk designs remain historical; their media does not represent this revision.

The owner requested familiar civic-service language, generous readable text, restrained blue actions, and explicit control over changes. This is a design direction and contrast target, not a claim of complete WCAG AAA conformance.

## Palette

The web and extension stylesheets use this daylight system. Current scoped verification is recorded below and in docs/VERIFICATION.md.

| Role / token | Value |
| --- | --- |
| Paper / --cv-bg | #F6F5F1 |
| White surfaces / --cv-surface, --cv-surface-elevated | #FFFFFF |
| Border / --cv-border | #D1D5DB |
| Main text / --cv-ink | #111827 |
| Secondary text / --cv-muted | #374151 |
| Primary action / --cv-action | #0F4C81 |
| Action hover / --cv-action-hover | #0A365C |
| Error text / --cv-danger | #991B1B |
| Error accent / --cv-danger-accent | #B91C1C |
| Error fill / --cv-danger-bg | #FEF2F2 |
| Error border / --cv-danger-border | #FCA5A5 |
| Warning text / --cv-warning | #78350F |
| Warning accent / --cv-warning-accent | #92400E |
| Warning fill / --cv-warning-bg | #FFFBEB |
| Warning border / --cv-warning-border | #FCD34D |
| Applied-change text / --cv-safe | #065F46 |
| Applied-change fill / --cv-safe-bg | #ECFDF5 |
| Applied-change border / --cv-safe-border | #6EE7B7 |

Keep accents and borders separate from body text. The supplied error accent #B91C1C reaches only 5.914600:1 on #FEF2F2. The warning accent #92400E reaches 6.837002:1 on #FFFBEB. The darker text tokens above provide a margin beyond 7:1.

| Opaque text/background pair | Calculated contrast |
| --- | ---: |
| #111827 on #F6F5F1 | 16.261157:1 |
| #111827 on #FFFFFF | 17.739717:1 |
| #374151 on #F6F5F1 | 9.448264:1 |
| #374151 on #FFFFFF | 10.307356:1 |
| #FFFFFF on #0F4C81 | 8.856709:1 |
| #FFFFFF on #0A365C | 12.388547:1 |
| #991B1B on #FEF2F2 | 7.596644:1 |
| #78350F on #FFFBEB | 8.748451:1 |
| #065F46 on #ECFDF5 | 7.294078:1 |

These are sRGB luminance calculations for the stated solid pairs. They do not verify every rendered state, focus indicator, icon, border, image, or intentionally defective sample.

## Typography and geometry

The web app uses self-hosted Inter with system sans-serif fallbacks. Body text is 16 px with 1.6 line height. Metadata is 14 px. Amounts use tabular figures. Avoid thin text and small technical labels in the main decision flow.

Readability repairs use a minimum 16 px font and preserve larger computed sizes. The injected source marker is a compact 14 px `✓` with an explanatory title. It uses the applied-change text, fill, and border tokens and fits the sample's narrow progress row. Review actions stay in normal flow so the footer does not cover focused choices.

The desktop header has a 64 px minimum height. Its scenario labels are Medical Bill, Internet Checkout, and Senior Tax Form. The desktop workspace uses 55/45 columns with a 24 px gap. The source page remains interactive. Narrow layouts stack the panes; source location and Return to inspector keep both parts accessible. Controls target at least 44 px. Actual zoom and screen-reader behavior remain UNKNOWN until tested.

## Component roles

- App owns scenario navigation, local report import/export, scan lifecycle, resize/font-ready rescans, and immutable repair review.
- GuardPanel presents the ClearView Assistant, a plain summary of findings, currently selected monthly extras where live DOM linkage supports them, the review action, and findings filters.
- ReceiptCard shows identified current fixed USD charges, separate disclosures, cited source controls, and provenance-backed removed-option rows. Its title and scope text must be read together; it does not establish a real amount owed.
- FindingItem presents the issue and source in ordinary language. Technical rule IDs are available through collapsed details.
- RepairDialog asks the person to choose each change. Add-on removal starts unchecked. Technical details are collapsed.
- PortalFrame labels the source as simulated and keeps the original page available. The legacy utility fixture remains available through its standalone route.
- InstallExtension and the saved-report view support real-page inspection and local evidence review. Imported reports cannot authorize live mutations.

The current hero uses “potential money traps” and “accessibility barriers.” These count finding records, not verified deception or unique affected elements. Several findings can refer to the same element. Technical scores are collapsed and explicitly described as selected automated checks, not certification.

## Interaction and truthfulness

“Protect Me & Fix This Page” opens review; it does not apply changes immediately. “Restore Original Page” requests rollback of still-owned changes. Later host changes can be preserved as conflicts. Do not describe this as a guaranteed restoration of every external page state.

The selected-extras subtotal requires a live checked-checkbox-to-price relationship. Base charges are not extras merely because isPreselected is true. Removed amounts require a successful selected DP-001 action, original source and checkbox identity, unchanged price terms, and a currently unchecked choice. A lower total alone does not prove removal or savings.

Receipt labels use Selected add-on only with live linkage, Hard-to-read fee only when the source identifies a fee, and Included charge when required status is unknown. Changes happen locally; they do not cancel a provider subscription or submit a payment.

Locate retains a 1500 ms crimson/cyan source pulse. Reduced motion uses a static highlight and instant return scrolling. Money values update immediately. The plain daylight summary replaces the dark score-dial presentation.

## Source guidance

The [GOV.UK type scale](https://design-system.service.gov.uk/styles/type-scale/) informed consistent hierarchy and responsive readability. Its current standard body size is 19 px; ClearView's owner-requested 16 px body is a deliberate difference, not a copied GOV.UK scale.

[Apple's typography guidance](https://developer.apple.com/design/human-interface-guidelines/typography) informed readable weights, clear hierarchy, and keeping important text available as size increases. Native-platform point sizes were not treated as web pixel requirements. Apple assets or system fonts were not copied.

Wise is conceptual inspiration only. Earlier attempted documentation links returned 404. No Wise template or source was inspected or copied. Earlier skill and reference investigations remain in docs/FRONTEND_SKILLS.md and docs/DESIGN_REFERENCES.md; they do not override this later owner direction.

## Verification boundary

The daylight integrated `npm run verify` passed with exit code 0: 129 tests (56 analyzer, 52 reporting, 21 extension), lint, types, and production builds. Subsequent web filter semantics, review-footer, and import-error fixes passed a fresh web build and all 21 browser tests in 21.1 seconds. Final web assets are `index-BArohdx3.js` and `index-BDzfqFmG.css`; extension assets are `index-DwQrynLZ.js` and `index-BNoosXM1.css`.

The calibrated web check at `2026-11-27T18:10:55.659Z` measured zero violations and zero incomplete checks at 7:1 across four views at 375/768/1440 px. Native Tab checks found focused review choices unobscured at those widths. The final extension receipt at `2026-11-27T18:07:13.843Z` records zero violations and zero incomplete checks at the same calibrated threshold in initial, expanded review, and active states, plus compact-marker and exact-rollback checks. Earlier 17:56/18:02 runtime claims of 7:1 used an ignored configuration and are superseded by these controlled reruns. The solid-pair calculations above remain valid.

Publication is complete. All 21 deployed browser tests pass. Visible multi-site testing in the owner's installed Chrome remains pending. Earlier 123 unit/integration and 21 Chromium browser passes belong to the preceding dark revision. Screen-reader behavior and actual browser zoom remain UNKNOWN. Contrast calculations and scoped axe checks cannot establish complete AAA conformance. See docs/VERIFICATION.md.
