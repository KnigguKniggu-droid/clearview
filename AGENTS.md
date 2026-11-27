# PROJECT SPECIFICATION & MASTER AGENT CONTEXT: CLEARVIEW

> **Usage:** Save this file in the root of your `clearview/` repository as `AGENTS.md` (and symlink `CLAUDE.md -> AGENTS.md`) so **OpenAI Codex CLI** and **Claude Code** execute with full hackathon, tooling, UI/UX, and architectural context.

---

## 1. Codex CLI Execution Settings & Agent Workflow
- **Recommended Effort Level:**
  - **Initial Scaffolding & Deterministic Engine (`packages/analyzer`):** Run Codex CLI at **`high` reasoning effort** (`/model` -> `high`) so WCAG luminance math, ancestor color compositing, DOM snapshot rollback, and JSDOM edge cases are engineered cleanly on the first pass.
  - **UI Portals, Extension Wiring & Styling (`apps/web-sandbox`, `apps/extension`):** Switch to **`medium` reasoning effort** for fast iteration on React/Tailwind layouts, then back to **`high`** for final cross-workspace build verification and edge-case regression testing.
- **Agent Execution Discipline:**
  1. Never leave placeholder `TODO` functions or stubbed rules—every detector and repair action must be 100% implemented and covered by Vitest assertions.
  2. Run `npm test` after finishing `packages/analyzer` and fix any JSDOM/CSS-parsing discrepancies before generating UI apps.
  3. Keep `packages/analyzer` strictly framework-agnostic (zero React, Tailwind, or `chrome.*` API imports) so both `apps/web-sandbox` and `apps/extension` share identical deterministic behavior.

---

## 2. Hackathon Context, Rules & Judging Alignment (Code for Change)
- **Event:** Code for Change (`https://code-for-change-global.devpost.com/`)
- **Organizer:** HackathonForEveryone (Global Online Student Hackathon)
- **Hard Submission Deadline:** **Tuesday, December 1, 2026 @ 7:00 PM CST** (5:00 PM PST)
- **Eligibility Note:** Verify under-18 student eligibility/parental consent details under the Devpost "View full rules" tab prior to final submission.
- **Core Build Mandate:**
  - Build a **brand-new** practical technology project addressing a real-world social-impact challenge (accessibility, consumer protection, digital equity).
  - Zero reliance on paid external LLM APIs or fragile third-party scraping endpoints that could rate-limit or fail during judging.
- **Required Submission Deliverables:**
  1. **Live Interactive Demo Link:** Vercel-hosted web sandbox (`apps/web-sandbox`) for instant zero-install judge testing.
  2. **Chrome Extension Build:** Unpacked Manifest V3 extension (`apps/extension`) + packaged `.zip` release for auditing real-world websites.
  3. **Demo Walkthrough Video (~2.5 minutes):** Showing live DOM auditing, financial commitment extraction, and 1-click non-destructive Safe Mode auto-repair on both the Vercel sandbox and live sites.
  4. **Public Source Repository & Documentation:** Clean GitHub repo with clear setup, build, and `npm test` instructions, plus Devpost writeup.
- **Judging Rubric (4 Pillars — 25% Each):**
  1. **Impact:** Directly protects vulnerable users (elderly, low-vision, neurodivergent, non-native speakers) from deceptive billing dark patterns and inaccessible medical, utility, and government portals.
  2. **Originality:** Deterministic DOM & Accessibility Tree formal verification paired with non-destructive live DOM auto-repair and element-cited plain-language financial receipts—not a generic LLM wrapper.
  3. **Technical Execution:** Strict TypeScript monorepo, exact WCAG 2.1 sRGB luminance math, AST/DOM dark-pattern detectors, reversible DOM patching with native event dispatch, and comprehensive Vitest test coverage.
  4. **Presentation:** Split-screen interactive Vercel sandbox + Chrome Side Panel HUD + visual bounding overlays + clear demo video.

---

## 3. Required Software, Stack, Packages & Tooling
Ensure the environment and workspace install and configure the following exact stack:
- **Runtime & Package Manager:** Node.js (`>= 20.x`) + `npm` workspaces (`"workspaces": ["packages/*", "apps/*"]`).
- **Language & Build Tools:**
  - `typescript` (`^5.6.0`, strict mode enabled via `tsconfig.base.json`)
  - `vite` (`^6.0.0`) + `@vitejs/plugin-react` (`^4.3.0`)
