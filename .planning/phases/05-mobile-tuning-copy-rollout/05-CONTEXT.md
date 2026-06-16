# Phase 5: Mobile Tuning & Copy Rollout - Context

**Gathered:** 2026-06-16
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase makes the app **comfortable on a phone** and migrates user-facing copy to the typed `AppCopy` source of truth with **natural Vietnamese phrasing** and **friendly empty-states**. It is the milestone's final pre-validation phase — it tunes and polishes the journey built in Phase 4 and rolls the new voice across the high-traffic surfaces, without rewriting any capability.

It delivers:

1. **Phone-first layout tuning** — primary CTAs in the thumb zone, interactive controls at ~44px touch targets (MOB-01, MOB-02), applied to the guided journey screens **plus the worst-offender screens** the user actually lives in (not all ~71 files this phase).
2. **App-wide bottom-sheet adoption** — pickers and confirmations move to the `@components/Sheet` pattern across the app, not just the journey (MOB-03).
3. **Copy migration** — inline user-facing strings on the **journey + high-traffic screens** reference `AppCopy` (COPY-03, scoped — not a 566-string app-wide sweep this phase).
4. **Natural Vietnamese voice** — the `[ASSUMED]` placeholder phrasing in `AppCopy` (and migrated strings) is replaced with phrasing that reads natural to a local Vietnamese user, validated by **user review with Claude adjusting** (COPY-04).
5. **Friendly empty-states** — journey screens show inviting empty-states instead of blank/technical messages (COPY-05).

**In scope:**
- Phone-first layout (thumb-zone CTAs, ~44px targets) for journey screens + worst-offender high-traffic screens (MOB-01, MOB-02)
- App-wide picker/confirmation → `@components/Sheet` migration (MOB-03)
- Copy migration to `AppCopy` for journey + high-traffic screens (COPY-03, scoped)
- Replace `[ASSUMED]` placeholder copy with validated natural Vietnamese; user reviews, Claude adjusts (COPY-04)
- Friendly empty-states on journey screens (COPY-05)

