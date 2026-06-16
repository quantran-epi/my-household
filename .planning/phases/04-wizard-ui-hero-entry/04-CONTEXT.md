# Phase 4: Wizard UI & Hero Entry - Context

**Gathered:** 2026-06-16
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase builds the **guided meal-planning journey UI** that takes a first-time user from Home to a scheduled meal — the milestone's named success metric — while keeping every pre-refactor route reachable. It is the first phase with actual wizard UI; it consumes the Phase 3 `wizard` slice and `selectWizard*` selectors (state already persists and resumes).

It delivers:

1. A **hosted wizard surface** — a full route (e.g. `/meal-planning/wizard`) running one question per screen with visible progress and a back action, every step skippable with a "Tùy bạn" default. The bottom-nav center action ("Nấu gì?") routes into this journey; the existing in-place `DishSuggesterScreen` modal stays reachable.
2. A **lean question flow** — step 1: ingredient selection (feeds `DishScorer.score(dishes, selectedIngredientIds, allDishes)`); step 2: a single preference step; then the result step.
3. A **result step** that always yields at least one actionable dish (full-catalog fallback when no match; routes to "add your first dish" on an empty catalog), presents the top few ranked suggestions, and lets the user add the chosen dish to today's meals (or a specific other day) via the existing `scheduledMeal` add path.
4. A **Home hero + entry-point reframe** — Home's hero becomes the obvious "Hôm nay ăn gì?" top CTA into the journey; primary entry points are reframed (entry points only, not a full nav teardown).

**In scope:**
- Wizard route + step screens (progress, back, skip-with-default), Sheet bottom-sheet pickers inside steps (WIZ-02, WIZ-03)
- Ingredient step + single preference step + result step (WIZ-02, WIZ-04)
- Result wiring into `DishScorer` (read-only — must not change scoring) and `addScheduledMeal` to today or a chosen day (WIZ-04, WIZ-05)
- Empty-catalog → "add first dish" route; no-match → full-catalog fallback (WIZ-04)
- Home "Hôm nay ăn gì?" hero CTA as the top entry (WIZ-01, NAV-01)
- Bottom-nav center routes into the journey while the existing suggester stays reachable (NAV-04)
- Preserve every route in `ROUTE-INVENTORY.md` within ~3 taps or via global search (NAV-02, NAV-03)
- Cold-start E2E: empty IndexedDB → wizard → scheduled meal (WIZ-07)

**Explicitly NOT in scope (later phases / deferred):**
- Phone-first layout tuning, ~44px touch targets, desktop-regression guard → Phase 5 (MOB-01..04)
- App-wide copy migration to `AppCopy` and empty-state copy pass → Phase 5 (COPY-03..05). Write new wizard strings in Vietnamese inline; the systematic migration is Phase 5.
- Portions / "who's eating?" step (WIZ2-01), fridge "can cook now" filter (WIZ2-02), inline "add to Đi chợ" (WIZ2-03), remembered defaults (WIZ2-04), "why this dish" reason (WIZ2-05) → Phase 6
- "Time/effort" (nấu nhanh/nấu kỹ) step → out of scope (blocked on dish attribute)
- Any change to `DishScorer` scoring logic → pinned by Phase 3 characterization tests
- Full navigation teardown / new IA beyond reframing entry points → entry points only this phase

</domain>

<decisions>
## Implementation Decisions

### Wizard surface & nav entry
- **D-01: Full route, not a modal/sheet shell.** The wizard is hosted on a dedicated full route (e.g. `/meal-planning/wizard`) so progress, back, and resume-on-reload behave like a real journey with its own URL. Step-internal pickers and confirmations use the `@components/Sheet` bottom-sheet wrapper (from Phase 2 D-09). Rationale: a route gives a stable resume target for the persisted `wizard` slice and a clean reachability story; the existing center-tab `DishSuggesterScreen` modal is a separate, lighter surface and stays as-is.
- **D-02: Bottom-nav center "Nấu gì?" routes into the journey; existing suggester stays reachable (NAV-04).** The center action currently toggles an in-place `DishSuggesterScreen` widget (`BottomTabNavigator.tsx`, `toggleSuggester`). Phase 4 points the primary guided entry at the wizard route while keeping the existing suggester reachable (it must not lose its only entry path per NAV-02 — `/dish-suggester` sidebar route still exists). Planner decides whether the center button goes to the wizard with the suggester demoted to a secondary affordance, or another reachable arrangement, as long as both are reachable.

### Wizard question set & order
- **D-03: Lean flow — ingredients → preference → result.** Step 1 collects selected ingredient IDs (drives `DishScorer.score(dishes, selectedIngredientIds, allDishes)`); step 2 is a single preference step; then result. No portions, fridge filter, or time/effort steps — those are deferred (WIZ2-01/02, out-of-scope). Rationale: smallest path that satisfies WIZ-02 (multi-step, progress, back) and still produces a meaningful ranked result for a first-timer.
- **D-04: Every step skippable with a "Tùy bạn" default (WIZ-03).** Skipping a step commits a sensible default (e.g. no ingredient filter → full catalog; no preference → neutral profile) so the result step always has usable inputs. The exact default per step is planner discretion, but skipping must never dead-end the flow.
- **D-05: Step keys, not indices (carry-forward).** Use the Phase 3 string-step-key model; the concrete known step set here is the ingredient/preference/result keys. Reordering later must not break persisted mid-flow state.

