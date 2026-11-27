# Privacy and page changes

ClearView's runtime analysis is designed to stay in the browser. The analyzer does not require a remote model, analytics endpoint, account, or scraping service. The release review must verify this property against the built application and network activity.

## Sandbox

The medical, telecom, and utility portals contain simulated data. Their forms exist to demonstrate labeling, focus order, selected add-ons, and displayed totals. They must not collect real health information, insurance identifiers, Social Security numbers, payment details, or meter-account data. Use sample text only. A demo submission must remain local and must not initiate a transaction.

When the sandbox is hosted, the hosting provider can process ordinary request metadata under its own policies. This is separate from ClearView's page analysis. Do not describe a hosted site as producing no network traffic.

## Extension

The content script reads text, DOM attributes, computed styles, and checkbox state from the inspected page. A report can contain short excerpts of page text and financial information. The content script passes this report to the extension's own side panel. Reports and repair snapshots should remain in session memory and should not be uploaded or retained across sessions.

The analyzer does not need a person's typed field values to detect missing labels. Review code changes that add value collection, storage, remote requests, logging, screenshots, or exports before release. Do not publish audit screenshots that contain another person's data.

## Permission purpose

| Permission | Purpose |
| --- | --- |
| `activeTab` | Obtain temporary access following the user's extension action |
| `scripting` | Run the analyzer content script in the permitted active tab |
| `sidePanel` | Display the ClearView inspector beside the page |

The release must confirm these purposes against `apps/extension/manifest.json`. Persistent broad host access is not required by the project specification.

## Safe Mode and revert

Safe Mode can change checkbox selection, supported styles, accessible labels, button semantics, and focus order. It dispatches native events to notify the host page. The host page can react to these events with its own logic or network activity. ClearView cannot control that behavior.

Revert restores the DOM properties recorded in the snapshot when the original elements remain available. It does not reverse a payment, server request, account change, or page navigation. ClearView does not submit purchases or enrollment forms. Review the merchant's final summary before making a commitment.

## Release privacy checks

- Inspect production bundles and source for unintended network clients and telemetry.
- Verify that sandbox submissions make no payment or data-submission request.
- Verify that scans do not read or log typed personal values.
- Verify that reports and snapshots do not enter persistent storage.
- Verify that the extension does not silently scan unrelated tabs.
- Record any behavior that differs from this document before publication.
