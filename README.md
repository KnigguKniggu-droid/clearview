# ClearView

ClearView inspects a page for low-visibility charges, selected recurring options, pressure language, and common accessibility defects. It links each finding to its source element. You review the proposed changes before applying them. Rollback restores changes ClearView still owns and preserves later host changes as conflicts.

The project contains a browser sandbox and a Chrome side-panel extension. Both use the same deterministic TypeScript analyzer. Runtime analysis requires no account, paid LLM API, or remote scraping service.

**Live sandbox:** [clearview-brown.vercel.app](https://clearview-brown.vercel.app).

**Source:** [KnigguKniggu-droid/clearview](https://github.com/KnigguKniggu-droid/clearview). Release evidence is recorded in `docs/VERIFICATION.md` and `CURRENT_STATE.md`.

The current direction is **Warm Civic Daylight**: a white ClearView Assistant beside the sample page, on warm paper. It uses readable Inter text, plain review guidance, explicit repair choices, and local JSON/Markdown reports. Integrated verification passed with 129 tests, lint, types, and builds. Later web refinements passed a fresh build and all 21 browser tests. The final unpacked Chromium extension runtime also passed. The daylight source and live sandbox are published. All 21 deployed browser tests pass. Visible multi-site checks in the owner's installed Chrome remain pending. See [DESIGN.md](DESIGN.md) for the 55/45 layout and exact palette.

The earlier narrated film and comparison reel document runtime `86676fa`; they do not show this rebuild. Earlier 123 unit/integration and 21 Chromium browser passes belong to the preceding dark revision. They are not current daylight results. No video upload or Devpost submission has been made.

## Run locally

Install Node.js 20 or later. Run these commands from the repository root:

```sh
npm ci
npm test
npm run dev
```

Open the local URL printed by Vite. The repository includes a lockfile. Use Node 22 or later for the complete browser and lint toolchain; the application target remains Node 20 or later.

```sh
npm run typecheck
npm run build
npm run verify
npx playwright install chromium
npm run test:e2e
npm run test:coverage -w @clearview/analyzer
```

`npm test` runs the analyzer, reporting, and extension suites. `npm run verify` runs tests, lint, workspace type checks, and production builds. Playwright checks real browser interactions separately. A successful command is evidence only for that check; it does not establish complete browser compatibility or WCAG conformance.

## Judge walkthrough

The portals use simulated organizations, transactions, and charges. They are not affiliated with any real medical provider, telecom provider, or tax service. Use sample values only. Senior Tax Form represents a fictional commercial service; it makes no tax eligibility or government benefit claims.

1. Open **Medical Bill**. Locate the facility-fee finding. Compare the page text with the receipt entry.
2. Select **Protect Me & Fix This Page** to open the review. Add-on removal starts unchecked. Select it explicitly to clear the membership on this page. Apply the reviewed actions. Check that the fee becomes readable and the unlabeled controls receive names.
3. Use the repaired payment control with the keyboard. The sandbox must show a simulated result; it must not send a payment.
4. Select **Restore Original Page**. Compare the selection, styles, labels, and keyboard attributes with the initial state. Later host changes can be preserved rather than overwritten.
5. Open **Internet Checkout**. Compare the selected monthly items with the future promotional renewal disclosure.
6. Open **Senior Tax Form**. Inspect the $39 review and $49 processing fee separately from the optional $14.99 monthly membership.
7. Export JSON, then open it through **Open report**. The imported report is read-only. Export Markdown to retain a readable evidence summary. Files are processed locally.

The current daylight workflow checks cover the expected fixture arithmetic below:

| Scenario | Initial fixed charges | After supported add-ons are unchecked | Charges outside those totals |
| --- | --- | --- | --- |
| Medical Bill | $334.00 one-time; $29.99/month optional membership | $334.00 one-time; $0.00/month optional membership | Any unshown insurance adjustment is unknown |
| Internet Checkout | $84.98/month from $55.00 + $19.99 + $9.99 | $55.00/month | $89.99/month future base-plan renewal after 12 months |
| Senior Tax Form | $88.00 one-time; $14.99/month optional support | $88.00 one-time; $0.00/month optional support | Fictional service; no real filing or payment |

These numbers describe the specified sample data. They are not measured savings or claims about a real bill. A fee remains payable when Safe Mode only makes it readable.

The legacy utility fixture remains available at `?standalone=utility`. It separates the $0.28/kWh usage rate from its $19.50 monthly option.

To test the extension against an isolated sample, select **Open sample** above the portal. This opens the portal without the inspector, so the extension does not audit a second copy of its own financial receipt.

## Load the Chrome extension

1. Run `npm run build` from the repository root.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Select `apps/extension/dist`, which must contain the built `manifest.json`.
6. Open a normal HTTP or HTTPS page.
7. Select ClearView's toolbar action to open its side panel.
8. Scan the page. Locate the evidence, review the proposed changes, then apply only the selected actions. If the page changed after review, rescan before trying again.
9. Export a JSON report. Open it in the web workspace to review its saved evidence. Exported origins omit paths, queries, and credentials. Reports can still contain visible page text; review their contents before sharing.

After rebuilding, select **Reload** on the extension card and refresh the inspected tab. Chrome restricts script injection on internal pages and some protected pages. See [Chrome's official unpacked-extension instructions](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world).

Visible multi-site testing of this rebuild in the owner's installed Chrome is pending. Earlier automated Chromium tests are separate evidence and do not establish that check.

The current unpacked Chromium extension run passed at `2026-11-27T18:07:13.843Z`. It covered 320/420 px widths, keyboard focus, default preservation of selected add-ons, explicit $29.99 monthly removal, restore, and exact rollback on the W3C demonstration page. The initial, expanded review, and active panel states had zero violations and zero incomplete results at a calibrated 7:1 text-contrast threshold. Earlier claimed 7:1 measurements used an ignored configuration; this final run supersedes them. This is limited automated evidence, not full AAA conformance. See [the runtime receipt](docs/evidence/extension-browser-receipt.json).

The release ZIP is a distribution of the same built directory. Extract it before selecting **Load unpacked**. A ZIP is not a Chrome Web Store listing.

## Deploy the sandbox to Vercel

The owner's GitHub and signed-in Vercel publication authorization persists for this rebuild. Complete the current release checks before publishing. Import the repository into Vercel with these settings:

| Setting | Value |
| --- | --- |
| Framework | Vite |
| Root Directory | `apps/web-sandbox` |
| Include source files outside the Root Directory | Enabled |
| Install Command | `cd ../.. && npm ci` |
| Build Command | `cd ../.. && npm run build -w @clearview/web-sandbox` |
| Output Directory | `dist` |

Keep the root `package-lock.json` and workspace manifests in the repository. The web build imports `@clearview/analyzer` from the shared workspace. Configure the project from the full monorepo, not a copy of the app folder. See [Vercel's monorepo guidance](https://vercel.com/docs/monorepos) and [outside-root source setting](https://vercel.com/docs/monorepos/monorepo-faq).

Validate the deployed URL with all three scenarios, Safe Mode, revert, a fresh page load, and a narrow viewport. Record the URL and source revision in the release evidence.

## Project structure

```text
packages/analyzer/       Pure TypeScript analysis, receipts, repair, and tests
packages/reporting/      Bounded JSON validation and readable Markdown exports
apps/web-sandbox/        React sandbox and simulated portals
apps/extension/          Manifest V3 service worker, content script, and side panel
docs/                   Architecture, privacy, submission, and ECC workflow
```

Read `docs/ARCHITECTURE.md` for contracts and limits. Read `docs/PRIVACY.md` before using the extension on sensitive pages. Read `docs/SUBMISSION.md` for the verified event facts and release checklist.

Read `docs/DEPENDENCY_REVIEW.md` for the known development-tool advisories retained by the specified Vitest 2 major version. The last recorded production dependency audit was clean; the full development audit was not. The latest integrated verification is separate from a dependency audit.

## What the results mean

Scores summarize the implemented rules. They do not certify a page as safe, accessible, lawful, or free of hidden charges. A timer or selected checkbox is evidence to inspect, not proof of deceptive intent. The receipt summarizes visible DOM evidence; it cannot verify a merchant's contract, future tax, usage bill, or server-side checkout state.

The daylight palette targets at least 7:1 for specified body-text pairs. The final calibrated web check found zero violations and zero incomplete checks across four views at 375/768/1440 px; native Tab checks also covered focused review choices at those widths. See [the web evidence](docs/evidence/daylight-ui-audit.json). This does not establish full AAA conformance. Automated axe checks cover only their measured states. Screen-reader behavior and actual browser zoom remain UNKNOWN. Finding counts can refer to the same element more than once. A selected-extras subtotal requires a live checkbox-to-price relationship; it is not money at risk or guaranteed savings.

Safe Mode changes the current page in memory. The page may replace those elements, reject synthetic events, or recompute its own state. Always check the site's actual order summary before making a commitment. ClearView does not submit orders.
