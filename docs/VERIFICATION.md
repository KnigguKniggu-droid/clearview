# Verification evidence

Client date: November 26, 2026. All commands below ran locally. Remote CI and public deployment have not run.

## Completed checks

| Check | Observed result |
| --- | --- |
| `npm test` | 33 analyzer tests and 6 extension integration tests passed |
| `npm run lint` | Exit 0 |
| `npm run typecheck` | All three workspaces passed |
| `npm run build` | All three workspaces passed; production sandbox and MV3 extension emitted |
| `npm run test:coverage -w @clearview/analyzer` | 97.92% lines/statements, 98.21% functions, 91.60% branches; 80% thresholds passed |
| `npm run test:e2e` | 10 Chromium tests passed |
| Automated inspector accessibility checks | No axe violations at 375, 768, or 1440 pixels |
| Responsive overflow checks | No horizontal overflow at those widths |
| `npm audit --omit=dev` | Zero reported production dependency vulnerabilities |
| Full dependency audit | Seven development dependency entries remain; see DEPENDENCY_REVIEW.md |

The browser tests verify medical, telecom, and utility totals; selection changes; exact style/checkbox rollback; scenario resets; finding filters and locate; keyboard Enter activation; and absence of uncaught errors during the tested interactions. Unit tests additionally cover Space activation and removal of injected listeners.

The final browser interaction check also observed no external HTTP requests and no non-GET submission requests. The demo enrollment control displayed its local result without submitting data. Source review found no runtime fetch, XHR, persistent storage, or remote-analysis client in the app, extension, or analyzer source.

Final integrated `npm run verify` exited 0. An earlier run failed on a lint expression in the new runtime test harness; that expression was fixed and the full command was rerun. Capture uses production build revision `989aaca31f707ac787c28976669f323e89ee8d3e`, tagged `v1.0.0-demo`. Later documentation-only commits do not change that captured application.

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
- The public-page Locate control outlined one original source element. Its temporary highlight expired before the repair/rollback comparison.
- Revert restored every captured style, accessible label, role, tabindex, and checkbox state on that public page. No ClearView badges remained.
- Navigation discarded the prior report before the next page was scanned.
- Switching tabs discarded the old report. The new tab required its own toolbar permission grant.
- Scanning `chrome://version` produced an actionable unsupported-page explanation.

The public [runtime receipt](evidence/extension-browser-receipt.json) records the measured checks. Raw protocol diagnostics stay in ignored local work files. The action was driven through Chrome's extension debug API, not by a human mouse click.

## Limits and pending checks

- No prior screenshot baseline exists. Visual regression is INCONCLUSIVE. Current desktop and mobile layouts were inspected manually.
- One ECC Chrome DevTools trace of a warm production-preview reload measured LCP138ms and CLS0.06 with no throttling. Four requests returned304; no console warnings/errors or HTTP errors appeared. INP and real-user metrics remain UNKNOWN. This local lab observation does not predict deployment or mobile-network performance. See evidence/performance-smoke.json.
- Screen-reader behavior and a complete WCAG audit remain manual review tasks. The sample portals intentionally contain accessibility defects.
- Demo video render, audio measurements, and final frame review are pending.
- Production deployment and GitHub publication require final user approval.

The project is a working prototype with documented scope limits, not accessibility certification or a financial audit.