**Explicitly NOT in scope (later phases / deferred):**
- Full 566-string / 71-file app-wide copy migration → remaining low-traffic screens are a follow-up sweep, not gated here (the journey + high-traffic subset satisfies the milestone's "reads natural" intent)
- Full phone-first layout pass on every screen → only journey + worst offenders this phase (rest is a follow-up if validated)
- Wizard v2 differentiators (portions, fridge filter, inline shopping, remembered defaults, "why this dish") → Phase 6 (WIZ2-01..05)
- "Time/effort" wizard step → out of scope (blocked on dish attribute)
- Tech-debt cleanups surfaced in CONCERNS (moment→dayjs, strict mode, oversized files, baked secrets) → not this milestone

**Scope-change note (MOB-04):** The user does not use the app on desktop and wants phone-first everywhere. Per their explicit direction, **desktop is no longer a constraint** this phase — MOB-04 ("desktop layout remains intact") is **retired as written**. Layout changes optimize for mobile; desktop is not protected and not regression-gated. This is a deliberate requirement change, recorded here (not silent drift); the planner should treat "no desktop regression" as no longer a success criterion.

</domain>

<decisions>
## Implementation Decisions

### Copy migration breadth (COPY-03)
- **D-01: Journey + high-traffic scope, not the full 566-string sweep.** Migrate inline user-facing strings to `AppCopy` on the guided journey screens (`src/Modules/MealPlanning/*`) plus the high-traffic screens the user actually lives in (the worst-offender / most-used surfaces — e.g. ShoppingList, ScheduledMeal list/add, DishSuggester, Dishes list, Ingredient list, the shell/nav in `MasterPage.tsx` / `SidebarDrawer.tsx`). Rationale: COPY-03's literal "no remaining hardcoded user-facing strings" across 71 files is disproportionate to the milestone's intent ("reads natural to a local user"); the high-traffic subset delivers that intent. Remaining low-traffic screens are a follow-up sweep, not gated here. Planner picks the exact screen set from usage/string-count; the journey screens are mandatory.

### Vietnamese voice & validation (COPY-04)
- **D-02: User reviews, Claude adjusts.** Claude proposes natural Vietnamese phrasing (replacing the `[ASSUMED]` placeholders in `AppCopy` and any newly-migrated strings), the user reviews it, and Claude revises per feedback — an iterative review loop, not a one-shot guess and not blocking on an external household interview. The glossary (`src/Common/Copy/Glossary.ts`) governs one-term-per-concept; reviewing it before/while rewording surfaces synonym drift.
- **D-03: Phrasing lock happens in `AppCopy`, not at call sites.** Because copy is centralized (Phase 1 D-07), voice refinement edits the `AppCopy` constant; migrated screens already read through it, so a phrasing change ripples without touching screens again. Order matters: migrate a screen's strings into `AppCopy`, then refine phrasing in `AppCopy`.

### Mobile tuning scope & strategy (MOB-01, MOB-02)
- **D-04: Journey + worst offenders for layout tuning.** Phone-first layout work (thumb-zone primary CTAs, ~44px touch targets) covers the guided journey screens plus the worst-offender high-traffic screens the user uses most — NOT all ~71 files this phase. Rationale: the user is phone-only and wants every screen eventually mobile-best, but a full layout pass app-wide is too large for one phase; concentrate on the journey funnel + the screens that hurt most on a phone today. The exact worst-offender set is planner discretion (informed by usage + the oversized-file list in CONCERNS), with journey screens mandatory.
- **D-05: No central responsive framework introduced — match the existing idiom.** The codebase uses ad-hoc `matchMedia`/CSS responsive checks, not a shared breakpoint system. Mobile tuning works within the existing inline-style + antd-token idiom (per Phase 4 UI-SPEC); do not introduce a new responsive abstraction as part of this phase.

### Bottom-sheet adoption scope (MOB-03)
- **D-06: App-wide picker/confirmation sweep onto `@components/Sheet`.** Migrate pickers and confirmations across the app (not just the journey) to the `@components/Sheet` bottom-sheet pattern. Rationale: a picker→Sheet swap is mechanical and low-risk, so doing it broadly is cheap and gives consistent mobile ergonomics everywhere — this is intentionally broader than the layout tuning (D-04), which is higher-effort and stays focused. `Sheet` already ships over `FastOverlay` (Phase 2 D-09) and is consumed by the 3 wizard screens; extend that adoption to the app's other pickers/confirmations. Planner inventories picker/confirmation sites; ambiguous cases (complex multi-step modals) may stay as-is at planner discretion.

### Desktop posture (MOB-04 retired)
- **D-07: Do not protect or regression-gate desktop.** Per D's explicit direction (phone-only user), desktop layout is no longer a constraint. Layout changes optimize for mobile even where that changes desktop presentation. No desktop before/after regression proof is required. (See the `<domain>` scope-change note — MOB-04 retired as written.)

### Claude's Discretion
- The exact high-traffic / worst-offender screen set for copy migration (D-01) and layout tuning (D-04) — pick from string-count + usage + CONCERNS oversized-file list; journey screens are mandatory in both.
- The exact inventory of picker/confirmation sites swept onto `Sheet` (D-06), and which complex modals are left as-is.
- Per-screen thumb-zone layout specifics and how ~44px targets are achieved within the antd-token idiom (sizing props vs wrapper styles).
- The empty-state visual/interaction treatment beyond "inviting, not technical" (COPY-05) — copy already seeded in `AppCopy.emptyStates`.
- Whether to verify mobile ergonomics via Playwright mobile viewport specs or manual device check — pick what fits TESTING.md.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` — Phase 5 owns **MOB-01, MOB-02, MOB-03, MOB-04, COPY-03, COPY-04, COPY-05**. Note: **MOB-04 is retired as written** this phase per D-07 (user is phone-only; desktop no longer protected). COPY-03 is scoped to journey + high-traffic, not all 566 strings (D-01).
- `.planning/ROADMAP.md` §"Phase 5: Mobile Tuning & Copy Rollout" — goal + 5 success criteria. Success criterion 2's "desktop layout shows no regression" is superseded by D-07.

### Copy foundation (Phase 1 — MUST read before migrating)
- `src/Common/Copy/AppCopy.ts` — the typed source of truth; currently seeded only with `common` / `wizard` / `emptyStates` namespaces, phrasing marked `[ASSUMED]`. Migration adds namespaces for high-traffic screens; voice refinement (D-02/D-03) edits this file.
- `src/Common/Copy/Glossary.ts` — one-term-per-concept reference; consult before rewording to avoid synonym drift (COPY-02 enforcement intent).
- `src/Common/Copy/index.ts` (`@common/Copy` barrel) — import path for screens; contains the documented ripgrep migration recipe (Phase 1 D-08) for locating un-migrated inline strings.
- `.planning/phases/01-copy-infrastructure/01-CONTEXT.md` — D-01..D-09: nested namespaces, direct object access (no hook/provider), interpolation as named-arg functions, glossary is review-only.

### Bottom-sheet (Phase 2 — MUST read before the picker sweep)
- `src/Components/Sheet/index.ts` — `@components/Sheet` barrel; re-exports `Sheet` / `SheetProps` from `@components/FastOverlay` (the bottom-sheet variant, NOT raw antd Drawer — Phase 2 D-09).
- `.planning/phases/02-shell-safety-extraction/02-CONTEXT.md` — D-09 (Sheet built over `FastOverlay`, conscious divergence from antd `Drawer placement="bottom"`), D-10 (wrapper-only, first real consumers arrive in Phase 5 — i.e. THIS phase).

### Journey screens (Phase 4 — the tuning + migration targets)
- `src/Modules/MealPlanning/` — wizard journey: `Screens/Wizard.screen.tsx`, `WizardIngredientStep.widget.tsx`, `WizardPreferenceStep.widget.tsx`, `WizardResult.widget.tsx`, `Components/WizardProgress.tsx`, `Routing/`. These already consume `Sheet`; they are the mandatory mobile-tuning + copy-migration target.
- `.planning/phases/04-wizard-ui-hero-entry/04-UI-SPEC.md` — design contract (spacing scale, typography roles, color 60/30/10, copywriting contract). Phase 4 explicitly deferred ~44px targets and the bottom-sheet sweep to Phase 5 — this phase fulfills them. Honor the established token/inline-style idiom.
- `.planning/phases/04-wizard-ui-hero-entry/04-CONTEXT.md` — journey decisions (D-01..D-10) that the tuning must not regress (route-hosted wizard, skip-with-default, result fallback ladder, Home hero).

### Reachability gate (still in force)
- `.planning/phases/02-shell-safety-extraction/ROUTE-INVENTORY.md` — every route + entry path. Mobile/copy changes must not drop any route's entry path (NAV-02 remains satisfied).

### Codebase maps (this milestone)
- `.planning/codebase/CONCERNS.md` — oversized-file list (informs worst-offender selection for D-04: `ShoppingListDetail.widget` 1546, `MasterPage.tsx` 1366, `DishSuggester.screen` 1280, etc.); the ad-hoc responsive idiom (D-05) and reload-as-recovery context.
- `.planning/codebase/CONVENTIONS.md` — `.screen`/`.widget` naming, selector-only reads, Vietnamese copy convention, match-surrounding-style, `strict: false` (guard manually).
- `.planning/codebase/TESTING.md` — Jest + Playwright setup; basis for any mobile-viewport or copy-presence verification.
- `.planning/codebase/STRUCTURE.md` — `@common/*` / `@components/*` aliases, where new code lives.

### Key source files (high-traffic migration/tuning candidates)
- `src/Routing/MasterPage.tsx` (~30 inline strings) + `src/Routing/Shell/SidebarDrawer.tsx` (~20) — shell/nav copy + mobile chrome.
- `src/Modules/ShoppingList/Screens/ShoppingListDetail.widget.tsx` (~36), `ShoppingList.screen.tsx` (~22) — high string count + oversized.
- `src/Modules/ScheduledMeal/Screens/ScheduledMealList.screen.tsx` (~32), `ScheduledMealAdd.widget.tsx` (~13) — journey-adjacent (result step adds here).
- `src/Modules/DishSuggester/Screens/DishSuggester.screen.tsx` (~23) — the suggester that stays reachable (NAV-02), shares pickers with the wizard.
- `src/Modules/Dishes/Screens/DishesList.screen.tsx` (~21), `src/Modules/Ingredient/Screens/IngredientList.screen.tsx` (~22) — primary list screens.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `@components/Sheet` (over `FastOverlay`): bottom-sheet wrapper already built (Phase 2) and consumed by the 3 wizard screens — the pattern to extend app-wide for the picker sweep (D-06). Shared z-index/scroll-lock/motion handling comes for free.
- `AppCopy` (`@common/Copy`): typed namespaced copy object; migration adds namespaces and screens read via direct access. Voice refinement is a single-file edit that ripples to all consumers (D-03).
- Migration ripgrep recipe (documented in `src/Common/Copy/index.ts` / `AppCopy.ts`): repeatable way to locate un-migrated inline Vietnamese strings — drives the journey + high-traffic selection (D-01).
- `AppCopy.emptyStates.*`: friendly empty-state copy already seeded (Phase 1) for COPY-05.

### Established Patterns
- Reads through `src/Store/Selectors.ts` only; copy through `@common/Copy` direct access (no hook/provider).
- Inline-style + antd-token idiom (per Phase 4 UI-SPEC) — mobile tuning works within it; no new responsive framework (D-05).
- Ad-hoc `matchMedia`/CSS responsive checks scattered across screens (no central breakpoint system) — match the local idiom of whatever file is touched.
- Picker/confirmation surfaces currently mix antd modals/drawers — the sweep normalizes them onto `Sheet`.

### Integration Points
- Screen string migration: replace inline literals with `AppCopy.<ns>.<key>` references; add new namespaces to `AppCopy.ts`.
- Picker/confirmation sites: swap antd modal/drawer usage for `<Sheet>`; verify z-index/stacking against `zIndexPopupBase: 4000`.
- Empty-states: journey screens render `AppCopy.emptyStates.*` (and journey-specific empties) instead of blank/technical messages.
- Verification: optional Playwright mobile-viewport specs / copy-presence checks under existing `tests/e2e/` + Jest.

</code_context>

<specifics>
## Specific Ideas

- The user is **phone-only** — "every screen need design best for mobile, I don't use this app for desktop." This is the guiding posture: optimize for the phone unapologetically. Breadth is staged (journey + worst offenders this phase) only because a full app-wide layout pass is too large for one phase, not because desktop matters.
- Bottom-sheets are intentionally broader (app-wide) than layout tuning (focused) because the swap is cheap and mechanical — coherent split, not a contradiction.
- Copy voice is validated by an **iterative review loop** with the user, centered on the `AppCopy` file so a phrasing tweak is one edit, not a 566-site hunt.

</specifics>

<deferred>
## Deferred Ideas

- Full 566-string / 71-file app-wide copy migration (remaining low-traffic screens) → follow-up copy sweep after this phase's journey + high-traffic subset.
- Full phone-first layout pass on every remaining screen → follow-up mobile sweep if validated (user wants it eventually; staged for scope).
- Wizard v2 differentiators (WIZ2-01..05: portions, fridge filter, inline "add to Đi chợ", remembered defaults, "why this dish") → Phase 6.
- "Time/effort" (nấu nhanh/nấu kỹ) wizard step → out of scope (blocked on dish time/effort attribute).
- Tech-debt from CONCERNS (moment→dayjs consolidation, `strict` mode, oversized-file decomposition, baked-secrets/PIN security) → not this milestone.

</deferred>

---

*Phase: 5-Mobile Tuning & Copy Rollout*
*Context gathered: 2026-06-16*