- **UI & Frontend Libraries (`apps/web-sandbox` & `apps/extension`):**
  - `react` (`^19.0.0`) & `react-dom` (`^19.0.0`)
  - `tailwindcss` (`^3.4.0`), `postcss`, `autoprefixer`
  - `lucide-react` (`^0.460.0`) for crisp, accessible security/audit/accessibility iconography (`ShieldCheck`, `ShieldAlert`, `Eye`, `AlertTriangle`, `Receipt`, `CheckCircle2`, `LocateFixed`, `RotateCcw`, `Sparkles`)
- **Testing & Verification (`packages/analyzer`):**
  - `vitest` (`^2.1.0`)
  - `jsdom` (`^25.0.0`) for headless DOM & computed-style testing
- **Chrome Extension Tooling (`apps/extension`):**
  - `@types/chrome` (`^0.0.280`)
  - Manifest V3 (`manifest_version: 3`) with `sidePanel`, `activeTab`, and `scripting` permissions
- **Deployment Target:**
  - Vercel (`apps/web-sandbox/vercel.json` configured for static Vite SPA deployment)

---

## 4. UI/UX & Frontend Design System ("Civic Trust & Precision HUD")
Design both `apps/web-sandbox` and `apps/extension` sidepanel with high-contrast legibility, zero visual clutter, and tactile controls:
- **Color Palette & Contrast Discipline:**
  - **Guard HUD Surface:** Crisp slate-dark header (`#0F172A`) paired with ultra-clean off-white inspector cards (`#F8FAFC` / `#FFFFFF`) and `1px` borders (`#E2E8F0`) so every badge and score gauge pops clearly on screen recordings.
  - **Semantic Status Colors (All WCAG AA+ Compliant):**
    - **Safe / Repaired:** Emerald (`#15803D` text on `#DCFCE7` badge; `#16A34A` active toggle)
    - **Critical Trap / Hidden Fee:** Crimson (`#B91C1C` text on `#FEE2E2` badge; `#DC2626` DOM outline)
    - **Warning / Confirm-Shaming / Urgency:** Amber (`#B45309` text on `#FEF3C7` badge; `#FEF08A` Safe Mode disclosure highlight)
- **Typography & Hierarchy:**
  - Clean sans-serif UI (`Inter`, system-ui, sans-serif) for explanations and receipts; tabular monospace (`JetBrains Mono`, `ui-monospace`, monospace) for dollar totals, contrast ratios (`2.54:1`), WCAG rule IDs (`WCAG 1.4.3`), and Trust Scores (`38/100`).
- **Split-Screen Web Sandbox Layout (`apps/web-sandbox`):**
  - **Top Control Bar (`56px` height):** ClearView brand mark + scenario switcher pills (`1. Medical Billing Portal`, `2. Telecom & Stream Checkout`, `3. LoneStar Utility Enrollment`) + "Reset Portal State" button.
  - **Left Pane (`58%` width on desktop, stacked on mobile):** Realistic simulated third-party portal rendered inside a browser-chrome frame (`PortalFrame.tsx`) with live interactive inputs, checkboxes, and running order totals.
  - **Right Pane (`42%` width on desktop):** Sticky **ClearView Guard HUD (`GuardPanel.tsx`)** featuring:
    1. **Dual Score Header:** `Trust Score (0–100)` + `Accessibility Score (0–100)` with instant before/after delta badge when Safe Mode activates.
    2. **Master Hero Toggle:** Full-width tactile **"Activate Safe & Accessible Mode"** button (switches to **"Safe Mode Active — Revert Changes"** when enabled).
    3. **Verified Plain-Language Receipt (`ReceiptCard.tsx`):** Summarizes `Due Today ($)` vs. `Recurring Monthly ($/mo)`, highlighting pre-selected traps and updating live when Safe Mode unchecks optional add-ons.
    4. **Filterable Audit Findings Feed (`FindingItem.tsx`):** Tabs for `All`, `Dark Patterns`, `Hidden Fees`, and `Accessibility`. Clicking any finding smoothly scrolls the left portal viewport to `[data-clearview-id]` and triggers a 2-second pulse ring animation.

---

