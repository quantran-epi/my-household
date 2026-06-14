# Project Research Summary

**Project:** my-household
**Domain:** UI/UX refactor of an existing local-first household meal-planning PWA (React 18 + RTK + Ant Design 5) — guided "what to cook tonight" wizard, app-wide Vietnamese copy pass, mobile-first tuning
**Researched:** 2026-06-14
**Confidence:** HIGH (stack + architecture, codebase-verified pitfalls); MEDIUM (feature/competitor specifics, Vietnamese copy phrasing)

## Executive Summary

This milestone is a **UX refactor of capability that already ships**, not a new product. The "what to cook" brain already lives in `DishSuggester` (a 4-mode, 2-step antd modal that reads via selectors and ends in `startCooking`); the work is to reframe and re-sequence those existing primitives into a guided, phone-first journey that ends in a *scheduled meal* — plus a friendly Vietnamese copy pass and mobile tuning across the app. The dominant success metric is concrete: a cold-start first-timer reaches a planned meal unaided.

The recommended approach is **add almost nothing to the stack**. Every goal is met by primitives already installed: antd `Steps` (progress), `Drawer placement="bottom"` (mobile sheets), `Segmented`/`FloatButton`/`Result`, a new RTK slice in the existing `personal` persisted root (so an interrupted wizard resumes offline), and a typed `as const` strings module under `src/Common/Copy` for single-locale Vietnamese copy. No i18next (multi-locale is out of scope), no `antd-mobile`, no second form/state library. Architecturally the wizard is a new vertical-slice module (`src/Modules/MealPlanWizard`) of thin step widgets that read existing selectors and reuse `DishScorer`/`useScheduledCalculation` — sequencing and copy are new; scoring is not.

The risk profile is **silent regression**, not "can we build it." Three codebase facts make this acute: ~408 Vietnamese strings are hardcoded inline in JSX (no central strings module), there is zero responsive-grid usage app-wide (mobile-first is net-new behavior, not a tweak), and there are ~2 unit tests across ~284 files (no safety net). Mitigation is sequencing: build the copy module before rewording, separate "pure move" from "behavior change" when extracting the 1366-line `MasterPage.tsx`, guarantee every wizard step is skippable with a guaranteed result on empty data, persist wizard answers per-step (the app force-reloads after Gist sync / SW update), and verify desktop on every mobile change.

## Key Findings

### Recommended Stack

The stack is **fixed and sufficient**. The headline finding is that all three goals (wizard, copy, mobile) are achievable with existing dependencies — most "technologies" are existing antd primitives applied to a new purpose, not new installs. See `.planning/research/STACK.md`.

**Core technologies:**
- **antd `Steps` 5.16.1** (installed): wizard progress indicator — first-party, themed via `ConfigProvider`, `responsive`/`progressDot` for compact mobile display. Stay on the 5.x API (not v6 docs).
- **antd `Drawer placement="bottom"` 5.16.1** (installed): mobile bottom-sheet for pickers/confirmations — canonical antd 5 sheet, consistent theming, wrap as `@components/Sheet`.
- **RTK slice in the `personal` persisted root** (`@reduxjs/toolkit` 2.2.3, installed): wizard step/answers orchestration that survives reload/offline — matches the `createSlice` + selector convention, migration-safe (`serializableCheck` off, selectors default missing slices).
- **Typed `as const` strings module** (new source file, no dependency): single source of truth for Vietnamese copy — type-safe, greppable, zero runtime cost. Mirrors the existing `COMMON_MESSAGE` precedent.

**Explicitly avoid:** `i18next`/`react-i18next` (multi-locale out of scope), `antd-mobile` (separate library, two theming systems), `react-use-wizard` (unmaintained, in-memory only — loses offline resume), and any new form/styling system (reuse `SmartForm` + `ConfigProvider` tokens).

### Expected Features

The guided wizard is the hero journey; everything is a journey/interaction pattern over shipping features, not a new domain. See `.planning/research/FEATURES.md`.

