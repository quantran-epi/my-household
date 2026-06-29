---
phase: 08-sheet-picker-component-layer
plan: 06
subsystem: ui
tags: [react, react-router, sheet-picker, antd, playwright, e2e, mobile-safari, barrel]

requires:
  - phase: 08-02
    provides: SheetSelect single-select picker + props/option types
  - phase: 08-03
    provides: SheetMultiSelect draft/commit/revert picker + props/option types
  - phase: 08-04
    provides: SheetDatePicker (date/time + RangePicker static) + props types
  - phase: 08-05
    provides: SheetActionMenu iOS action-sheet + action types
provides:
  - "@components/SheetPicker barrel re-exporting all four pickers + their prop types (D-11)"
  - "Test-only /__sheet-picker-fixture route mounting the four pickers deterministically"
  - "mobile-safari touch e2e proving tap-commit (PICK-01), Xong commit+count (PICK-03), Hủy/drag revert (PICK-04)"
affects: [10-picker-call-site-conversion, 11-picker-call-site-conversion]

tech-stack:
  added: []
  patterns:
    - "Top-level component-layer barrel: explicit named re-exports + export type, mirroring @components/Sheet"
    - "Test-only /__-prefixed lazy fixture route for deterministic gesture e2e (mirrors SheetGestureFixture)"
    - "Post-gesture-only assertions in mobile-safari e2e; selection/draft logic stays in jsdom units"

key-files:
  created:
    - src/Components/SheetPicker/index.ts
    - src/Routing/SheetPickerFixture.screen.tsx
    - tests/e2e/sheet-picker.spec.ts
  modified:
    - src/Routing/RootRoutes.ts
    - src/Routing/RootRouter.tsx

key-decisions:
  - "Barrel exports only the SheetDatePicker base symbol; consumers reach .RangePicker via the Object.assign static (matches the picker's own index.ts)"
  - "Fixture SheetSelect uses a 9-option list so the auto-search field (threshold 8) is exercised; SheetMultiSelect uses a small 3-option set for fast toggle/commit flows"
  - "e2e asserts only post-gesture state (sheet present/absent, trigger summary text), never mid-drag transforms"

patterns-established:
  - "Component-layer barrel at @components/SheetPicker is the single import surface for Phase 10-11 call-site swaps"
  - "Dirty-draft drag-dismiss spring-back verified at the real-gesture level, not just jsdom maskClosable state"

requirements-completed: [PICK-01, PICK-03, PICK-04]

duration: 65min
completed: 2026-06-29
---

# Phase 08 Plan 06: SheetPicker Component Layer Wiring Summary

**@components/SheetPicker barrel + test-only fixture route + mobile-safari touch e2e proving tap-commit, Xong commit-with-count, and Hủy/drag-dismiss revert on real gestures**

## Performance

- **Duration:** ~65 min
- **Started:** 2026-06-29T07:14:00Z
- **Completed:** 2026-06-29T08:19:00Z
- **Tasks:** 2
- **Files modified:** 5 (3 created, 2 modified)

## Accomplishments

- `@components/SheetPicker` barrel re-exports all four pickers (`SheetSelect`, `SheetMultiSelect`, `SheetDatePicker`, `SheetActionMenu`) plus their prop/option types — the single import surface Phases 10-11 swap call sites onto (D-11).
- `SheetPickerFixtureScreen` mounts all four pickers deterministically at the test-only lazy route `/__sheet-picker-fixture`, registered exactly like the Phase 7 `SheetGestureFixture` and not linked from any user-facing nav (threat T-08-FIX).
- `tests/e2e/sheet-picker.spec.ts` runs on the `mobile-safari` (WebKit/iPhone) project and proves PICK-01 tap-to-commit dismiss, PICK-03 "Xong (N)" commit-with-count, and PICK-04 "Hủy" revert + dirty drag-dismiss spring-back — the gesture-level proof jsdom cannot give.

## Task Commits

Each task was committed atomically:

1. **Task 1: SheetPicker barrel + test-only fixture route** - `0e596ba` (feat)
2. **Task 2: mobile-safari touch e2e (tap-commit + Xong/Hủy revert)** - `b375d13` (test)

## Files Created/Modified

