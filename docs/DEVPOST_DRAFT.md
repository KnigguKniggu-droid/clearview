# Devpost draft — ClearView

**Draft status:** Review against the final build and evidence before submitting. Public URLs and team details remain owner-supplied release information.

## Tagline

See recurring charges and accessibility barriers before you commit.

## Inspiration

A checkout can look simple while placing a recurring membership in a selected checkbox or a fee in faint text. Missing labels and broken keyboard controls can make the same page harder to use. We wanted a practical way to expose these problems at the point where someone makes a decision.

## What it does

ClearView inspects a page in the browser. It reports selected recurring add-ons, low-visibility financial disclosures, pressure language, and a defined set of accessibility defects. Each finding points back to the page element that produced it.

The receipt view separates identifiable immediate charges from fixed monthly commitments. It retains context for future, annual, unknown, and usage-based prices. It summarizes page evidence; it does not replace a contract or guarantee a complete bill.

Safe Mode applies supported changes, such as unchecking selected add-ons, making disclosures readable, adding inferred input labels, and enabling keyboard activation for supported controls. Revert restores the recorded properties. The user keeps control of the page and the final decision.

The sandbox contains three simulated scenarios: medical intake and billing, telecom checkout, and electricity enrollment. The Chrome extension brings the shared analyzer to supported active browser tabs.

## How we built it

The project is a strict TypeScript npm monorepo. A framework-independent analyzer supplies both React interfaces. Its contrast code uses sRGB luminance calculations and supported ancestor-background compositing. DOM rules produce element-cited findings. A repair snapshot captures the properties needed for rollback.

React 19, Vite, Tailwind CSS, and Lucide provide the sandbox and inspector interfaces. The extension uses Manifest V3, a content script, and a Chrome side panel. Vitest and JSDOM test the engine. Browser checks verify interactions that a simulated DOM cannot prove.

Runtime analysis uses no paid LLM API or external scraping endpoint. ECC guided task boundaries, coding conventions, interface design, and verification. AI-assisted implementation and review should be disclosed accurately in the final submission.

## Challenges

A visible price is not automatically a charge due today. Future renewal prices, annual fees, usage rates, duplicate totals, and unchecked options need different treatment. We also had to preserve page state while applying changes and notify host-page logic through native events.

DOM heuristics have limits. A timer does not prove deception. A missing-image-alt finding does not provide enough evidence to invent an image description. A high score does not establish WCAG conformance. We keep those boundaries visible instead of claiming comprehensive verification.

## What we learned

Shared contracts make browser and sandbox behavior easier to compare. Regression tests protect numerical and rollback behavior. Real-browser checks remain necessary for controlled form state, keyboard interaction, and extension messaging.

## What's next

Evaluate the rules with users and more page structures. Expand documented accessible-name handling and supported pricing formats. Improve reporting for unsupported visual backgrounds and embedded content. Measure false-positive rates before making broader accuracy claims.

## Built with

TypeScript, React, Vite, Tailwind CSS, Lucide, npm workspaces, Vitest, JSDOM, Chrome Manifest V3, and ECC-assisted development.

## Final submission fields

| Field | State |
| --- | --- |
| Live demo URL | Not published |
| Source repository URL | Not published |
| Demo video URL | Not published |
| Extension release URL | Not published |
| Team member names | Owner must provide |
| Participant eligibility | Owner must confirm against current event rules |
| Test and browser evidence | 33 analyzer tests, 6 extension integration tests, and 10 Chromium browser tests pass; actual extension tested on W3C educational page; see docs/VERIFICATION.md |
| AI and third-party attribution | Codex-assisted implementation and review with ECC workflows; React, Lucide, and Tailwind notices are included; video uses local Microsoft Zira narration |