## 5. Monorepo Directory Structure (`clearview/`)

```text
clearview/
├── package.json                      # Workspace root ("packages/*", "apps/*")
├── tsconfig.base.json                # Shared strict TypeScript configuration
├── AGENTS.md                         # Master project & agent context (Codex CLI)
├── CLAUDE.md                         # Symlink -> AGENTS.md (Claude Code)
├── README.md                         # Judge setup, architecture & demo walkthrough guide
├── packages/
│   └── analyzer/                     # @clearview/analyzer (Pure TypeScript, zero React/Chrome deps)
│       ├── package.json
│       ├── tsconfig.json
│       ├── vitest.config.ts
│       ├── src/
│       │   ├── types.ts              # Unified interfaces: AuditFinding, FinancialCommitment, AuditReport, RepairSnapshot
│       │   ├── contrast.ts           # WCAG 2.1 sRGB relative luminance & ancestor background resolver
│       │   ├── ariaAudit.ts          # Missing labels, keyboard traps, tabindex>0, missing img alt
│       │   ├── darkPatterns.ts       # Pre-checked boxes, micro-print fees, confirm-shaming, timers
│       │   ├── receiptExtractor.ts   # Deterministic currency, billing cadence & required-field extractor
│       │   ├── scoring.ts            # Deterministic 0–100 Trust & Accessibility score calculator
│       │   ├── autoRepair.ts         # Reversible DOM patcher + native event dispatch + rollback
│       │   └── index.ts              # Public API: scanDocument, applySafeMode, revertSafeMode, highlightElement
│       └── tests/
│           ├── contrast.test.ts
│           ├── ariaAudit.test.ts
│           ├── darkPatterns.test.ts
│           ├── receiptExtractor.test.ts
│           └── autoRepair.test.ts
├── apps/
│   ├── web-sandbox/                  # Hosted Vercel Interactive Sandbox (React 19 + Vite + Tailwind)
│   │   ├── package.json
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── vercel.json
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── index.css             # Tailwind directives + @keyframes clearview-pulse animation
│   │       ├── App.tsx               # Top bar + split-screen PortalFrame & GuardPanel
│   │       ├── components/
│   │       │   ├── GuardPanel.tsx    # Shared Inspector HUD (Scores, Master Toggle, Receipt, Findings)
│   │       │   ├── ReceiptCard.tsx   # Verified Plain-Language Financial Commitment breakdown
│   │       │   ├── FindingItem.tsx   # Click-to-locate violation card with WCAG/Rule badges
│   │       │   └── PortalFrame.tsx   # Simulated browser frame hosting active portal
│   │       └── portals/
│   │           ├── MedicalPortal.tsx         # St. Jude Regional Medical Billing & Intake
│   │           ├── SubscriptionCheckout.tsx  # SwiftNet / StreamPlus Checkout with add-on traps
│   │           └── UtilityPlanPortal.tsx     # LoneStar Grid Residential Electricity Enrollment
│   └── extension/                    # Chrome Extension Manifest V3 (React 19 + Vite + Tailwind)
│       ├── package.json
│       ├── manifest.json             # MV3 with sidePanel, activeTab, scripting
│       ├── vite.config.ts
│       └── src/
│           ├── background.ts         # Opens sidePanel on toolbar icon click
│           ├── contentScript.ts      # Scans active tab DOM, injects visual badges & Safe Mode
│           └── sidepanel/
│               ├── index.html
│               ├── main.tsx
│               ├── index.css
│               └── SidePanelApp.tsx  # Live browser inspector HUD
```

---

## 6. Unified Data Contracts (`packages/analyzer/src/types.ts`)