**Must have (table stakes):**
- Single obvious hero entry on Home ("Hôm nay ăn gì?") — without it the journey is undiscoverable
- Step-by-step wizard (one question/screen, visible progress, back, every step skippable) over existing `DishSuggester`
- Result → "Thêm vào bữa hôm nay" (`addScheduledMeal`) — the named success metric
- Friendly Vietnamese copy + inviting empty states across journey screens
- Mobile-first layout (thumb-zone CTA, ~44px touch targets)
- In-flow progress preservation (don't lose answers on interruption)

**Should have (differentiators, add after validation):**
- "Who's eating?" portion step (reuses household config / `setSelectedHouseholdMemberIds`)
- "What's in the fridge?" optional filter (existing inventory + `DishScorer.scoreWithInventory`)
- Inline "add missing ingredient to Đi chợ" (reuse `ShoppingListAddWidget`)
- Remember last session's answers as defaults
- One-line "why this dish" reasoning

**Defer (v2+):**
- "Time/effort" step — blocked on a dish attribute that may not exist (flag for requirements)
- Optional cuisine/type step — only if catalog supports meaningful categories
- Coachmark on hero button — only if testing shows users miss the entry point

**Anti-features (prevent scope creep):** account login in the wizard, AI/LLM chat, nutrition/calorie tracking, multi-week batch planning in the wizard, social/sharing, multi-slide intro carousel, configurable wizard, mandatory data entry / per-step validation gating.

### Architecture Approach

The wizard is a new vertical-slice module that plugs into the existing feature-module + split-Redux (`shared`/`personal`) + selectors-only architecture. Steps are thin presentational widgets that read domain data through the *same selectors `DishSuggester` already uses* and score with the *same `DishScorer`* — the wizard owns sequencing and copy, never a fork of the scoring brain. See `.planning/research/ARCHITECTURE.md`.

**Major components:**
1. `MealPlanWizard.screen.tsx` (`src/Modules/MealPlanWizard`) — container/orchestrator: step order, antd `Steps` indicator, next/back/skip, final scoring + `addScheduledMeal` dispatch.
2. Step widgets (`WhoStep`, `TimeStep`, `FridgeStep`, `ResultStep`, `ActionStep`) — one question each, props in / dispatch out, no raw `state.*` access.
3. `MealPlanWizardReducer.ts` — RTK slice in the **personal** persisted root holding `currentStep` + answers (resume-safe).
4. `AppCopy` strings module (`src/Common/Copy`) — typed `as const` Vietnamese copy, single audit surface.
5. Extracted shell pieces (`BottomTabNavigator`, `CookingPill`, `DataBackup` → `src/Routing/Shell/`) + `@components/Sheet` wrapper — slim down the 1366-line `MasterPage.tsx` so journey/mobile work is safe.

**Suggested build order (architecture-derived):** copy module foundation → shell extraction (+ `Sheet`) → wizard slice + selectors → wizard UI (Result+Action minimum) → hero entry on Home → mobile tuning + app-wide copy rollout. P2 enhancements slot in after the base flow is stable.

### Critical Pitfalls

The dominant risk class is silent regression on a feature-rich, near-untested app. Top pitfalls from `.planning/research/PITFALLS.md`:

1. **Wizard dead-end on cold start** — a first-timer with empty IndexedDB hits a mandatory step or an empty result and never reaches a meal. Avoid: every step skippable ("Tùy bạn"), result *always* yields ≥1 actionable dish (fall back to full catalog, else route to "add first dish"), and add a cold-start e2e (empty IndexedDB → wizard → scheduled meal) as the exit criterion.
2. **Lost capability — orphaned routes** — reframing nav buries the only path to admin/rare flows (Gist restore, publish, unit management, cooking pill). Avoid: build a reachability inventory before touching nav; re-label/re-sequence, never remove a sole entry without a replacement; keep global search working; every pre-refactor route reachable ≤3 taps or via search.
3. **Copy pass breaks JSX / introduces inconsistency at ~408 sites** — hand-editing inline strings causes syntax breakage, terminology drift, and dropped interpolations. Avoid: build the typed strings module *first*, migrate mechanically (extract → reference), *then* reword against the single file; keep interpolated strings as functions; one word per concept via a glossary.
4. **Mobile changes silently break desktop** — same components render both viewports and there's zero existing breakpoint convention; global token bumps cascade. Avoid: pick one breakpoint strategy up front, scope mobile-only chrome behind explicit breakpoints, verify desktop on every change (the repo has `performance-baseline.spec.ts`).
5. **`MasterPage.tsx` (1366 lines) destabilizes the whole shell** — extracting and changing behavior at once breaks the cooking pill / nav / backup app-wide, with no error boundary to contain it. Avoid: separate "pure move, verified identical" from behavior change; add a top-level error boundary before shell surgery; don't touch the fragile sync/reload timing code.
6. **Wizard progress wiped by reload-as-recovery** — the app force-reloads after Gist sync / SW update (1500ms/900ms timeouts); transient `useState` answers vanish mid-flow. Avoid: persist answers to the slice *per step commit*, rehydrate + resume on mount.

## Implications for Roadmap

Based on research, suggested phase structure. Ordering front-loads the cross-cutting, zero-dependency foundation (copy module, shell safety) so later phases build on a clean base in the new voice, and de-risks the shell before any behavior change.

### Phase 1: Copy infrastructure + foundation
**Rationale:** Cross-cutting and zero-dependency. Establishing the typed `AppCopy` module first means every later screen/step is written through it — no double work — and turns a 408-site edit into a single-file review. (Architecture build order step 1; Pitfall 3.)
**Delivers:** `src/Common/Copy/AppCopy.ts` (typed `as const` + derived key union) seeded with wizard + empty-state namespaces; a glossary (one word per concept); mechanical migration of inline strings can begin.
**Addresses:** Friendly Vietnamese copy + inviting empty states (table stakes).
**Avoids:** Copy inconsistency / broken JSX (Pitfall 3) — build module before rewording; keep interpolated strings as functions.

### Phase 2: Shell safety + extraction
**Rationale:** Mobile and reframe work both pressure the 1366-line `MasterPage.tsx`; making it safe is independent of the wizard and must precede it. (Architecture build order step 2; Pitfalls 5, 2.)
**Delivers:** Top-level error boundary; pure-move extraction of `BottomTabNavigator`, `CookingPill`, `DataBackup` into `src/Routing/Shell/`; `@components/Sheet` wrapper over antd `Drawer placement="bottom"`; a reachability inventory of every route.
**Uses:** antd `Drawer placement="bottom"` (STACK).
**Avoids:** Shell destabilization (Pitfall 5 — separate pure move from behavior change, verify pill/nav/drawer/search/backup identical) and lost capability (Pitfall 2 — reachability checklist).

### Phase 3: Wizard state slice + selectors
**Rationale:** Pure state work, testable in isolation before any UI. Resume-safe orchestration is a stated PWA goal. (Architecture build order step 3; Pitfall 6.)
**Delivers:** `MealPlanWizardReducer.ts` registered under `personalReducer`; `selectMealPlanWizard*` selectors; per-step-commit persistence design; characterization tests pinning current `DishScorer` behavior.
**Uses:** RTK slice in the `personal` persisted root (STACK).
**Implements:** Wizard slice + selectors-only contract (ARCHITECTURE patterns 1, 2).
**Avoids:** Progress wiped by reload (Pitfall 6 — persist per commit, rehydrate on mount); suggestion regression (Pitfall 7 — characterization tests gate any engine change).

### Phase 4: Wizard UI + hero entry (the core success metric)
**Rationale:** This is the milestone's named success metric — reach a scheduled meal. Build the container + minimum P1 steps (skip everything → suggestion → `addScheduledMeal`) reusing `DishScorer`/`useScheduledCalculation`/`DishSuggestionList`, then the discoverable Home entry. (Architecture build order steps 4–5; Pitfalls 1, 7.)
**Delivers:** `MealPlanWizard.screen` + P1 steps (Result + Action), route wiring, "Hôm nay ăn gì?" hero CTA on `Dashboard.screen.tsx`, bottom-nav center decision.
**Addresses:** Hero entry, step wizard, result → ScheduledMeal, in-flow progress (table stakes).
**Avoids:** Wizard dead-end (Pitfall 1 — every step skippable, guaranteed result, cold-start e2e as exit criterion).

### Phase 5: Mobile tuning + app-wide copy rollout
**Rationale:** With wizard and shell stable, tune touch targets and complete the cross-cutting copy migration. (Architecture build order step 6; Pitfall 4.)
**Delivers:** `ConfigProvider` token bumps (`controlHeightLG`, `fontSize`) for ~44px targets, `size="large"` in wizard, pickers moved into `Sheet`, breakpoint convention applied consistently; remaining modules + nav migrated through `AppCopy`.
**Uses:** `ConfigProvider` tokens, `Segmented`/`FloatButton` (STACK).
**Avoids:** Mobile breaks desktop (Pitfall 4 — one breakpoint strategy, scope mobile chrome behind breakpoints, verify desktop per screen).

### Phase 6: Differentiator enhancements (post-validation)
**Rationale:** P2 features slot in only after the base flow is stable, reusing the same selectors/components.
**Delivers:** WhoStep portions, FridgeStep inventory filter, inline add-to-shopping, remembered defaults, "why this dish" reasoning.
**Addresses:** Should-have differentiators (FEATURES P2). Defer "time/effort" step (P3, blocked on dish data).

### Phase Ordering Rationale

- **Dependency-driven:** copy module and shell safety are zero-dependency cross-cutting foundations that every later phase relies on; building them first avoids rework (rewording twice, doing mobile work on a fragile monolith).
- **Architecture-grouped:** state slice before UI (testable in isolation), UI before mobile polish, base flow before differentiators — matching the suggested build order in ARCHITECTURE.md.
- **Pitfall-avoidance:** the order front-loads the two highest-cost-to-recover risks (copy infrastructure, shell stability) and gates the success metric (Phase 4) behind a cold-start exit criterion. Separating "move" from "change" and persisting wizard state per-step are baked into the phase boundaries.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (Wizard UI):** verify the `Dishes` model's catalog/empty-data behavior and confirm the cold-start fallback path; confirm `ScheduledMeal` assembly details against `ScheduledMealAdd.widget.tsx`.
- **Phase 6 (Differentiators):** confirm inventory state granularity supports "can cook now" filtering; determine whether dishes carry a time/effort attribute (decides if that step is feasible at all).

Phases with standard patterns (skip research-phase):
- **Phase 1 (Copy):** well-established typed-strings pattern with a clear `COMMON_MESSAGE` precedent.
- **Phase 3 (Wizard slice):** standard `createSlice` + selectors, with `CookingSessionReducer.test.ts` as a test precedent.
- **Phase 5 (Mobile tuning):** documented antd `ConfigProvider`/`Grid` patterns; main work is verification discipline, not unknowns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Fixed stack; antd 5.16.x `Steps`/`Drawer`/`Segmented` APIs verified against v5 docs and npm registry; everything already installed. |
| Features | MEDIUM | Pattern guidance (wizard, onboarding, empty states) is HIGH; competitor-specific claims and exact Vietnamese microcopy are unverified (web tools unavailable this run). |
| Architecture | HIGH | Grounded in direct inspection of `DishSuggester`, `Store.ts`, `ScheduledMealReducer`, `AppContextReducer`, `MasterPage.tsx`, and codebase conventions. |
| Pitfalls | HIGH | Codebase-verified (408 inline strings, zero responsive grid, ~2 tests, 1366-line shell, reload-as-recovery bug); MEDIUM only on Vietnamese phrasing and untested-logic specifics. |

**Overall confidence:** HIGH

### Gaps to Address

- **Native Vietnamese copy validation** — the microcopy table is illustrative; confirm phrasing/tone/register ("nhà mình", "nhé") with a target household user during the copy phase. Maintain a glossary to enforce one term per concept.
- **Dish effort/time data** — does the `Dishes` model carry a time/effort attribute? Determines whether the "nấu nhanh/nấu kỹ" step is feasible (currently deferred to P3). Resolve during Phase 6 planning.
- **Fridge-filter feasibility** — confirm inventory state granularity supports "can cook now" filtering of `DishSuggester` candidates without touching the fragile `as any` inventory shapes. Resolve during Phase 6 planning.
- **Live competitor review** — "what to cook" app step inventories couldn't be fetched; do a targeted pass when web tools are available to validate the step order, but treat existing pattern guidance as sufficient for v1.
- **Empty-catalog success path** — confirm the result step's fallback when the dish catalog itself is empty ("add your first dish" route). Resolve as part of the Phase 4 cold-start e2e.

## Sources

### Primary (HIGH confidence)
- Existing codebase (read this run): `src/Modules/DishSuggester/Screens/DishSuggester.screen.tsx`, `src/Store/Store.ts` (split `shared`/`personal` roots), `src/Store/Reducers/ScheduledMealReducer.ts` + `Models/ScheduledMeal.ts`, `src/Store/Reducers/AppContextReducer.ts`, `src/Modules/ScheduledMeal/Screens/ScheduledMealAdd.widget.tsx`, `src/Common/Constants/CommonMessage.ts`, `src/Routing/MasterPage.tsx`, `src/Routing/RootRoutes.ts` — architecture, write paths, copy precedent, shell oversize.
- `.planning/codebase/ARCHITECTURE.md`, `STRUCTURE.md`, `CONVENTIONS.md`, `CONCERNS.md` — feature-module + selectors-only + `@components` wrapper conventions, oversized files, reload-as-recovery bug, no error boundary, ~no tests, defensive selectors.
- `.planning/PROJECT.md` — milestone goal, constraints (no rewrite, no capability lost, preserve persist roots), out-of-scope (multi-locale, backend).
- Ant Design v5 `Steps` and `Drawer` docs (`5x.ant.design`) — verified `items`/`current`/`direction`/`progressDot`/`responsive`, `placement="bottom"`/`height`; npm registry for installed versions.

### Secondary (MEDIUM confidence)
- Established UX pattern knowledge (NN/g-style guidance): guided/wizard flow design, first-run onboarding, microcopy and empty-state conventions, mobile-first interaction, touch-target/hover pitfalls — HIGH for patterns.

### Tertiary (LOW confidence)
- Competitor-specific feature claims for "what to cook" apps — NOT verified this run (live web search/fetch unavailable); verify before relying.
- Vietnamese microcopy phrasing in FEATURES.md — illustrative; validate with a native target user.

---
*Research completed: 2026-06-14*
*Ready for roadmap: yes*
