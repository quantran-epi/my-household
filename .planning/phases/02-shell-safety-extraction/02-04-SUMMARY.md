---
phase: 02-shell-safety-extraction
plan: 04
subsystem: ui
tags: [react, refactor, shell, extraction, playwright, antd]

# Dependency graph
requires:
  - phase: 02-shell-safety-extraction (plan 02-01)
    provides: green shell e2e baseline (app-shell-navigation.spec.ts, cooking-pill.spec.ts) used as the identity proof
provides:
  - src/Routing/Shell/shellStyles.ts (shared headerActionButtonStyle constant)
  - src/Routing/Shell/PageActionsMenu.tsx (extracted header overflow menu)
  - src/Routing/Shell/CookingPill.tsx (extracted floating cooking pill + cooking modals)
  - src/Routing/Shell/BottomTabNavigator.tsx (extracted bottom-tab navigator chrome)
  - a slimmer MasterPage that imports the extracted Shell pieces and renders identically
affects: [02-05 (SidebarDrawer + DataBackup extraction + MasterPage collapse + route inventory)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure mechanical move into src/Routing/Shell/ with verbatim data-testid preservation (D-08)"
    - "Relative-import re-path for one-level-deeper location (assets ../../ -> ../../../, sibling Routing modules ./ -> ../)"
    - "Single named export per file (const -> export const) for extracted shell units"

key-files:
  created:
    - src/Routing/Shell/shellStyles.ts
    - src/Routing/Shell/PageActionsMenu.tsx
    - src/Routing/Shell/CookingPill.tsx
    - src/Routing/Shell/BottomTabNavigator.tsx
  modified:
    - src/Routing/MasterPage.tsx

key-decisions:
  - "headerActionButtonStyle lives in shellStyles.ts as a shared constant (used by MasterPage, PageActionsMenu, and later SidebarDrawer)"
  - "Moves were byte-for-byte; only export keyword and relative import paths changed"
  - "Identity proven by re-running the unchanged 02-01 baseline specs (D-07), not by new assertions"

patterns-established:
  - "Verbatim data-testid preservation across extraction (the e2e identity contract)"
  - "Re-path relative imports one level deeper; alias imports (@components/@store/@hooks/@modules) untouched"

requirements-completed: [FND-02]

# Metrics
duration: 18min
completed: 2026-06-15
---

# Phase 2 Plan 04: Shell Extraction (PageActionsMenu, CookingPill, BottomTabNavigator) Summary

**Moved three top-level shell pieces and a shared style constant out of the 1366-line MasterPage.tsx into src/Routing/Shell/ as a behavior-identical extraction, proven by the unchanged 02-01 e2e baseline staying green.**

## Performance

- **Duration:** ~18 min
- **Tasks:** 2
- **Files modified:** 5 (4 created, 1 modified)

## Accomplishments
- Created `src/Routing/Shell/shellStyles.ts` exporting the shared `headerActionButtonStyle` constant
- Extracted `PageActionsMenu`, `CookingPill`, and `BottomTabNavigator` into their own files under `src/Routing/Shell/`, each as a single named export
- Re-pathed all relative imports for the one-level-deeper location (5 asset PNGs `../../` -> `../../../`; `./AppShellNavigationContext`, `./RootRoutes`, `./PageActionsContext` -> `../...`)
- Preserved every `data-testid` byte-for-byte (page-actions-button, active-cooking-floating-button, bottom-tab-navigator + the five bottom-tab-* hooks)
- MasterPage now imports the extracted pieces and renders an unchanged JSX tree; removed imports that only the moved units referenced
- Re-ran the unchanged 02-01 baseline (`app-shell-navigation.spec.ts`, `cooking-pill.spec.ts`) — all 3 tests pass, confirming the move is behavior-identical (D-07)

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract shellStyles.ts + PageActionsMenu** - `742c9af` (feat)
2. **Task 2: Extract BottomTabNavigator and CookingPill, re-run baseline** - `6b53fa1` (feat)

## Files Created/Modified
- `src/Routing/Shell/shellStyles.ts` - Shared `headerActionButtonStyle` constant
- `src/Routing/Shell/PageActionsMenu.tsx` - Header overflow menu reading `usePageActionsState`
- `src/Routing/Shell/CookingPill.tsx` - Floating cooking pill + session-switcher and cooking-session modals (DeferredModalContent gates preserved)
- `src/Routing/Shell/BottomTabNavigator.tsx` - Bottom-tab navigator chrome with all six tab hooks and `_*Styles` closures
- `src/Routing/MasterPage.tsx` - Removed the four moved definitions + `headerActionButtonStyle`; added `./Shell/*` imports; pruned now-unused imports (Dropdown, MoreOutlined, FireOutlined, usePageActionsState, selectCookingSessions, selectDishesById, CookingSessionWidget, DishSuggesterScreen)

## Decisions Made
- None beyond the plan: executed as a pure move with the documented re-path and export changes.

## Deviations from Plan
None - plan executed exactly as written.

The only non-task edits were pruning imports in MasterPage that became unused once the units moved out (Dropdown, MoreOutlined, FireOutlined, usePageActionsState, selectCookingSessions, selectDishesById, CookingSessionWidget, DishSuggesterScreen). This is part of the planned move ("Remove imports now unused only by these moved units"), not a deviation.

## Issues Encountered
- An early Edit accidentally duplicated the `PageActionsMenu` definition in MasterPage instead of deleting it; caught immediately by reading the region back and removed both copies before building. No impact on the committed result.

## Known Stubs
None.

## Threat Flags
None - no new network endpoints, auth paths, or trust-boundary surface introduced. Extraction is a pure move; mitigations T-02-MV and T-02-RG satisfied (verbatim test ids + re-pathed imports + green baseline re-run).

## Next Phase Readiness
- `src/Routing/Shell/` now exists with three extracted units + shared styles; 02-05 can extract SidebarDrawer (~500 lines) and DataBackup, collapse MasterPage to a thin composition root, and build the route inventory.
- `headerActionButtonStyle` is already shared from `shellStyles.ts`, ready for SidebarDrawer to import in 02-05.
- Pre-existing unrelated warning noted but NOT fixed (out of scope): `MedicalRecordIcon` unused in MasterPage.tsx.

## Self-Check: PASSED

- Files verified present: shellStyles.ts, PageActionsMenu.tsx, CookingPill.tsx, BottomTabNavigator.tsx, 02-04-SUMMARY.md
- Commits verified present: 742c9af, 6b53fa1, 92d8d4d

---
*Phase: 02-shell-safety-extraction*
*Completed: 2026-06-15*
