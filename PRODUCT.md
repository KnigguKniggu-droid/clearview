# Product context

ClearView is a local-first browser inspector for financial disclosures, selected add-ons, and selected accessibility problems. This context records the owner's master specification and subsequent redesign requests. It is not a record of user research.

## Users and task
People reviewing confusing billing and enrollment pages need to see the identified charges, inspect their source, and try reversible page repairs. The public sandbox lets visitors test this workflow on three simulated portals without installing the extension. The Chrome side panel applies the same analyzer to the active page after the user invokes it.

## Required behavior
- Show identified one-time and recurring amounts separately. Exclude usage rates and future prices from immediate totals.
- Link each financial item and finding to its source element.
- Apply supported repairs locally. Revert the saved DOM state precisely.
- Preserve functional portal inputs, keyboard access, and reduced-motion behavior.
- Label simulated data and explain the limits of the estimate and heuristic scores.

## Constraints
React 19, Vite 6, strict TypeScript, npm workspaces, Tailwind 3, Vitest 2, JSDOM 25, and Manifest V3. The analyzer remains framework-independent. The runtime sends no page data to an LLM or scraping service. Generated artwork is a build-time asset; it adds no runtime service dependency.

## Delivery
The owner approved a public GitHub repository and Vercel sandbox. A packaged extension, source archive, documentation, and approximately 2.5-minute walkthrough are also required. Video hosting and Devpost submission have not been authorized. Team eligibility remains owner input.

## Design request
The owner rejected the original and first revised UI as generic. They explicitly requested Limora Unslop, Nate Herk Scrollcraft, Emil Kowalski Apple Design, Impeccable, UI UX Pro Max, and ECC. The current replacement direction is agent-authored under that request; no visual approval is implied.
