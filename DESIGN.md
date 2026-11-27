# ClearView design system

## Direction
An optical inspection instrument: real paper, precise cobalt glass, navy surroundings, and a bright but restrained evidence accent. The introduction explains the product through a short layered composition. The workspace presents a source page beside a readable receipt. This direction replaces the rejected beige revision.

## Surfaces
- Introduction: Persuade. Strong Manrope heading, original Limora artwork, immediate live-audit link, short native sticky passage. No scroll lock.
- Audit workspace and extension: Operate. The identified costs and reversible action take priority. Scenario choice, source citations, filters, and status follow predictable controls.
- Documentation: Read. Factual setup and evidence. No unsupported completion claims.

## Tokens
The canonical audit tokens live in `apps/web-sandbox/src/index.css`. The existing hex palette is retained to preserve the approved artwork and extension identity. Intro and brand assets have their own scoped styles. Portal fixtures keep their deliberate defects and their own visual system.

| Role | Token | Value |
| --- | --- | --- |
| Primary text / secondary text / separator | `--ink`, `--muted`, `--line` | `#13283e`, `#51677a`, `#ccd8e3` |
| Canvas / receipt / header | `--paper`, `--sheet`, `--navy` | `#eef3f7`, `#ffffff`, `#10273d` |
| Primary action / hover / press | `--action`, `--action-hover`, `--action-press` | `#245dce`, `#1b4cae`, `#173e92` |
| Evidence / selected surface / pressed surface | `--evidence`, `--selection`, `--press-fill` | `#c7ef72`, `#e7effe`, `#d9e8f8` |
| Secondary surface / hover / browser bar | `--surface-soft`, `--surface-hover`, `--chrome` | `#e7eef5`, `#f9fbfe`, `#dfe8f0` |
| Subtle separator / frame edge / text on dark | `--line-soft`, `--line-strong`, `--on-dark-muted` | `#e2e9f0`, `#c4d2df`, `#c3d1dc` |
| Repaired text / surface / edge | `--success`, `--success-surface`, `--success-border` | `#2d5427`, `#e7f2dc`, `#a6c982` |
| Repaired hover / press | `--success-hover`, `--success-press` | `#dbecc9`, `#cbe3b1` |
| Finding / alert surface / warning | `--danger`, `--danger-surface`, `--warning` | `#9d4437`, `#f9e7dc`, `#8d5e16` |

Manrope is self-hosted for the brand and display hierarchy (`--font-display`). Functional text uses the system UI stack (`--font-body`). Source keys and rule identifiers use the platform monospace stack (`--font-data`). Amounts and scores use tabular numerals. No new font dependency is added.

The audit type roles are caption 12px, small 14px, body 16px, section 20px, title 24px, and phone money 32px. Workspace headings range from 24–36px; money ranges from 28–40px on larger layouts. The functional scale is intentionally tighter than a marketing scale. Body leading is 1.5–1.6. Captions do not shrink below 12px in audit chrome. The sample portal and separate opening are not governed by this audit type scale.

Spacing tokens are 4, 8, 12, 16, 24, 32, 48, and 56px. Control icon gaps use 8px; group gaps use 16–32px. Receipt insets are 24px on wide panels and 16px on narrow panels. The workspace maximum width is 1536px, with 48/32/16px responsive gutters; header content follows its keylines on ultrawide screens.

Radii are 4px for source keys and tertiary controls, 8px for primary controls, and 12px for the receipt and scenario surfaces. Circular selection markers are an explicit exception. Structural borders use one CSS pixel. The receipt alone uses `--shadow-sheet: 0 12px 32px -24px #13283e70`; the sample browser frame uses a structural edge without a competing shadow.

Audit controls have a minimum 44×44px target. The primary mode control is at least 56px high. Receipt rows are at least 52px high. Phone filter controls use two columns with a fixed 44px minimum. Selection also changes text and a border or icon; it never depends on color alone.

Press, micro, and state durations are 80, 140, and 220ms with `cubic-bezier(.2,0,0,1)`. Safe Mode uses an interruptible 0.96 press scale and an overlaid shield/revert icon crossfade. Frequent source, filter, reset, and rescan controls use immediate fill feedback with no travel. Reduced motion removes scale, blur, and travel while retaining labels, fill, and selection. Scores animate `scaleX` instead of width; their values update immediately.

## Artwork
Two images were generated with the authenticated Limora service: one studio background and one six-object transparent sheet. The sheet contains a glass inspection frame, paper receipt, medical clipboard, router, electric meter, and magnifier. Six local crops are derivatives, not six additional generations. WebP files preserve real alpha. See docs/ARTWORK_PROVENANCE.md.

## Motion and feedback
Pointer-down gives immediate visual feedback. Scroll and fine-pointer depth animate independent image planes from current values. Native scrolling and links remain available during movement. Reduced motion uses a static aligned composition and removes source-trace travel. Background tabs and offscreen scenes stop animation work. Citation numbers refer to real charge-source pairs; they are not decorative step labels.

## Quality floor
No generic feature-card wall, invented metrics, fabricated savings, loading theater, or artwork masquerading as a functional screenshot. The real audit has readable source labels, clear selected states, focus indicators, rollback, and useful empty/error states. Inspect mobile and desktop renders and intermediate motion states before shipping.

## Functional refinement, 2026-11-27

The receipt uses intrinsic wrapping for its two totals. Increased text size can place totals on separate rows without overlapping. On a panel narrower than 420px, each charge name occupies its own line and the amount sits below it on the same source keyline. Full source strings remain in the button text and title. Filter counts report the visible subset, such as “1 of 10”.

The redundant “Your plain-language receipt” subtitle was removed; the charge header now reports the actual number of included charges. Source instructions, estimate limitations, repair consequences, and revert guidance remain because they change how the user interprets the result.

The prior beige/teal chrome and duplicated responsive overrides were removed. The portal fixture block and its responsive rules are retained separately to preserve scan behavior. Existing source-citation motion remains the signature; no new decorative motion, spinner, or loading delay is added.

Skill exceptions are explicit: the current system font and hex palette follow this existing design; transparent illustration crops do not receive rectangular image outlines; frequent controls do not bounce; money never rolls through fabricated intermediate financial values. Browser zoom and screen-reader verification must be distinguished from diagnostic text/CSS scaling and automated accessibility checks.