```typescript
export type FindingCategory = 'dark-pattern' | 'hidden-fee' | 'accessibility';
export type FindingSeverity = 'critical' | 'warning' | 'info';
export type BillingCadence = 'one-time' | 'monthly' | 'annual' | 'unknown';

export interface AuditFinding {
  id: string;                        // Deterministic ID (e.g., "cv-dp-001")
  clearviewId: string;               // Tagged onto target DOM node via `data-clearview-id`
  category: FindingCategory;
  ruleId: string;                    // e.g., "DP-001", "DP-002", "WCAG-1.4.3", "WCAG-3.3.2"
  wcagCriterion?: string;            // e.g., "WCAG 2.1 AA 1.4.3"
  severity: FindingSeverity;
  title: string;                     // Crisp headline
  plainLanguageExplanation: string;  // Clear, jargon-free explanation for end users
  recommendedAction: string;         // What Safe Mode repairs or what user must verify
  evidenceText: string;              // Truncated DOM text/snippet (max 120 chars)
  isAutoRepairable: boolean;
}

export interface FinancialCommitment {
  id: string;
  clearviewId: string;
  label: string;                     // Extracted item/fee description
  amountText: string;                // Exact matched string (e.g., "$19.99/mo", "$149.00")
  numericValue: number;              // Parsed numeric amount (e.g., 19.99)
  cadence: BillingCadence;
  isPreselected: boolean;            // True if pre-checked checkbox or mandatory fee line
  isHiddenOrLowContrast: boolean;    // True if font-size < 11px, opacity < 0.75, or contrast < 4.5
}

export interface AuditReport {
  timestamp: string;
  safeModeActive: boolean;
  summary: {
    totalFindings: number;
    critical: number;
    warning: number;
    info: number;
    accessibilityScore: number;      // 0–100 deterministic score
    trustScore: number;              // 0–100 deterministic anti-dark-pattern score
    overallScore: number;            // Weighted average (50% trust + 50% accessibility)
    totalImmediateDue: number;       // Sum of active one-time / initial charges
    totalRecurringMonthly: number;   // Sum of active monthly recurring charges
  };
  findings: AuditFinding[];
  financialCommitments: FinancialCommitment[];
}

export interface ElementRepairRecord {
  clearviewElementId: string;
  originalChecked?: boolean;
  originalAriaLabel?: string | null;
  originalRole?: string | null;
  originalTabIndex?: string | null;
  originalStyleCssText: string;
  addedKeyListener?: boolean;
}

export interface RepairSnapshot {
  appliedAt: number;
  records: ElementRepairRecord[];
}
```

---

## 7. Deterministic Engine Rules (`packages/analyzer`)

### 7.1 `contrast.ts` — WCAG 2.1 Luminance & Ancestor Background Resolution
- Parse CSS `color` and `background-color` (`rgb()`, `rgba()`, `#RGB`, `#RRGGBB`, `transparent`).
- Walk up `element.parentElement` to resolve effective background color when `transparent` or `rgba(..., 0)` (defaulting to white `rgb(255, 255, 255)` at root).
- Linearize 8-bit sRGB channels $C \in [0, 255]$:
  $$c = \frac{C}{255}, \quad C_{\text{lin}} = \begin{cases} \frac{c}{12.92} & \text{if } c \le 0.04045 \\ \left(\frac{c + 0.055}{1.055}\right)^{2.4} & \text{if } c > 0.04045 \end{cases}$$
- Relative luminance: $L = 0.2126 R_{\text{lin}} + 0.7152 G_{\text{lin}} + 0.0722 B_{\text{lin}}$.
- Contrast ratio: $CR = \frac{\max(L_1, L_2) + 0.05}{\min(L_1, L_2) + 0.05}$.
- Flag `WCAG-1.4.3` if $CR < 4.5$ for normal text or $CR < 3.0$ for large text ($\ge 24\text{px}$ regular or $\ge 18.66\text{px}$ bold).

### 7.2 `ariaAudit.ts` — Accessibility Tree & Keyboard Traps
- **`WCAG-3.3.2` Unlabeled Form Controls (`critical`):** Flag `<input>` (excluding `hidden`, `submit`, `button`), `<select>`, and `<textarea>` lacking `<label for>`, enclosing `<label>`, non-empty `aria-label`, or valid `aria-labelledby`.
- **`WCAG-4.1.2` Empty Interactive Controls (`warning`):** Flag `<button>`, `a[href]`, and `[role="button"]` with empty accessible names (`textContent`, `aria-label`, and `title` all empty).
- **`WCAG-2.1.1` Non-Semantic Clickable Elements (`warning`):** Flag `<div>`, `<span>`, or `<a>` without `href` having `onclick`, `data-clickable`, or `cursor: pointer` without `role` and `tabindex >= 0`.
- **`WCAG-2.4.3` Positive Tabindex Traps (`warning`):** Flag elements with `tabindex > 0` hijacking natural keyboard focus order.
- **`WCAG-1.1.1` Missing Image Alt Text (`warning`):** Flag `<img>` missing `alt` attribute (unless `role="presentation"` or `aria-hidden="true"`).

