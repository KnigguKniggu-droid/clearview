# Verification evidence

Initial checks ran November 26, 2026. Subsequent redesign and publication checks ran November 27. Each section identifies its revision or stage. Later evidence supersedes earlier measurements only for the stated check.

## Initial completed checks

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

Final integrated `npm run verify` exited 0. An earlier run failed on a lint expression in the new runtime test harness; that expression was fixed and the full command was rerun. Earlier footage from `989aaca31f707ac787c28976669f323e89ee8d3e` is superseded by the second redesign. Final capture awaits the new verified runtime pin.

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
- The revised receipt-first panel had no horizontal overflow at 320 or 420 pixels. Its reduced-motion view disabled the amount animation. The same release passed the public-page scan, source locate, six local repairs, and exact captured rollback again.

The public [runtime receipt](evidence/extension-browser-receipt.json) records the measured checks. Raw protocol diagnostics stay in ignored local work files. The action was driven through Chrome's extension debug API, not by a human mouse click.

## Limits and pending checks

- Screenshots from the original and revised interfaces are retained. They document the redesign; they are not a pre-existing automated visual regression suite.
- One ECC Chrome DevTools trace of a warm production-preview reload measured LCP138ms and CLS0.06 with no throttling. Four requests returned304; no console warnings/errors or HTTP errors appeared. INP and real-user metrics remain UNKNOWN. This local lab observation does not predict deployment or mobile-network performance. See evidence/performance-smoke.json.
- Screen-reader behavior and a complete WCAG audit remain manual review tasks. The sample portals intentionally contain accessibility defects.
- Demo video render, audio measurements, and final frame review are pending.
- GitHub and Vercel publication are complete. The final runtime passes the deployed browser suite.

The project is a working prototype with documented scope limits, not accessibility certification or a financial audit.

## Second redesign verification — 2026-11-27

The integrated second redesign passed `npm run verify` with exit0:33analyzer tests,6extension integration tests, lint, workspace type checks, and production builds. The sandbox produced index-IbuzJyDS.js and index-Qu8qLh7H.css. The browser suite passed12/12 tests. It now verifies the mobile receipt shortcut, focus movement, Safe Mode, return to a cited source, and axe checks across the header, introduction, scenario controls, toolbar, inspector, and footer at375/768/1440px. The deliberately broken sample portal is excluded from the app-chrome accessibility assertion.

Actual screenshots were reviewed at1440px and390px. All seven initially rendered images loaded, receipt labels measured16px, measured controls were44–56px tall, and neither viewport had horizontal overflow or page errors. Long charge labels preserve their complete source text while using a two-line visual limit. The Revert control was measured after settling and was enabled with opacity1.

A new ECC warm local trace measured LCP115ms and CLS0.00 with no throttling. INP and real-user performance remain UNKNOWN. This is a local observation, not a performance promise. See evidence/performance-redesign.json. The older smoke trace above remains historical evidence only.

Final motion correction: a midpoint review found the handoff text clipped through words. Its clipping was removed. The final sandbox assets are index-DEoTv2Bz.js and index-D0OyYlt7.css. Desktop1440x1000 and1440x768, mobile390/360, pointer reversal, and reduced-motion views passed the targeted visual script. The source art planes remain independent; measured pointer views differed in9.82%of pixels. See evidence/intro/receipt.json and its contact sheet.

The aligned navy/cobalt extension passed the real Chromium runtime script again, including320/420px width checks, reduced motion, activeTab permission gating, public-page source location, supported repairs, and rollback with no captured differences. Final runtime evidence is in evidence/extension-browser-receipt.json.


## Public release verification

Runtime `6f9617617c3e6e7b78dabdf4b324ed4686008866` is public on the GitHub main branch and deployed at https://clearview-brown.vercel.app. The final source push succeeded after the owner-approved workflow scope was added. Public HTTP checks confirmed all17static files match the local build byte for byte. The standalone sample returned200. The nosniff and no-referrer headers are present. The complete12-test Chromium suite passed against the deployed URL. See evidence/deployment-check.json.

GitHub Actions run45950204285 passed on this revision. A Node20 action-deprecation warning appeared; it did not fail the run. A subsequent frontend refinement is in progress. Its verification is recorded separately when completed.

## Final refinement — runtime86676fa, November27

`npm run verify` exited0 with33analyzer tests and6extension integration tests, lint, all workspace type checks, and production builds. Final assets are `index-CF173xBh.js` and `index-CSZSckdf.css`; the extension uses `index-j7SDI4yC.js` and `index-CxX1of51.css`.

The13-test browser suite passed on the local production preview in11.9seconds and on the deployed site in18.7seconds. The added regression verifies separate exact receipt totals under a diagnostic doubled-text setting. The suite also checks both44px target dimensions and the visible filtered finding count. Actual browser zoom and screen-reader testing remain UNKNOWN.

The real extension test passed again after the build. Temporary access is gated by the toolbar action. Scan, source location, supported repairs, tab/navigation invalidation, and restricted-page errors pass. W3C captured properties restore exactly, with no rollback differences.

The [brand and motion receipt](evidence/brand/motion-panel-receipt.json) records16passed checks, including pointer reversal, resize, native entry, live reduced-motion switching, failed-media fallback, and initial extension screens at320/420px. The160px Spotkit illustration was inspected at its actual rendered size. The SVG checker passes.

The [functional refinement review](evidence/refinement/refinement-review.md) records21scenario/viewport states, source-to-implementation mappings, and limitations. It preserves the generic layout helper's19errors/1warning and their triage. It also preserves a reduced-motion helper discrepancy; separate pointer/hit-state samples show the affected controls change fill/color. No blanket helper PASS is claimed.

All17public static files match the final local build byte for byte. The standalone route returns200, and security headers remain present. Runtime86676fa is on the public GitHub main branch. GitHub CI run45951775578 passed. The video uses this fixed runtime; subsequent documentation commits do not change captured code.
