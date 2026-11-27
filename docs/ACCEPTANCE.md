# Acceptance checks

These are intended checks. Actual results belong in VERIFICATION.md.

## Analyzer
- All four dark-pattern rules have positive and negative examples.
- WCAG color calculations cover alpha composition, ancestor backgrounds, and large text.
- ARIA audits cover referenced labels, native labels, keyboard order, and image alternatives.
- Receipt extraction avoids duplicate totals, future rates, usage-based rates, and currency mixing.
- Every repair has a regression assertion and an exact rollback assertion.
- Repeated Safe Mode calls do not overwrite the original snapshot.
- Input and change events bubble to host listeners.
- Audit tags and badges do not become findings or financial commitments.

## Sandbox
- Medical receipt: $334 fixed charges and $29.99 monthly before repair; $334 and $0 after repair.
- Telecom receipt: $84.98 monthly before repair; $55 after repair. $89.99 is a future rate.
- Utility receipt: $19.50 monthly add-on before repair; $0 after repair. $0.28/kWh is usage-based.
- Scenario changes reset prior repair state.
- Reset restores the initial portal, scores, checkbox state, and receipt.
- Finding activation locates its target without selecting the HUD itself.
- Native repair events update React's visible portal totals.
- All filters and empty states work.
- No horizontal overflow at desktop, tablet, or phone widths.

## Extension
- Toolbar action opens the side panel.
- Scan requests permission only for the user-selected active tab.
- Scan, repair, locate, and revert messages return visible results or actionable errors.
- Active-tab changes do not reuse another tab's report or rollback snapshot.
- Browser-internal pages report an unsupported-page error.
- Repeated injection does not register duplicate listeners.
- No external network, analytics, remote code, or saved browsing history is required.
