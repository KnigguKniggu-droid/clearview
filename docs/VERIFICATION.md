# Verification evidence

Client date: November 26, 2026. All commands below ran locally. Remote CI and public deployment have not run.

## Completed checks

| Check | Observed result |
| --- | --- |
| `npm test` | 30 analyzer tests and 6 extension integration tests passed |
| `npm run lint` | Exit 0 |
| `npm run typecheck` | All three workspaces passed |
| `npm run build` | All three workspaces passed; production sandbox and MV3 extension emitted |
| `npm run test:coverage -w @clearview/analyzer` | 100% lines, statements, functions; 93.12% branches; 80% thresholds passed |
| `npm run test:e2e` | 10 Chromium tests passed |
| Automated inspector accessibility checks | No axe violations at 375, 768, or 1440 pixels |
| Responsive overflow checks | No horizontal overflow at those widths |
| `npm audit --omit=dev` | Zero reported production dependency vulnerabilities |
| Full dependency audit | Seven development dependency entries remain; see DEPENDENCY_REVIEW.md |

The browser tests verify medical, telecom, and utility totals; selection changes; exact style/checkbox rollback; scenario resets; finding filters and locate; keyboard Enter activation; and absence of uncaught errors during the tested interactions. Unit tests additionally cover Space activation and removal of injected listeners.

## Verified sample arithmetic

| Sample | Before Safe Mode | After Safe Mode |
| --- | --- | --- |
| Medical fixed charges | $334.00 | $334.00 |
| Medical monthly add-on | $29.99 | $0.00 |
| Telecom monthly charges | $84.98 | $55.00 |
| Utility monthly add-on | $19.50 | $0.00 |

The telecom $89.99 future renewal disclosure and utility $0.28/kWh usage rate remain visible disclosures. They are not counted as current fixed monthly charges.

## Extension runtime verification

The unpacked release ran in Chromium 159.0.8154.6 with its original three permissions. The repeatable command is `npm run test:extension-runtime` while the sandbox runs at `http://127.0.0.1:4173`. This manual check requires Chromium with the experimental CDP Extensions domain. It creates its own fresh profile under ignored `work/extension` and closes that browser.

- Injection before the toolbar action was denied.
- CDP `Extensions.triggerAction` invoked the real extension action and opened the actual side panel. The action granted temporary page access. The test did not add host permissions.
- The medical sample receipt changed from $334.00 fixed plus $29.99 monthly to $334.00 fixed plus $0.00 monthly. The page checkbox changed and Revert restored it.
- The public [W3C Before and After Demonstration](https://www.w3.org/WAI/demos/bad/before/home.html) produced 47 findings. Six local repairs reduced that count to 41. These counts describe this tested page version.
- Revert restored every captured style, accessible label, role, tabindex, and checkbox state on that public page. No ClearView badges remained.
- Navigation discarded the prior report before the next page was scanned.

The public [runtime receipt](evidence/extension-browser-receipt.json) records the measured checks. Raw protocol diagnostics stay in ignored local work files. The action was driven through Chrome's extension debug API, not by a human mouse click. A standalone restricted-page check and cross-tab check are not yet recorded.

## Limits and pending checks

- No prior screenshot baseline exists. Visual regression is INCONCLUSIVE. Current desktop and mobile layouts were inspected manually.
- Core Web Vitals are UNKNOWN. No performance claim is made.
- Screen-reader behavior and a complete WCAG audit remain manual review tasks. The sample portals intentionally contain accessibility defects.
- Demo video render, audio measurements, and final frame review are pending.
- Production deployment and GitHub publication require final user approval.

The project is a working prototype with documented scope limits, not accessibility certification or a financial audit.