### Result step & add-to-meal
- **D-06: Present the top few ranked suggestions.** Not a single forced pick and not the whole list — the top few scored dishes (planner picks the exact count, small and mobile-sensible). Ordering comes from the existing scorer (sort by score then missing-count); do not re-sort or alter scoring.
- **D-07: Add to today or a specific other day (defaults to today).** From a chosen suggestion the user adds to today's meals via the existing `scheduledMeal` add path, with the option to pick a different day. Today is the default to keep the first-timer path single-tap. Reuse the existing add flow (`ScheduledMealAdd.widget` / `addScheduledMeal`) rather than a new scheduling mechanism.
- **D-08: WIZ-04 fallback ladder.** Result step guarantees an actionable outcome: (a) matches exist → show top few; (b) no match but catalog non-empty → fall back to the full catalog; (c) empty catalog → route to "add your first dish." The empty-catalog branch is a route to the existing dish-add entry, not an inline composer.

### Home hero & dashboard reframe
- **D-09: Replace the Home hero with the "Hôm nay ăn gì?" top CTA (WIZ-01, NAV-01).** The journey entry becomes the dominant hero element on the Dashboard (`Dashboard.screen.tsx` → `DashboardHero`), not an added card lower down. Other dashboard sections remain; only the hero is reframed to lead with the guided journey.
- **D-10: Reframe entry points only (NAV-01 scope this phase).** Phase 4 reframes the primary entry points (Home hero + bottom-nav center) toward the guided journey. It does not restructure the sidebar IA or rename/move routes wholesale — that risk is bounded against `ROUTE-INVENTORY.md`. Deeper nav/IA reframing, if wanted, is a separate effort.

### Claude's Discretion
- Exact wizard route path and module location (likely a new `src/Modules/<MealPlanning|Wizard>/` slice with `Screens/` + `Routing/*RouteConfig.ts` + `*Router.tsx`, registered in `RootRoutes.ts` / `RootRouter.tsx`).
- The concrete final step-key set and the typed answer fields the preference step collects (compose a `HouseholdPreferenceProfile` subset per Phase 3 D-01; do not duplicate the type).
- Per-step skip defaults (D-04), the exact "top few" count (D-06), and progress-indicator presentation.
- Whether the center-nav suggester is demoted, kept dual, or linked from the wizard — any arrangement that keeps both reachable (D-02, NAV-02).
- How the empty-catalog "add first dish" route is surfaced (button copy, which existing dish-add entry it targets).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` — Phase 4 owns **WIZ-01, WIZ-02, WIZ-03, WIZ-04, WIZ-05, WIZ-07** (guided wizard) and **NAV-01, NAV-02, NAV-03, NAV-04** (reframe + reachability). WIZ-06/FND-03 are already done (Phase 3). MOB-*/COPY-* are Phase 5; WIZ2-* are Phase 6 — do not build them here.
- `.planning/ROADMAP.md` §"Phase 4: Wizard UI & Hero Entry" — goal + 5 success criteria (hero entry + reframed entry points; one-question-per-screen with progress/back/skip; result always actionable + add to today; cold-start first-timer E2E; all routes reachable within ~3 taps / search, center-nav opens wizard with suggester still reachable).

### Reachability gate (NAV-02 / NAV-03 — MUST honor)
- `.planning/phases/02-shell-safety-extraction/ROUTE-INVENTORY.md` — every pre-refactor route + its entry path. Any route that loses its only entry path in Phase 4 is a regression. Note the programmatic-only routes (`/smart-meal-planner`, detail routes, `/scheduledMeal/dish-count-templates`) and that `/__crash-test` (test-only) and dead `DataBackup` export are excluded from user-nav requirements.

### Prior phase context (carry-forward)
- `.planning/phases/03-wizard-state-slice/03-CONTEXT.md` — wizard answer model (D-01 hybrid typed+extensible composing `HouseholdPreferenceProfile`), string-step-key + status model (D-03/D-04), selector-only reads (FND-03), DishScorer characterization tests pinning current output (D-07/D-08).

### Codebase maps (this milestone)
- `.planning/codebase/STRUCTURE.md` §"Where to Add New Code" — new module (`Screens/`, `Routing/<Domain>RouteConfig.ts`, `<Domain>Router.tsx`), route registration in `RootRoutes.ts` + `RootRouter.tsx`, nav entries in shell.
- `.planning/codebase/CONVENTIONS.md` — `.screen.tsx` / `.widget.tsx` / `.modal.tsx` suffixes, selector-only reads, Vietnamese user-facing copy, match-surrounding-style, `strict: false` (guard manually).
- `.planning/codebase/ARCHITECTURE.md` — state layer + selector read path; reload-as-recovery idiom that the persisted wizard survives.
- `.planning/codebase/TESTING.md` — Jest/CRA unit tests + Playwright E2E (basis for the WIZ-07 cold-start E2E).

### Key source files (integration points / patterns to mirror)
- `src/Store/Selectors.ts` — `selectWizard*` family (sole wizard read path) + `selectDishes` / `selectIngredients` / `selectInventory` the result step consumes.
- `src/Store/Reducers/WizardReducer.ts` — commit/advance/back/resume/restart/complete action creators the step screens dispatch.
- `src/Modules/DishSuggester/Helpers/DishScorer.ts` — `score()` (ingredient step) and `scoreCookNow()` (profile-aware) entry points; pinned — read-only.
- `src/Modules/DishSuggester/Screens/DishSuggester.screen.tsx` — existing suggester surface (modal/inline modes, `IngredientPickerWidget`, `DishSuggestionList`) — patterns to reuse for the wizard result + ingredient picker; the screen that must stay reachable (NAV-02).
- `src/Routing/Shell/BottomTabNavigator.tsx` — center "Nấu gì?" button (`toggleSuggester`, `DishSuggesterScreen`) to repoint at the wizard route (NAV-04).
- `src/Modules/Home/Screens/Dashboard.screen.tsx` (`DashboardScreen` → `DashboardHero`) — Home hero to reframe as the journey CTA (WIZ-01, NAV-01).
- `src/Modules/ScheduledMeal/Screens/ScheduledMealAdd.widget.tsx` + `addScheduledMeal` — the existing add-to-meal path the result step reuses (WIZ-05).
- `src/Routing/RootRouter.tsx` / `src/Routing/RootRoutes.ts` — route tree + route-config registration for the new wizard route.
- `@components/Sheet` (`src/Routing/Shell/` / Phase 2 D-09) — bottom-sheet wrapper for step-internal pickers/confirmations.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DishSuggester.screen.tsx`: existing `IngredientPickerWidget`, `DishSuggestionList`/`DishSuggestionItem` widgets, and modal/inline/page render modes — strong basis for the wizard's ingredient step and result presentation without rebuilding pickers.
- `selectWizard*` selectors + `WizardReducer` action creators (Phase 3): wizard step/answers/status reads and per-step commits already exist and persist.
- `addScheduledMeal` / `ScheduledMealAdd.widget`: existing add-to-today path for WIZ-05; no new scheduling mechanism needed.
- `@components/Sheet`: bottom-sheet wrapper for in-step pickers (Phase 2).
- `DashboardHero` within `Dashboard.screen.tsx`: existing hero slot to reframe.

