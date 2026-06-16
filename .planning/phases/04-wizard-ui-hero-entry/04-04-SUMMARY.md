---
phase: 04-wizard-ui-hero-entry
plan: 04
subsystem: ui
tags: [react, antd, routing, navigation, wizard, dashboard]

# Dependency graph
requires:
  - phase: 04-wizard-ui-hero-entry (plan 04-03)
    provides: live wizard route RootRoutes.AuthorizedRoutes.MealPlanningRoutes.Wizard() -> /meal-planning/wizard
provides:
  - Home hero "Hôm nay ăn gì?" CTA that opens the guided wizard
  - Bottom-nav center button repointed to the wizard route
  - In-place suggester preserved via its /dish-suggester sidebar entry (no orphan)
affects: [04-05, wizard-ui, navigation, copy-migration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Entry-points-only reframe (D-10): repoint navigation destinations without removing existing dashboard sections/metrics"
    - "Optional onStartJourney prop wires DashboardHero CTA to the typed RootRoutes wizard builder via the existing openRoute helper"

key-files:
  created: []
  modified:
    - src/Routing/Shell/BottomTabNavigator.tsx
    - src/Modules/Home/Screens/Dashboard.screen.tsx

key-decisions:
  - "Reused the hero white-pill button style (borderRadius 999, white bg, #5e2bbf text) for the new CTA, applying UI-SPEC Display role 28px/600"
  - "Kept priorityAction + metrics intact below the new CTA (NAV-01 entry-points-only, D-10)"
  - "Preserved data-testid=bottom-tab-suggester on the center button so the 04-05 migration and e2e spec stay green"

patterns-established:
  - "Pattern 1: Navigation reframe routes the center action to the wizard while leaving the /dish-suggester sidebar entry untouched (NAV-02 reachability gate)"

requirements-completed: [WIZ-01, NAV-01, NAV-02, NAV-04]

# Metrics
duration: 9min
completed: 2026-06-16
---

# Phase 4 Plan 04: Wizard Hero + Center-Nav Entry Points Summary

**Home hero gains a dominant "Hôm nay ăn gì?" CTA and the bottom-nav center button routes into /meal-planning/wizard, with the in-place suggester preserved via its sidebar entry.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-06-16
- **Completed:** 2026-06-16
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Repointed the bottom-nav center "Nấu gì?" button to the live wizard route via the existing `onNavigate`, removing the `useToggle` + inline `DishSuggesterScreen` render block
- Added an `onStartJourney` prop and a prominent "Hôm nay ăn gì?" CTA (`data-testid="hero-start-journey"`) to `DashboardHero`, wired to the wizard route through `openRoute`
- Preserved `data-testid="bottom-tab-suggester"` and the `/dish-suggester` sidebar reachability so no route is orphaned (NAV-02)
- Kept `priorityAction` and metrics rendering intact (entry-points-only reframe, D-10)

## Task Commits

Each task was committed atomically:

1. **Task 1: Repoint the bottom-nav center button to the wizard route** - `5afc75b` (feat)
2. **Task 2: Add the 'Hôm nay ăn gì?' hero CTA to DashboardHero** - `613586b` (feat)

## Files Created/Modified
- `src/Routing/Shell/BottomTabNavigator.tsx` - Center button navigates to `MealPlanningRoutes.Wizard()` via `onNavigate`; `useToggle`/`toggleSuggester` and the inline `<DishSuggesterScreen>` render block + import removed; `data-testid="bottom-tab-suggester"` preserved with `aria-pressed={wizardActive}`
- `src/Modules/Home/Screens/Dashboard.screen.tsx` - `DashboardHero` gains optional `onStartJourney` prop and a top "Hôm nay ăn gì?" CTA button; usage site passes `onStartJourney={() => openRoute(RootRoutes.AuthorizedRoutes.MealPlanningRoutes.Wizard())}`

## Decisions Made
- Applied the UI-SPEC Display typography role (28px/600, line-height 1.2) to the hero CTA while reusing the existing white-pill style, keeping hero internal padding at 14px (D-09 reframe in place).
- Placed the CTA at the top of the hero with `marginBottom: 14` so it leads visually without disturbing the existing layout grid below.

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Both primary entry points (hero + center nav) now lead into the guided wizard; the suggester remains reachable via its sidebar route.
- Ready for 04-05 (which depends on the preserved `bottom-tab-suggester` testid).
- Human verification of the live navigation behavior is deferred to the end-of-phase verify gate (`human_verify_mode: end-of-phase`).

## Self-Check: PASSED

- FOUND: src/Routing/Shell/BottomTabNavigator.tsx
- FOUND: src/Modules/Home/Screens/Dashboard.screen.tsx
- FOUND: .planning/phases/04-wizard-ui-hero-entry/04-04-SUMMARY.md
- FOUND commit: 5afc75b (Task 1)
- FOUND commit: 613586b (Task 2)
- FOUND commit: 4c71812 (plan metadata)

---
*Phase: 04-wizard-ui-hero-entry*
*Completed: 2026-06-16*