### 7.3 `darkPatterns.ts` — Predatory UI Detectors
- **`DP-001` Pre-Checked Recurring / Add-On Trap (`critical`):** `<input type="checkbox">` with `checked === true` whose label or surrounding container (up to 2 ancestor levels) matches `/auto[- ]?renew|monthly|recurring|trial|protection|shield|insurance|membership|subscription|billed|add[- ]?on|telehealth|offset|newsletter/i`.
- **`DP-002` Micro-Print / Low-Visibility Financial Disclosure (`critical`):** Visible text node containing currency (`[$€£]\s*\d`) or billing trap keywords (`/auto[- ]?renew|cancellation fee|non[- ]?refundable|variable rate|surcharge|facility fee|after trial|per month|\/mo/i`) where computed `fontSize < 11` (px) OR computed `opacity < 0.75` OR contrast ratio `< 4.5`.
- **`DP-003` Confirm-Shaming Opt-Out (`warning`):** `<button>`, `<a>`, or `[role="button"]` matching guilt-tripping decline copy (`/no thanks.*(prefer|like|want|hate|don't want|pay full|miss out|overpay|stay unprotected|risk)/i`).
- **`DP-004` Fake Urgency Countdown Timer (`warning`):** Elements matching countdown time strings (`/\b0?\d:\d{2}(:\d{2})?\b/` or `/expires in|offer ends|reserved for|act now/i`) or `[data-countdown]`.

### 7.4 `receiptExtractor.ts` — Verified Financial Commitments
- Extracts every visible price (`[$€£]\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?`), classifies `cadence` (`one-time`, `monthly`, `annual`, `unknown`), detects `isPreselected` (active base cost, mandatory fee, or checked checkbox row) and `isHiddenOrLowContrast`, and computes `totalImmediateDue` and `totalRecurringMonthly`.

### 7.5 `autoRepair.ts` — Reversible Live DOM Patching (`applySafeMode` / `revertSafeMode`)
- Tags every audited element with `data-clearview-id="cv-<n>"`.
- **`applySafeMode(root, report): RepairSnapshot`:**
  1. Records exact initial attributes/styles into `RepairSnapshot`.
  2. **Unchecks predatory add-ons (`DP-001`):** Sets `checkbox.checked = false` AND dispatches both `new Event('change', { bubbles: true })` and `new Event('input', { bubbles: true })` so host React state updates displayed totals immediately.
  3. **Exposes hidden/low-contrast fees (`DP-002` / `WCAG-1.4.3`):** Forces high-contrast readable styling (`background-color: #FEF08A !important; color: #111827 !important; font-size: 13px !important; opacity: 1 !important; padding: 2px 6px; border-radius: 4px; font-weight: 600;`).
  4. **Repairs unlabeled inputs (`WCAG-3.3.2`):** Infers accessible name from `placeholder`, `name`, `id`, or sibling text and injects `aria-label`.
  5. **Fixes keyboard traps (`WCAG-2.1.1` / `WCAG-2.4.3`):** Injects `role="button"`, `tabindex="0"`, and `Enter`/`Space` keyboard activation on non-semantic buttons; normalizes `tabindex > 0` to `tabindex="0"`.
  6. **Injects visual badges (`[data-clearview-badge]`):** Renders clean inline/overlay status pills on flagged elements.
- **`revertSafeMode(root, snapshot)`:** Removes all `[data-clearview-badge]` elements, detaches injected key listeners, and restores every recorded DOM property cleanly.
- **`highlightElement(root, clearviewId)`:** Smoothly scrolls `[data-clearview-id="${clearviewId}"]` into center view and applies a 2-second visual pulse ring.

---

## 8. Simulated Judge Sandbox Portals (`apps/web-sandbox/src/portals/`)
1. **`MedicalPortal.tsx` ("St. Jude Regional Medical — Express Intake & Billing"):**
   - `$185.00` Outpatient Visit Copay + hidden `$149.00 Administrative Facility Fee` in `9px` low-contrast gray (`#9CA3AF` on `#FFFFFF`).
   - Pre-checked *"Enroll in $29.99/mo Priority Telehealth Membership"* checkbox (updates dynamic total on uncheck).
   - Unlabeled Patient DOB & Insurance Member ID inputs (`placeholder` only).
   - Non-semantic `<div onClick={...}>Submit Payment & Intake</div>` button unreachable via `Tab` key.
