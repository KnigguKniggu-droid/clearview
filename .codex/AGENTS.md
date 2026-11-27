# ClearView ECC working context

Read ../AGENTS.md and ../CURRENT_STATE.md first.

Use the installed ECC plugin. Do not install a duplicate global copy. Apply these workflows to this repository:
- agentic-engineering: bounded responsibilities, explicit completion criteria, evidence before completion.
- coding-standards and frontend-patterns: strict types, clear boundaries, narrow React components.
- frontend-design-direction: quiet civic inspector, actual workflow first, responsive constraints.
- browser-qa: real interaction checks, three viewport sizes, console/network checks, accessibility checks.
- ECC testing rules: test first, record the failing baseline, enforce at least 80% analyzer coverage.
- ECC security rules: no secrets, no remote extension code, minimal permissions, validate message boundaries.

The analyzer must remain framework-free. The root npm verify command is the release gate. Run browser regressions after behavior changes. Record unknown checks as UNKNOWN. Save reusable lessons to LESSONS.md and resume state to CURRENT_STATE.md.

Do not claim the entire WCAG standard has been verified. Describe scores as heuristic. Do not imply an audit confirms actual financial liability or changes a server-side subscription.

Public deployment, repository publication, video upload, and Devpost submission need the user's final approval of the concrete release.
