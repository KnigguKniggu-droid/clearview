# ClearView Chrome extension

From the repository root:

```sh
npm ci
npm run test -w @clearview/extension
npm run typecheck -w @clearview/extension
npm run build -w @clearview/extension
```

Open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select this package's `dist` folder. Open a normal HTTP or HTTPS page. Click the ClearView toolbar icon on that tab. Choose **Scan active tab** in the side panel.

The toolbar gesture grants temporary `activeTab` access. Opening the side panel from Chrome's panel selector alone may not grant access. Click the toolbar icon again after switching tabs or navigating to another site.

## Local page actions

- Scan reads the current top-level document and produces cited findings and price candidates.
- Locate scrolls to the cited source and highlights it.
- Safe Mode applies the analyzer's supported local repairs. It never submits a form or clicks a payment control.
- Revert restores the recorded attributes, styles, keyboard listeners, and checkbox values.
- Scan again refreshes the report after a page changes.

The content script keeps one snapshot per document. It rejects commands with an old document token. The panel discards reports when the active tab navigates or changes. A reload removes local repairs. Revert can replace user choices made after Safe Mode activation.

## Build boundaries

`build.mjs` emits the React panel first. It then bundles `background.ts` and `contentScript.ts` as independent IIFEs. The injected content script has no runtime module imports. The manifest points to `index.html` and `background.js` in `dist`.

Permissions are limited to `activeTab`, `scripting`, and `sidePanel`. The package has no persistent host permissions, external connection rules, storage, analytics, or remote code. Messages require the extension runtime id and a validated command. Page strings are rendered as text through React.

## Limits

The analyzer checks selected DOM rules. It does not certify WCAG compliance, verify actual billing liability, or prove that a warning reflects deliberate deception. The scan does not traverse cross-origin frames or closed shadow roots. Some frameworks ignore synthetic input/change events or replace repaired content. Check the site's own final state before continuing.

The message integration tests use JSDOM and a mocked Chrome messaging boundary. They exercise scan, repair, revert, sender validation, repeated injection, stale tokens, and missing sources. They do not prove Chrome's toolbar permission gesture or side-panel lifecycle. Browser verification must test those separately.

The repository also provides `npm run test:extension-runtime`. Start the sandbox on port 4173 before running it. This check loads the original unpacked build in a fresh isolated Chromium profile, invokes Chrome's real action through CDP, drives the actual side panel, and verifies local and public-page repair/rollback. It also verifies denied access before invocation, source highlighting, navigation, cross-tab isolation, and restricted-page errors. It requires Chromium with the experimental `Extensions.triggerAction` API; the recorded run used Chromium 159. The raw diagnostics stay under ignored `work/extension`. Public results live in `docs/evidence/extension-browser-receipt.json`.

The background routes toolbar activation through `chrome.action.onClicked` and calls `chrome.sidePanel.open` from that gesture. Automatic `openPanelOnActionClick` is disabled. Chromium's automatic side-panel action deliberately skips the temporary active-tab permission grant; the explicit action path preserves the requested minimal permissions.