2. **`SubscriptionCheckout.tsx` ("SwiftNet Fiber & StreamPlus Checkout"):**
   - Base plan `$55.00/mo` + two pre-checked add-ons: *"Whole-Home Device Shield ($19.99/mo)"* and *"Priority Router Care ($9.99/mo)"* (live subtotal updates dynamically when Safe Mode unchecks them).
   - Live ticking countdown banner (`04:59` urgency timer).
   - `9px` opacity-`0.65` disclosure: *"Promotional rate auto-renews at $89.99/mo after 12 months."*
   - Confirm-shaming opt-out button: *"No thanks, I prefer paying full price for repairs."*
3. **`UtilityPlanPortal.tsx` ("LoneStar Grid — Residential Electricity Enrollment"):**
   - Low-contrast `#A1A1AA` on `#F9FAFB` (`2.3:1`) peak-hours surge clause (`$0.28/kWh peak demand surcharge`).
   - Pre-checked *"Green Grid Carbon Offset ($19.50/mo recurring)"*.
   - Unlabeled ESIID Meter Number & SSN inputs + broken positive `tabindex="5"` trap.

---

## 9. Copy-Paste Kickoff Prompt for OpenAI Codex CLI

```text
Read AGENTS.md completely and execute at high reasoning effort. Build the entire `clearview` TypeScript monorepo (`packages/analyzer`, `apps/web-sandbox`, and `apps/extension`) strictly following every architectural rule, data contract, deterministic WCAG/dark-pattern algorithm, UI/UX specification, and sandbox portal requirement in AGENTS.md.

Execution steps:
1. Initialize root workspace `package.json`, `tsconfig.base.json`, `README.md`, and directory tree.
2. Implement `packages/analyzer` (`types.ts`, `contrast.ts`, `ariaAudit.ts`, `darkPatterns.ts`, `receiptExtractor.ts`, `scoring.ts`, `autoRepair.ts`, `index.ts`) with zero external runtime dependencies.
3. Write comprehensive Vitest + JSDOM unit tests in `packages/analyzer/tests/` covering sRGB contrast math, ancestor background resolution, all ARIA/keyboard rules, all 4 dark-pattern detectors, financial receipt extraction, and the `applySafeMode` -> `revertSafeMode` round-trip (including native `change` event dispatch). Run `npm test` and ensure 100% pass rate before proceeding.
4. Implement `apps/web-sandbox` (React 19 + Vite + Tailwind CSS + Lucide icons) with the split-screen Civic Trust & Precision HUD (`GuardPanel`, `ReceiptCard`, `FindingItem`, `PortalFrame`) and all 3 interactive portals (`MedicalPortal`, `SubscriptionCheckout`, `UtilityPlanPortal`), plus `vercel.json`.
5. Implement `apps/extension` (Manifest V3 `manifest.json`, `background.ts`, `contentScript.ts`, and React `sidepanel`) sharing `@clearview/analyzer`.
6. Install all dependencies and run `npm test` and `npm run build` from the workspace root to confirm everything compiles and passes with zero errors.
```

## Verified implementation amendments

These amendments supersede unsupported event and marketing statements above.

- The published event rules require participants to be above the legal age of majority. No parental-consent exception is stated. Equal 25% judging weights are not published. See docs/SUBMISSION.md.
- ClearView implements deterministic DOM heuristics. Do not call this formal verification, a complete accessibility-tree audit, WCAG certification, or verification of a real financial liability.
- FinancialCommitment adds currency, includedInTotals, and exclusionReason. AuditReport adds limitations. Unknown, annual, conditional, future, usage-based, aggregate, and non-USD prices remain cited separately from the fixed USD totals.
- Safe Mode must receive the original report object for the same root. Internal element identities prevent a host-controlled copied data-clearview-id from redirecting a repair.
- The sandbox uses native input/change listeners to integrate checkbox repairs with React state. Do not replace those listeners with React onChange alone.
- Use the installed ECC guidance and the project context in .codex/AGENTS.md. The root verify command includes lint, tests, types, and builds. Run browser tests and coverage separately.
- The requested Vitest 2 toolchain retains development dependency advisories. API/UI servers are disabled. See docs/DEPENDENCY_REVIEW.md.
- CLAUDE.md uses @AGENTS.md because this process cannot create Windows symbolic links.

