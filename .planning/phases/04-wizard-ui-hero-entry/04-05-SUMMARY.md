---
phase: 04-wizard-ui-hero-entry
plan: 05
subsystem: testing
tags: [playwright, e2e, wizard, navigation, cold-start]

# Dependency graph
requires:
  - phase: 04-wizard-ui-hero-entry (plan 04-04)
    provides: bottom-tab-suggester repointed to /meal-planning/wizard; /dish-suggester sidebar entry preserved
provides:
  - emptyCatalog seed option for cold-start E2E
  - WIZ-07 cold-start E2E (populated + empty catalog)
  - migrated dish-suggester spec proving NAV-02 reachability
affects: [milestone-acceptance]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Seed-variant cold-start (planner decision 6): emptyCatalog flag writes empty synced catalog while preserving the welcome-complete flag, avoiding an onboarding redirect"
    - "Suggester reachability proved via its /dish-suggester sidebar route after the center button repoints to the wizard"

key-files:
  created:
    - tests/e2e/wizard-cold-start.spec.ts
  modified:
    - tests/e2e/fixtures/seedApp.ts
    - tests/e2e/dish-suggester.spec.ts

key-decisions:
  - "Populated cold-start adds Canh nuoc regression (waterSoup), NOT the already-seeded Com ga, so its appearance on the meal list proves the wizard created the scheduled meal"
  - "dish-suggester spec asserts the in-place expense modal (actionMode=modal) via the role=dialog scoped to Món cần tính, not a /expense-planner navigation"
  - "Reached the result step via the skip path (full-catalog fallback) to avoid coupling the test to DishScorer ranking (pinned)"

# Metrics
duration: 12min
completed: 2026-06-16
---

# Phase 4 Plan 05: WIZ-07 Cold-Start + Reachability Gate Summary

**Proves the milestone metric end-to-end — a first-timer reaches a scheduled meal through the wizard — and locks the nav reachability gate (suggester via /dish-suggester, global search unaffected) with passing Playwright E2E.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-06-16
- **Completed:** 2026-06-16
- **Tasks:** 3
- **Files created/modified:** 3 (1 created, 2 modified)

## Accomplishments
- Added an `emptyCatalog?: boolean` option to `SeedAppOptions` that seeds an empty-but-synced catalog (`dishes: []`, `ingredient: []`, empty personal collections) while preserving `localStorage['my-recipes-welcome-complete-v1'] = '1'`, so a cold-start lands on the app instead of `/guide/welcome`.
- Migrated `dish-suggester.spec.ts` to reach the in-place suggester via its surviving `/dish-suggester` sidebar route instead of the repointed `bottom-tab-suggester` center button (NAV-02). The expense flow now asserts the in-place modal opened from the `dish-suggester-more-actions-button` dropdown (the page runs with `actionMode='modal'`), not a `/expense-planner` navigation.
- Added `wizard-cold-start.spec.ts` proving WIZ-07 with two scenarios: a populated cold-start (center button → wizard → result → add → the dish appears on `/scheduledMeal/list`) and an empty catalog (wizard routes the first-timer to `/dishes/list` via the `wizard-empty-catalog` "Thêm món đầu tiên" button rather than dead-ending).

## Task Commits

Each task was committed atomically:

1. **Task 1: Add emptyCatalog seed option** - `0648bbd` (feat)
2. **Task 2: Migrate dish-suggester spec to /dish-suggester route (NAV-02)** - `c236d85` (test)
3. **Task 3: Add WIZ-07 cold-start E2E (populated + empty)** - `1bf6004` (test)

## Files Created/Modified
- `tests/e2e/fixtures/seedApp.ts` - Added `emptyCatalog?: boolean` to `SeedAppOptions` and a `createEmptyCatalogSeed()` helper; `seedApp` selects the empty seed when the flag is set. Default (regression) behavior unchanged.
- `tests/e2e/dish-suggester.spec.ts` - Reaches the suggester via `page.goto('dish-suggester')`; asserts the in-place expense modal from the more-actions dropdown.
- `tests/e2e/wizard-cold-start.spec.ts` - New WIZ-07 cold-start E2E (populated + empty catalog scenarios).

## Test Results (run synchronously, blocking)
- `tests/e2e/dish-suggester.spec.ts` — **1 passed** (13.7s)
- `tests/e2e/wizard-cold-start.spec.ts` — **2 passed** (20.3s)
- `tests/e2e/global-search.spec.ts` — **1 passed** (14.3s) — NAV-03 cross-check, unchanged this phase
- `npx tsc --noEmit -p tsconfig.json` — passes (no new errors)

## Deviations from Plan
None affecting scope. The plan's interface note for the migrated suggester spec was confirmed against current source: `dish-suggester-expense-planner-button` does not exist (it only ever lived in the old spec); the screen exposes a `dish-suggester-more-actions-button` dropdown and `/dish-suggester` runs with `actionMode='modal'`, so the expense action opens an in-place modal. The spec was written to that actual surface.

Minor selector adjustments during Task 2 (not behavior changes): the page renders the "Nấu gì hôm nay?" heading twice (page hero + inner content), so the visibility assertion uses `.first()`; the expense modal renders as a `role="dialog"` (not an `.ant-modal` class node), so it is scoped via the dialog's "Món cần tính" text to avoid colliding with the sidebar's "Tính chi phí" nav label.

## Issues Encountered
None blocking. `node_modules` and the Playwright chromium binary were already present in the main working tree; specs ran in a single foreground invocation each.

## User Setup Required
None.

## Next Phase Readiness
- WIZ-07 is proven end-to-end by a passing cold-start E2E for both populated and empty catalogs.
- NAV-02 (suggester reachable via sidebar), NAV-03 (global search unaffected), and NAV-04 (center → wizard) are all covered by passing specs.
- Human verification of the live navigation is deferred to the end-of-phase verify gate (`human_verify_mode: end-of-phase`).

## Self-Check: PASSED

- FOUND: tests/e2e/fixtures/seedApp.ts
- FOUND: tests/e2e/dish-suggester.spec.ts
- FOUND: tests/e2e/wizard-cold-start.spec.ts
- FOUND commit: 0648bbd (Task 1)
- FOUND commit: c236d85 (Task 2)
- FOUND commit: 1bf6004 (Task 3)

---
*Phase: 04-wizard-ui-hero-entry*
*Completed: 2026-06-16*
