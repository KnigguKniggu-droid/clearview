# ClearView

ClearView inspects a page for low-visibility charges, selected recurring add-ons, pressure language, and common accessibility defects. It links each finding to its source element. Safe Mode can make supported changes and restore the recorded page state.

The project contains a browser sandbox and a Chrome side-panel extension. Both use the same deterministic TypeScript analyzer. Runtime analysis requires no account, paid LLM API, or remote scraping service.

**Live sandbox:** [clearview-brown.vercel.app](https://clearview-brown.vercel.app).

**Source:** [KnigguKniggu-droid/clearview](https://github.com/KnigguKniggu-droid/clearview). Release evidence and remaining checks are recorded in `docs/VERIFICATION.md` and `CURRENT_STATE.md`. The demo video is being produced separately; no Devpost submission is implied.

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

`npm test` runs analyzer and extension integration suites. `npm run verify` runs tests, lint, workspace type checks, and production builds. Playwright checks real browser interactions separately. A successful command is evidence only for that check; it does not establish complete browser compatibility or WCAG conformance.

## Judge walkthrough

The portals use simulated organizations, transactions, and charges. They are not affiliated with any real medical provider, telecom provider, or utility. Use sample values only.

1. Open the medical scenario. Locate the facility-fee finding. Compare the page text with the receipt entry.
2. Activate Safe Mode. Check that the optional membership becomes unchecked. Check that the fee becomes readable and the unlabeled controls receive names.
3. Use the repaired payment control with the keyboard. The sandbox must show a simulated result; it must not send a payment.
4. Revert the changes. Compare the selection, styles, labels, and keyboard attributes with the initial state.
5. Open the telecom scenario. Compare the selected monthly items with the future promotional renewal disclosure.
6. Open the utility scenario. Inspect the per-kWh disclosure separately from the fixed monthly add-on.

Sample arithmetic verified in Chromium:

| Scenario | Initial fixed charges | After supported add-ons are unchecked | Charges outside those totals |
| --- | --- | --- | --- |
| Medical | $334.00 one-time; $29.99/month optional membership | $334.00 one-time; $0.00/month optional membership | Any unshown insurance adjustment is unknown |
| Telecom | $84.98/month from $55.00 + $19.99 + $9.99 | $55.00/month | $89.99/month future base-plan renewal after 12 months |
| Utility | $19.50/month optional carbon offset | $0.00/month optional carbon offset | $0.28/kWh peak-demand surcharge; actual usage and complete bill are unknown |

These numbers describe the specified sample data. They are not measured savings or claims about a real bill. A fee remains payable when Safe Mode only makes it readable.

To test the extension against an isolated sample, select **Open sample** above the portal. This opens the portal without the inspector, so the extension does not audit a second copy of its own financial receipt.

## Load the Chrome extension

1. Run `npm run build` from the repository root.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Select `apps/extension/dist`, which must contain the built `manifest.json`.
6. Open a normal HTTP or HTTPS page.
7. Select ClearView's toolbar action to open its side panel.
8. Scan the page. Review a finding before applying Safe Mode.

After rebuilding, select **Reload** on the extension card and refresh the inspected tab. Chrome restricts script injection on internal pages and some protected pages. See [Chrome's official unpacked-extension instructions](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world).

The release ZIP is a distribution of the same built directory. Extract it before selecting **Load unpacked**. A ZIP is not a Chrome Web Store listing.

## Deploy the sandbox to Vercel

Publish only after the release checks and owner approval. Import the repository into Vercel with these settings:

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
apps/web-sandbox/        React sandbox and simulated portals
apps/extension/          Manifest V3 service worker, content script, and side panel
docs/                   Architecture, privacy, submission, and ECC workflow
```

Read `docs/ARCHITECTURE.md` for contracts and limits. Read `docs/PRIVACY.md` before using the extension on sensitive pages. Read `docs/SUBMISSION.md` for the verified event facts and release checklist.

Read `docs/DEPENDENCY_REVIEW.md` for the known development-tool advisories retained by the specified Vitest 2 major version. The production dependency audit is clean; the full development audit is not.

## What the results mean

Scores summarize the implemented rules. They do not certify a page as safe, accessible, lawful, or free of hidden charges. A timer or selected checkbox is evidence to inspect, not proof of deceptive intent. The receipt summarizes visible DOM evidence; it cannot verify a merchant's contract, future tax, usage bill, or server-side checkout state.

Safe Mode changes the current page in memory. The page may replace those elements, reject synthetic events, or recompute its own state. Always check the site's actual order summary before making a commitment. ClearView does not submit orders.
