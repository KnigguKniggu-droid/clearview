# ECC workflow for ClearView

ECC provides reusable development guidance and tools. ClearView uses the installed ECC 2.2.3 plugin in this Codex profile. The referenced upstream repository is [affaan-m/ECC](https://github.com/affaan-m/ecc). The plugin is not a ClearView runtime dependency.

## Applied guidance

| ECC skill | ClearView use |
| --- | --- |
| `ecc-guide` | Inspect installed guidance and select relevant workflows without duplicating the global installation |
| `agentic-engineering` | Define completion evidence; isolate tasks; run regression checks; prioritize invariants and failure modes |
| `coding-standards` | Keep TypeScript interfaces explicit; use clear names; avoid unnecessary dependencies and speculative abstractions |
| `frontend-design-direction` | Apply the civic inspector design, deliberate hierarchy, stable controls, and responsive constraints |
| `frontend-patterns` | Separate rendering, state coordination, reusable components, and side effects |
| `browser-qa` | Verify real interactions, console and network behavior, responsive views, and accessibility checks |

The project applies relevant ECC guidance across implementation and verification. It does not claim to run every unrelated ECC skill or to install Claude-specific hooks in Codex. Installed guidance is a workflow aid, not evidence that tests passed.

## Responsibilities

The lead owns integration, release evidence, user communication, and the final delivery decision. The analyzer worker owns framework-free engine code and regression tests. Other isolated workers can own disjoint app or documentation files. Each worker must preserve the other workers' edits.

## Gates

1. Define observable acceptance criteria before implementation.
2. Build and test the analyzer before starting UI generation.
3. Verify application behavior in an actual browser after unit tests pass.
4. Review permissions, page mutation boundaries, privacy, and dependency behavior.
5. Run root tests, type checks, and builds against the integrated tree.
6. Save measured outcomes, unresolved limits, and reusable lessons.
7. Request approval only when publication artifacts are concrete and reviewable.

## Project memory

`CURRENT_STATE.md` records the latest state. `docs/IMPLEMENTATION_PLAN.md` records completion criteria and order. The project should capture verified reusable lessons in `LESSONS.md` and update its handoff before a session reset. Do not store secrets, personal data, or unsupported performance claims in memory.

## Known instruction differences

The master spec requests a `CLAUDE.md` symlink. Windows symlink creation was unavailable in the current session, so the lead created a small `CLAUDE.md` import of `AGENTS.md`. This preserves one master instruction source without duplicating its content.

The spec describes formal verification and an accessibility-tree audit. The implementation is a deterministic DOM audit with bounded heuristics and regression tests. User-facing claims must use that narrower description unless separate formal proof or browser accessibility-tree coverage is implemented and verified.
