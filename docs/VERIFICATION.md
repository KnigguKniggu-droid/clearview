# Verification evidence

Initial checks ran November 26, 2026. Subsequent redesign and publication checks ran November 27. Each section identifies its revision or stage. Later evidence supersedes earlier measurements only for the stated check.

## Current stage — Warm Civic Daylight, November 27

This section records the current stage. The earlier sections below remain historical evidence and are not deleted. Warm Civic Daylight supersedes the dark Guard HUD and the older `86676fa` video interface.

| Check | Current observed status |
| --- | --- |
| Daylight web source build | PASS after final filter-semantics and review-footer fixes; emitted `index-BmNBwrbf.js` and `index-BDzfqFmG.css` |
| Daylight extension interface | PASS; lint, build, and final unpacked Chromium runtime passed; panel assets `index-DwQrynLZ.js` / `index-BNoosXM1.css`; compact source marker verified |
| Integrated unit/integration, lint, types, build | PASS, `npm run verify` exit 0: 129 tests (56 analyzer + 52 reporting + 21 extension), lint, types, and production builds; later web changes passed a fresh web build and the browser suite |
| Updated automated web browser suite | PASS, all 21 tests in 20.3 seconds on the final web build |
| Visible multi-site use in the owner's installed Chrome | Pending; earlier automated Chromium extension checks do not establish this result |
| Current release packaging and publication | Pending; prior publication authorization remains in force |
| Screen-reader behavior | UNKNOWN |
| Actual browser zoom | UNKNOWN |
| Complete WCAG AAA conformance | Not established; no such claim is made |

The preceding dark revision passed **123 unit/integration tests and 21 Chromium browser tests**. Those results describe that revision only. Earlier analyzer, reporting, extension, and web regression evidence remains useful history, but it is not a substitute for the current integrated gate.

The final [web daylight evidence](evidence/daylight-ui-audit.json) is dated `2026-11-27T18:06:09.511Z`. The corrected, calibrated text-contrast check found zero violations and zero incomplete checks across 12 combinations: workspace, repair review, saved report, and installation at 375/768/1440 px. The browser suite verified 16 px body/14 px metadata, 44 px controls/52 px primary actions, 3 px focus, 64 px desktop header, 55/45 desktop panes, and the partial-repair headline. A real focus-obscuration issue in the sticky review footer was corrected by keeping actions in normal flow. Native Tab checks then passed at all three widths. Four `daylight-*.png` screenshots accompany the evidence.

The final [extension runtime receipt](evidence/extension-browser-receipt.json) records PASS at `2026-11-27T18:07:13.843Z`. The test used an unpacked Chromium extension, not the owner's installed Chrome profile. It verified 320/420 px layouts, 3 px keyboard focus, preservation of selected add-ons under the default review, explicit verified $29.99 monthly removal, restore, and W3C 47 → 41 → 47 findings with exact rollback. Its calibrated 7:1 check measured 12 initial, 170 expanded-review, and 45 active text nodes, with zero violations and zero incomplete results in each state. The compact 14 px `✓` marker retained its title and specified colors without expanding the narrow progress row. Repaired text used at least 16 px. These scoped results do not establish complete AAA conformance.

**Contrast evidence correction:** earlier 17:56/18:02 runtime claims of a custom 7:1 check were invalid because the configuration was ignored. The final runs use the corrected top-level check configuration. A controlled `#666`-on-white specimen at 5.74:1 failed against an observed 7:1 threshold for both 16 px normal and 28 px bold text; `#111827`-on-white passed at a measured 17.73:1. The final receipts supersede the earlier 7:1 measurement claims. Solid-pair mathematical ratios below remain valid. This calibration and the scoped product results do not establish full AAA conformance.

The owner's Chrome profile is available. The computer-use tool blocks the `chrome://extensions` installation page and explicitly forbids workarounds. Manual Load unpacked is required after the daylight extension build is ready. Ordinary web-page checks and visible multi-site extension checks in that profile are still pending. Existing profile data remains untouched.

The daylight source uses Inter, 16 px body text, 14 px metadata, a 64 px minimum desktop header, and a 55/45 desktop workspace. Scenario labels are Medical Bill, Internet Checkout, and Senior Tax Form. Repair selection remains explicit and technical details are collapsed. See [DESIGN.md](../DESIGN.md) for source guidance and the exact palette.

