---
phase: 04-wizard-ui-hero-entry
plan: 01
subsystem: ui
tags: [react, redux, react-router, antd, wizard, routing]

# Dependency graph
requires:
  - phase: 03-wizard-state-slice
    provides: wizard RTK slice, WizardAnswers model, selectWizard* selectors
provides:
  - MealPlanning module route surface (/meal-planning, /meal-planning/wizard)
  - MealPlanningRouter Container+Outlet wrapper
  - WizardIngredientStep widget (controlled, skip-with-default)
  - WizardPreferenceStep widget (single preferred-tags question, advance/skip/back)
affects: [04-02, 04-03, wizard-container, home-hero]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Route config via RouteHelpers.CreateRoutes mirroring sibling modules"
    - "Controlled step widgets with onNext/onBack prop contract, selector-only reads"
    - "In-step pickers hosted in @components/Sheet (zIndexPopupBase respected)"

key-files:
  created:
    - src/Modules/MealPlanning/Routing/MealPlanningRouteConfig.ts
    - src/Modules/MealPlanning/Routing/MealPlanningRouter.tsx
    - src/Modules/MealPlanning/Screens/WizardIngredientStep.widget.tsx
    - src/Modules/MealPlanning/Screens/WizardPreferenceStep.widget.tsx
  modified:
    - src/Routing/RootRoutes.ts

key-decisions:
  - "Reused IngredientPickerWidget as-is inside a Sheet (no re-fetch of ingredients)"
  - "Derived preference tags from selectDishes dish.tags; Sheet-host above 12 tags, inline grid otherwise"
  - "Advance button never disabled on empty selection — skipping with zero input is allowed (WIZ-03)"

patterns-established:
  - "Step widget contract: { onNext: (Partial<WizardAnswers>) => void; onBack?: () => void }, controlled via local useState seeded from selectWizardAnswers"
  - "Skip-with-default ('Tùy bạn') as low-emphasis neutral text button; accent #7436dc reserved for primary advance only"

requirements-completed: [WIZ-02, WIZ-03]

# Metrics
duration: 12min
completed: 2026-06-16
---

# Phase 4 Plan 01: Wizard Routing + Input Step Widgets Summary

**MealPlanning route surface (/meal-planning/wizard) plus two controlled wizard step widgets — ingredient picker (Sheet) and single preferred-tags question — each skippable with a "Tùy bạn" default.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-06-16
- **Completed:** 2026-06-16
- **Tasks:** 3
- **Files modified:** 5 (4 created, 1 modified)

## Accomplishments
- `MealPlanningRoutes` route config resolving `.Root()` → `/meal-planning` and `.Wizard()` → `/meal-planning/wizard`, registered in `RootRoutes.AuthorizedRoutes`
- `MealPlanningRouter` Container+Outlet sub-router wrapper for shell consistency
- `WizardIngredientStep` reusing the existing `IngredientPickerWidget` inside a bottom Sheet, with advance and skip-with-empty-default
- `WizardPreferenceStep` as a single preferred-tags question sourced from dish catalog tags, with advance, skip, and back affordances

## Task Commits

Each task was committed atomically:

1. **Task 1: MealPlanning route config + router wrapper + RootRoutes registration** - `0cb35fe` (feat)
2. **Task 2: WizardIngredientStep widget (picker Sheet, advance, skip)** - `766816b` (feat)
3. **Task 3: WizardPreferenceStep widget (preferred-tags question, advance, skip, back)** - `0c2d7e3` (feat)

## Files Created/Modified
- `src/Modules/MealPlanning/Routing/MealPlanningRouteConfig.ts` - Default-exports `MealPlanningRoutes` built via `RouteHelpers.CreateRoutes('/meal-planning', ...)` with a `Wizard` sub-route
- `src/Modules/MealPlanning/Routing/MealPlanningRouter.tsx` - Named export `MealPlanningRouter` rendering `<Container><Outlet /></Container>`
- `src/Modules/MealPlanning/Screens/WizardIngredientStep.widget.tsx` - Controlled ingredient step; reuses `IngredientPickerWidget` in a Sheet; advance commits selected ids, skip commits `[]`
- `src/Modules/MealPlanning/Screens/WizardPreferenceStep.widget.tsx` - Single preferred-tags step; tags derived from `selectDishes` dish.tags; advance commits `preferredTags`, skip commits `{}`, back calls `onBack`
- `src/Routing/RootRoutes.ts` - Added `MealPlanningRoutes` import and `AuthorizedRoutes` member

## Decisions Made
- Reused `IngredientPickerWidget` from the DishSuggester module as-is — it sources ingredients via its own selectors, so the wizard step does not re-fetch.
- Preference tags are derived from the unique `dish.tags` values across `selectDishes` (the `Dishes` model carries `tags?: string[]`). When the catalog exposes more than 12 tags, the grid is hosted in a Sheet; otherwise it renders inline. When the catalog exposes no tags, a neutral skip-only state is shown.
- The advance button is deliberately never disabled on empty selection — advancing/skipping with zero ingredients is required by WIZ-03 (skip → empty selection → full-catalog fallback downstream).
- RootRouter.tsx was intentionally left untouched per the plan; the `<Route>` element registration is owned by 04-03.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None. `npx tsc --noEmit` passed cleanly after each task.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Both step widgets export the documented `onNext`/`onBack` prop contract, ready for the wizard container in 04-03 to compose without changes.
- `/meal-planning/wizard` path is resolvable app-wide; the `<Route>` element wiring (needs the WizardScreen) remains for 04-03.
- Note for 04-03: the human-check verification items (visual confirmation at `/meal-planning/wizard`) depend on the container/route element built in 04-03 and could not be exercised standalone in this plan.

## Self-Check: PASSED

All created files and task commits verified present:
- 4 source files + SUMMARY.md found on disk
- Commits `0cb35fe`, `766816b`, `0c2d7e3`, `878c375` present in git log

---
*Phase: 04-wizard-ui-hero-entry*
*Completed: 2026-06-16*