### Established Patterns
- New domain = `src/Modules/<Domain>/` with `Screens/` + `Routing/<Domain>RouteConfig.ts` + `<Domain>Router.tsx`, registered in `RootRoutes.ts` and `RootRouter.tsx`.
- Reads go through `src/Store/Selectors.ts` only (FND-03 enforcement) — wizard reads via `selectWizard*`, dish/ingredient/inventory via existing selectors.
- Bottom-nav center is currently a `useToggle` modal, not a route navigation — repointing it is a known, localized change in `BottomTabNavigator.tsx`.
- User-facing strings are Vietnamese; write new wizard copy in Vietnamese inline (systematic `AppCopy` migration is Phase 5).

### Integration Points
- New wizard route registered in `RootRoutes.ts` + `RootRouter.tsx`; center-tab repointed in `BottomTabNavigator.tsx`; Home hero reframed in `Dashboard.screen.tsx`.
- Result step calls `DishScorer` (read-only) and dispatches the existing `addScheduledMeal` path.
- Cold-start E2E lives under `tests/e2e/` (Playwright) — empty IndexedDB → wizard → scheduled meal (WIZ-07).

</code_context>

<specifics>
## Specific Ideas

- The first-timer "single-tap to a meal" path is the success bar: Home hero → wizard (skippable all the way with "Tùy bạn") → top-few result → add to today. Defaults must make every skip land on a usable result (D-04, D-08).
- Keep the existing center-tab suggester behavior intact as the reachable secondary surface; the wizard is the new guided primary, not a replacement that removes the suggester (NAV-02/NAV-04).
- Reframe the Home hero in place (replace, not append) so the journey is unmistakably the top CTA (D-09).

</specifics>

<deferred>
## Deferred Ideas

- Phone-first layout, 44px touch targets, bottom-sheet adoption across pickers, desktop-regression guard → Phase 5 (MOB-01..04).
- App-wide Vietnamese copy migration to `AppCopy` + friendly empty-state copy pass → Phase 5 (COPY-03..05).
- Portions/"who's eating?" step, fridge "can cook now" filter, inline "add missing ingredient to Đi chợ", remembered-defaults, "why this dish" reason → Phase 6 (WIZ2-01..05).
- "Time/effort" (nấu nhanh/nấu kỹ) wizard step → out of scope (blocked on dish time/effort attribute).
- Deeper navigation/IA reframe beyond entry points → separate future effort if validated.

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 4-Wizard UI & Hero Entry*
*Context gathered: 2026-06-16*