The following are calculations for opaque solid text/background pairs, not rendered whole-app accessibility measurements:

| Pair | Contrast |
| --- | ---: |
| `#111827` / `#F6F5F1` | 16.261157:1 |
| `#111827` / `#FFFFFF` | 17.739717:1 |
| `#374151` / `#F6F5F1` | 9.448264:1 |
| `#374151` / `#FFFFFF` | 10.307356:1 |
| White / `#0F4C81` | 8.856709:1 |
| White / `#0A365C` | 12.388547:1 |
| Error text `#991B1B` / `#FEF2F2` | 7.596644:1 |
| Warning text `#78350F` / `#FFFBEB` | 8.748451:1 |
| Applied-change text `#065F46` / `#ECFDF5` | 7.294078:1 |

The original error/warning accent colors do not reach 7:1 on their pale fills and are not the body-text tokens. Passing these pairs and any future axe check does not establish full AAA conformance. Deliberately defective sample portals remain outside app-chrome assertions. The historical film, its playback/listening limitations, and its exact motion exceptions remain recorded below and in VIDEO_VERIFICATION.md.

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

The integrated `npm run verify` exited 0 at this stage. An earlier run failed on a lint expression in the new runtime test harness; that expression was fixed and the full command was rerun. Earlier footage from `989aaca31f707ac787c28976669f323e89ee8d3e` is superseded. The final runtime and film verification appear in the later sections.

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
- Demo video render, audio measurements, and final frame review were pending at this stage. See the final film section for the delivery status.
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

GitHub Actions run45950204285 passed on this revision. A Node20 action-deprecation warning appeared; it did not fail the run. The subsequent frontend refinement is recorded below.

## Final refinement — runtime 86676fa, November 27

`npm run verify` exited 0 with 33 analyzer tests and 6 extension integration tests, lint, all workspace type checks, and production builds. Final assets are `index-CF173xBh.js` and `index-CSZSckdf.css`; the extension uses `index-j7SDI4yC.js` and `index-CxX1of51.css`.

The 13-test browser suite passed on the local production preview in 11.9 seconds and on the deployed site in 18.7 seconds. The added regression verifies separate exact receipt totals under a diagnostic doubled-text setting. The suite also checks both 44 px target dimensions and the visible filtered finding count. Actual browser zoom and screen-reader testing remain UNKNOWN.

The real extension test passed again after the build. Temporary access is gated by the toolbar action. Scan, source location, supported repairs, tab/navigation invalidation, and restricted-page errors pass. W3C captured properties restore exactly, with no rollback differences.

The [brand and motion receipt](evidence/brand/motion-panel-receipt.json) records 16 passed checks, including pointer reversal, resize, native entry, live reduced-motion switching, failed-media fallback, and initial extension screens at 320/420 px. The 160 px Spotkit illustration was inspected at its actual rendered size. The SVG checker passes.

The [functional refinement review](evidence/refinement/refinement-review.md) records 21 scenario/viewport states, source-to-implementation mappings, and limitations. It preserves the generic layout helper's 19 errors and 1 warning, with their triage. It also preserves a reduced-motion helper discrepancy. Separate pointer/hit-state samples show the affected controls change fill/color. No blanket helper PASS is claimed.

All 17 public static files match the final local build byte for byte. The standalone route returns 200, and security headers remain present. Runtime `86676fa` is on the public GitHub main branch. GitHub CI run 45951775578 passed. The video uses this fixed runtime. Subsequent documentation commits do not change captured code.

## Final film

The 157.3-second master and review copy pass full decode. Codec, transcript, caption, scene-lint, and objective audio checks pass. The review copy is 9,661,267 bytes. Two independent reviewers completed two critique rounds and found no concrete blocker in the reviewed final frames.

The raw automated report remains FAIL because of stationary source frames and reading holds. The reviewed report passes with warnings after exact, hash-bound allowances. The full-bleed framing target is not met; the separate caption lane is a documented legibility exception. Human listening and uninterrupted full-film playback remain UNKNOWN. See [VIDEO_VERIFICATION.md](VIDEO_VERIFICATION.md) for the exact scope, metrics, hashes, and exceptions.