## 2026-11-27 Guard rebuild amendments
These later owner instructions supersede the earlier appearance, third main sample and one-click apply details above. Use the dark --cv-* palette and IBM Plex Sans/Mono in DESIGN.md. Render the working inspector immediately. The main samples are Medical Billing, Telecom Checkout and Senior Tax Relief; keep the legacy utility sample available standalone. Safe Mode requires reviewing selected actions. Add-on removal starts unchecked. Report JSON import is read-only and validates bounded data. Source and publication approval from the owner remains in force; do not re-request it for this rebuild. The prior86676fa video is historical and no longer freezes runtime development.

## 2026-11-27 Warm Civic Daylight amendments — current

The latest owner direction supersedes the dark Guard appearance, IBM Plex type, 58/42 split, and technical-first summary above. Use the current `DESIGN.md`: warm paper `#F6F5F1`, white surfaces, Inter, 16 px body text, 14 px metadata, a 64 px minimum desktop header, and a 55/45 desktop workspace. The main labels are **Medical Bill**, **Internet Checkout**, and **Senior Tax Form**. Keep the legacy utility fixture available standalone.

Use main text `#111827`, secondary text `#374151`, primary action `#0F4C81`, and hover `#0A365C`. Error body text is `#991B1B` on `#FEF2F2`; warning body text is `#78350F` on `#FFFBEB`; applied-change text is `#065F46` on `#ECFDF5`. Preserve the supplied accent and border colors separately. These specified solid text pairs exceed 7:1. Do not infer full AAA conformance from this math or from axe results. Screen-reader behavior and actual browser zoom remain UNKNOWN until measured.

Present plain review guidance and the actual receipt first. Keep technical rule IDs and scores in collapsed details. The primary action opens an explicit selection review. Removing a selected add-on starts unchecked. A selected monthly subtotal requires a live checkbox-to-price relationship; `isPreselected` alone also includes base charges. Removed-option amounts require successful selected actions and unchanged source evidence. Do not claim money at risk, guaranteed savings, a required liability, or a fully safe page.

The repair API supports `applySafeMode(root, reviewedReport, { findingIds })`, per-action outcomes, stale-target rejection, current owned-node counts, and conflict-aware rollback. Imported reports remain bounded, validated, read-only data. They must never authorize a live repair.

Readability repairs must use at least 16 px while preserving larger computed text sizes; this supersedes the original 13 px repair instruction above. ClearView's source marker is a compact 14 px `✓` with its explanatory title retained, text `#065F46`, background `#ECFDF5`, and border `#6EE7B7`. The compact marker must not expand narrow source rows. Keep review actions in normal flow so they do not obscure focused choices.

The daylight integrated `npm run verify` passed with exit code 0: 129 tests (56 analyzer, 52 reporting, 21 extension), lint, types, and builds. Later web filter semantics and review-footer fixes passed a fresh build and all 21 browser tests in 21.1 seconds. Final web assets are `index-BArohdx3.js` and `index-BDzfqFmG.css`; extension assets are `index-DwQrynLZ.js` and `index-BNoosXM1.css`. The final extension runtime at `2026-11-27T18:07:13.843Z` passed 320/420 px, keyboard, selected-add-on, compact-marker, restore, and exact-rollback checks. Corrected, calibrated 7:1 text checks have zero violations/incomplete results across 12 web view/width combinations and initial, expanded review, and active extension states. Earlier 17:56/18:02 runtime claims of 7:1 used an ignored configuration and are superseded. No full AAA claim follows. Owner-visible multi-site testing in the owner's installed Chrome and publication remain pending. The earlier 123 unit/integration and 21 Chromium browser passes belong to the dark revision. Preserve those results and the `86676fa` film as historical evidence; do not equate automated Chromium with owner-Chrome testing.

The owner's GitHub and signed-in Vercel publication authorization persists. Do not re-request it for this visual change. Complete current release checks before publication. Video upload and Devpost submission remain separate, unauthorized actions.
