---
phase: 02-shell-safety-extraction
plan: 05
subsystem: ui
tags: [react, react-router, shell-extraction, refactor, route-inventory]

# Dependency graph
requires:
  - phase: 02-shell-safety-extraction (plan 02-04)
    provides: extracted PageActionsMenu, BottomTabNavigator, CookingPill, shellStyles in src/Routing/Shell/
  - phase: 02-shell-safety-extraction (plan 02-01)
    provides: the green shell e2e baseline used as the identity proof
provides:
  - SidebarDrawer moved intact into src/Routing/Shell/SidebarDrawer.tsx (nav + backup center + admin publish + inventory config + PIN modal)
  - dead DataBackup export moved + flagged (not deleted) into src/Routing/Shell/DataBackup.tsx
  - MasterPage.tsx collapsed to a thin composition root importing all five Shell/* pieces
  - ROUTE-INVENTORY.md enumerating every route + its entry path, gating Phase 4 nav changes
affects: [04-navigation, phase-4-nav, journey-wizard, mobile-nav]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure move, verified identical (FND-02 / D-04): components relocate with no behavior change, proven by the unchanged e2e baseline"
    - "Relative-import re-path for one-level-deeper Shell/ location (../../ -> ../../../ for assets, ./ -> ../ for sibling Routing modules)"
    - "Verbatim data-testid preservation as the before/after identity contract (D-08)"
    - "Dead-export preservation + code-comment flagging instead of deletion (D-06)"

key-files:
  created:
    - src/Routing/Shell/SidebarDrawer.tsx
    - src/Routing/Shell/DataBackup.tsx
    - .planning/phases/02-shell-safety-extraction/ROUTE-INVENTORY.md
  modified:
    - src/Routing/MasterPage.tsx

key-decisions:
  - "Moved SidebarDrawer as one intact ~500-line block with no internal refactor (D-05)"
  - "Preserved the dead DataBackup export with a flagging comment rather than deleting it (D-06)"
  - "Left the hardcoded GitHub raw URL and reload-as-recovery idioms unchanged (Deferred Ideas / T-02-DB)"

patterns-established:
  - "Shell decomposition complete: MasterPage is now a thin composition root (171 lines) over five Shell/* units"
  - "ROUTE-INVENTORY.md is the reachability gate for Phase 4 nav rework (NAV-02 / NAV-03)"

requirements-completed: [FND-02]

# Metrics
duration: 14min
completed: 2026-06-15
---

# Phase 2 Plan 05: Shell Safety & Extraction (SidebarDrawer + DataBackup + thin MasterPage) Summary

**SidebarDrawer moved intact and the dead DataBackup preserved + flagged into src/Routing/Shell/, collapsing MasterPage to a thin composition root over five Shell pieces, with the full e2e baseline passing unchanged as the FND-02 identity proof.**

## Performance

- **Duration:** ~14 min
- **Started:** 2026-06-15T20:14:00Z
- **Completed:** 2026-06-15T20:28:00Z
- **Tasks:** 3
- **Files modified:** 4 (3 created, 1 modified)

## Accomplishments
- Moved the entire `SidebarDrawer` (~500 lines: primary nav, backup-center modal, admin publish, inventory config, PIN modal, ScheduledMealToolkitWidget + SharedSyncModal tail) into `src/Routing/Shell/SidebarDrawer.tsx` as one intact unit with all 16 PNG asset imports and both sibling imports re-pathed and every `data-testid` preserved verbatim.
- Moved the dead `DataBackup` export into `src/Routing/Shell/DataBackup.tsx`, preserving its signature and adding a flagging comment (currently-unused, hardcoded GitHub raw URL, reload-as-recovery) — not deleted (D-06).
- Collapsed `MasterPage.tsx` to a 171-line thin composition root: the `MasterPage` function + its header-visual helpers only, importing all five Shell/* pieces, rendering an identical JSX tree.
- Authored `ROUTE-INVENTORY.md` enumerating every route (2 lazy top-level + all routes under the `Root()` layout including the four sub-routers), each with its entry path, the programmatic-only routes flagged, the dead DataBackup noted, and the test-only `/__crash-test` route labeled (T-02-CT).
- Re-ran the full shell e2e baseline (app-shell-navigation, cooking-pill, global-search) unchanged: 4 passed — the D-07 identity proof for the whole extraction.

## Task Commits

Each task was committed atomically:

1. **Task 1: Move SidebarDrawer INTACT into src/Routing/Shell/SidebarDrawer.tsx** - `a7e3347` (feat)
2. **Task 2: Move dead DataBackup (flag, don't delete) + collapse MasterPage to thin root + re-run baseline** - `7dd31f2` (feat)
3. **Task 3: Write the route reachability inventory (ROUTE-INVENTORY.md)** - `76e43cd` (docs)

## Files Created/Modified
- `src/Routing/Shell/SidebarDrawer.tsx` - Intact sidebar drawer (nav + backup center + admin + inventory config + PIN), moved as one unit with re-pathed imports
- `src/Routing/Shell/DataBackup.tsx` - Moved dead DataBackup export, preserved + flagged per D-06
- `src/Routing/MasterPage.tsx` - Collapsed to a thin composition root importing all five Shell/* pieces
- `.planning/phases/02-shell-safety-extraction/ROUTE-INVENTORY.md` - Route reachability inventory gating Phase 4 nav changes

## Decisions Made
None beyond the plan's own decisions (D-05 intact move, D-06 preserve+flag, deferred URL/reload fixes). Plan executed as specified.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- During Task 1, an in-place sequence of Edit operations on MasterPage.tsx left the SidebarDrawer block partially mangled (a removed `const [open, setOpen]` line). Resolved by rewriting MasterPage.tsx cleanly to its correct Task 1 end-state (SidebarDrawer removed + imported, DataBackup retained) via the Write tool. The committed result is correct: `yarn build` clean and the e2e baseline green. No mangled intermediate state was committed.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The shell is fully decomposed into reviewable per-component files under `src/Routing/Shell/`; MasterPage is a stable thin root. Phase 4 nav/journey work can proceed on this base.
- `ROUTE-INVENTORY.md` is ready as the Phase 4 reachability gate (NAV-02 / NAV-03). Programmatic-only routes (`/smart-meal-planner`, `/scheduledMeal/dish-count-templates`, the three detail routes, the guide redirects) are flagged as depending on ~3-tap / search reachability.
- Carried-forward (out of scope this phase): the dead `DataBackup` hardcoded GitHub raw URL (T-02-DB) and reload-as-recovery idiom remain flagged for a separate follow-up.

---
*Phase: 02-shell-safety-extraction*
*Completed: 2026-06-15*