- `src/Components/SheetPicker/index.ts` - Top-level barrel re-exporting all four pickers + prop/option types (D-11)
- `src/Routing/SheetPickerFixture.screen.tsx` - Test-only fixture mounting the four pickers with deterministic fixtures (allowClear+search SheetSelect, small-set SheetMultiSelect, min/max SheetDatePicker, normal+danger SheetActionMenu)
- `tests/e2e/sheet-picker.spec.ts` - mobile-safari touch e2e (PICK-01/03/04)
- `src/Routing/RootRoutes.ts` - Added `StaticRoutes.SheetPickerFixture = '/__sheet-picker-fixture'` with the test-only threat comment
- `src/Routing/RootRouter.tsx` - Added `React.lazy` import + `<Route>` registration beside the SheetGestureFixture route

## Decisions Made

- Barrel exports only the `SheetDatePicker` base symbol; the `.RangePicker` static rides along via the picker's own `Object.assign` (no separate re-export needed, matches `SheetDatePicker/index.ts`).
- Fixture `SheetSelect` uses a 9-option list to push past the search-field threshold (8); `SheetMultiSelect` uses a 3-option set so the toggle/commit/revert flows stay fast and unambiguous.
- e2e assertions check only post-gesture state, never mid-drag transforms (timing-flaky), per 08-RESEARCH and the native-sheet.spec precedent.

## Deviations from Plan

None - plan executed exactly as written. No source-code deviations; the only environment adjustment (a `node_modules` symlink + a verification-time `PUBLIC_URL` override) was confined to running the e2e and changed no tracked files — see Issues Encountered.

## Issues Encountered

**e2e dev-server environment in the worktree (verification-only, no code/tracked-file changes):**

1. **Missing `node_modules` in the worktree.** The worktree had no local `node_modules`; `npx react-scripts test` and `tsc` resolved by walking up to the main repo, but `npm start` (craco) uses an explicit relative path `./node_modules/@craco/craco/...` anchored to cwd and failed with "Cannot find module". Resolved by symlinking the main repo's `node_modules` into the worktree (`node_modules` is gitignored — no tracked-file change, reversible).

2. **Pre-existing basename mismatch.** `.env` sets `PUBLIC_URL=/my-household` (the router basename follows `PUBLIC_URL` per the 05-06 decision), but `playwright.config.ts` navigates to `/my-recipes/`. With `BrowserRouter basename="/my-household"`, every route-navigating e2e fails to mount its fixture. Confirmed environmental (not introduced by this plan) by running the committed `tests/e2e/native-sheet.spec.ts` in the same worktree — it failed 6/6 with the identical "fixture not found" error. Running `sheet-picker.spec.ts` with the basename aligned (`PUBLIC_URL=/my-recipes`) passed 3/3. No tracked file was modified to work around this; flagged below for the orchestrator/operator since it affects the e2e gate for all route-navigating specs in this worktree.

## Verification Results

- `CI=true npx react-scripts test --watchAll=false src/Components/SheetPicker` → 10 suites, 73 tests PASS.
- `npx tsc --noEmit -p tsconfig.json` → clean (exit 0); barrel + fixture type-check.
- `npm run test:e2e -- --project=mobile-safari sheet-picker.spec.ts` → 3/3 PASS once the dev-server basename matches playwright's baseURL (`PUBLIC_URL=/my-recipes`). With the worktree's default `.env` (`PUBLIC_URL=/my-household`) the spec fails to mount the fixture — as does the pre-existing `native-sheet.spec.ts` — due to the basename mismatch documented above.

## Threat Flags

None - the fixture route matches the existing CrashTest/SheetGestureFixture test-only posture (lazy, `/__`-prefixed, not linked from nav, no real data/PII — threat T-08-FIX accepted in the plan); the barrel only re-exports already-audited components (T-08-11).

## Next Phase Readiness

- `@components/SheetPicker` is ready as the single import surface for the Phase 10-11 call-site conversions.
- Concern for the orchestrator: the e2e gate in this worktree requires the dev-server basename (`PUBLIC_URL`) to match playwright's `/my-recipes/` baseURL. This is a pre-existing mismatch affecting all route-navigating specs (native-sheet.spec.ts fails identically), not something this plan introduced.

## Self-Check: PASSED

- FOUND: src/Components/SheetPicker/index.ts
- FOUND: src/Routing/SheetPickerFixture.screen.tsx
- FOUND: tests/e2e/sheet-picker.spec.ts
- FOUND: .planning/phases/08-sheet-picker-component-layer/08-06-SUMMARY.md
- FOUND commit: 0e596ba (Task 1 — barrel + fixture route)
- FOUND commit: b375d13 (Task 2 — mobile-safari e2e)
- FOUND: RootRouter.tsx registers SheetPickerFixture (lazy import + Route)
- FOUND: RootRoutes.ts route path /__sheet-picker-fixture

---
*Phase: 08-sheet-picker-component-layer*
*Completed: 2026-06-29*
