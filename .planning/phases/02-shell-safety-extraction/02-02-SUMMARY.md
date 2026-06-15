---
phase: 02-shell-safety-extraction
plan: 02
subsystem: ui
tags: [react, error-boundary, antd, playwright, crash-containment]

# Dependency graph
requires:
  - phase: 01-copy-infrastructure
    provides: "Vietnamese copy register conventions (warm 'nhà mình'/'nhé' tone) reused for the fallback copy"
provides:
  - "@components/ErrorBoundary — top-level React class error boundary with a themed Vietnamese reload fallback"
  - "ErrorBoundary mounted around RootRouter inside ConfigProvider in App.tsx (crash containment for shell chrome)"
  - "Test-only /__crash-test render-throw route for proving error-boundary behavior in e2e"
  - "tests/e2e/error-boundary.spec.ts — e2e proof that a render-phase throw shows recovery UI, not a white screen"
affects: [03-extraction, 04-routing, 05-copy-migration, shell-safety]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single top-level class error boundary (getDerivedStateFromError + componentDidCatch) inside ConfigProvider"
    - "Test-only render-throw route registered in the layout tree, unlinked from user nav, to e2e-prove crash containment"
    - "Hermetic e2e for render-phase crashes: skip the seedApp fixture since the throw is store-independent"

key-files:
  created:
    - src/Components/ErrorBoundary/ErrorBoundary.tsx
    - src/Components/ErrorBoundary/index.ts
    - tests/e2e/error-boundary.spec.ts
  modified:
    - src/App.tsx
    - src/Routing/RootRouter.tsx
    - src/Routing/RootRoutes.ts

key-decisions:
  - "Used the in-repo Result + Button wrappers for the fallback so it inherits antd theme (#7436dc) and viVN locale"
  - "componentDidCatch logs via guarded console.error in non-production only; never surfaces error.message/stack to the UI (V7 / T-02-IF)"
  - "error-boundary.spec.ts skips the shared seedApp fixture because the crash route throws independent of store state, and seedApp has a pre-existing IndexedDB version race"

patterns-established:
  - "Top-level ErrorBoundary as the one documented class-component exception per CONVENTIONS.md (D-03)"
  - "Test-only routes live inside the MasterPage layout tree to prove shell containment but are never linked from nav (threat T-02-CT)"

requirements-completed: [FND-01]

# Metrics
duration: 18min
completed: 2026-06-15
---

# Phase 2 Plan 02: Error Boundary Summary

**Top-level React class error boundary that swaps a render crash for a themed Vietnamese reload fallback instead of white-screening the app, mounted around RootRouter inside ConfigProvider and proven by an e2e render-throw spec.**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-06-15T12:15:32Z
- **Completed:** 2026-06-15
- **Tasks:** 2
- **Files modified:** 6 (3 created, 3 modified)

## Accomplishments
- `@components/ErrorBoundary` class component with `getDerivedStateFromError` (drives fallback render) and `componentDidCatch` (side-effect-only, guarded dev logging, no error detail leaked)
- Themed Vietnamese recovery UI: heading "Ứng dụng gặp chút trục trặc rồi", body "Nhà mình thử tải lại trang nhé, dữ liệu vẫn được giữ an toàn.", primary "Tải lại trang" button calling `window.location.reload()`
- Boundary mounted around `<RootRouter />` inside `ConfigProvider` (D-01) so the fallback keeps the antd theme and `viVN` locale; existing provider nesting unchanged
- Test-only `/__crash-test` render-throw route + `tests/e2e/error-boundary.spec.ts` proving the recovery UI shows instead of a blank page

## Task Commits

Each task was committed atomically:

1. **Task 1: Create the ErrorBoundary class component + barrel** - `3f3f367` (feat)
2. **Task 2: Mount the boundary in App.tsx and prove it with an e2e render-throw spec** - `40873f1` (feat)

## Files Created/Modified
- `src/Components/ErrorBoundary/ErrorBoundary.tsx` - Class error boundary + themed default fallback (Result + Button, Vietnamese copy, Reload CTA)
- `src/Components/ErrorBoundary/index.ts` - Barrel re-export for `@components/ErrorBoundary`
- `tests/e2e/error-boundary.spec.ts` - e2e proof: navigating to `/__crash-test` shows the Reload button + heading, not a white screen
- `src/App.tsx` - Imports and wraps `<RootRouter />` with `<ErrorBoundary>` inside `ConfigProvider`; provider order untouched
- `src/Routing/RootRouter.tsx` - Adds the test-only `CrashTestScreen` (throws during render) registered inside the MasterPage layout route
- `src/Routing/RootRoutes.ts` - Adds the `CrashTest: '/__crash-test'` static route, commented as test-only and unlinked from nav

## Decisions Made
- Reused `@components/Result` (status="warning") + `@components/Button` for the fallback so it inherits the antd theme/locale rather than hand-styling.
- Centered card layout with `lg` (24px) padding, `maxWidth: 480`, and the `#f5f0ff → #ffffff` gradient surface per the UI-SPEC net-new surface spec.
- `componentDidCatch` only logs in non-production via a guarded `console.error`; it never renders `error.message`/stack (V7 / threat T-02-IF).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] e2e spec made hermetic to bypass a pre-existing seedApp IndexedDB version race**
- **Found during:** Task 2 (e2e verification)
- **Issue:** `yarn test:e2e tests/e2e/error-boundary.spec.ts` failed in the shared `seedApp` fixture with `VersionError: The requested version (1) is less than the existing version (2)`. The same failure reproduces on the untouched `tests/e2e/global-search.spec.ts`, confirming it is a pre-existing environmental issue in `seedApp` (it opens the `my-recipes` IndexedDB at version 1 after the app has already opened it at version 2), not caused by this plan's changes.
- **Fix:** The crash-test route throws during render regardless of store state, so the spec does not need seeded data. Switched the spec from the `./fixtures/appTest` seeded fixture to the base `@playwright/test` fixture and navigate directly to `/__crash-test`. This keeps the FND-01 proof focused and avoids the unrelated fixture race.
- **Files modified:** tests/e2e/error-boundary.spec.ts
- **Verification:** `yarn test:e2e tests/e2e/error-boundary.spec.ts` → 1 passed; `yarn build` clean.
- **Committed in:** `40873f1` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The deviation only changes the test fixture used; the FND-01 behavior, mount point, and copy all match the plan exactly. The underlying `seedApp` version race is a pre-existing, out-of-scope issue affecting the broader e2e suite (logged below). No scope creep.

## Issues Encountered
- **No node_modules in the worktree:** the build/e2e commands failed initially because the worktree has no `node_modules`. Resolved by symlinking the main checkout's `node_modules` into the worktree (build artifacts and `node_modules` are gitignored, so nothing was committed). Both `yarn build` and `yarn test:e2e` then ran clean.
- **Pre-existing seedApp IndexedDB version conflict** (see Deviation 1) — affects the shared e2e fixture across specs; logged here for the broader extraction work that relies on the seeded shell specs (D-07 baseline). Not fixed in this plan (out of scope: not caused by these changes).

## Deferred Issues
- `tests/e2e/fixtures/seedApp.ts` opens IndexedDB `my-recipes` at version 1 while the running app uses version 2, throwing `VersionError` on a non-fresh browser profile. This blocks the seeded shell e2e specs (global-search, etc.) in this environment and should be reconciled before the D-07 before/after identity proof in later extraction plans. Out of scope for FND-01.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Crash containment (FND-01) is in place: shell chrome render errors now show a recovery UI instead of white-screening, so subsequent journey/nav/mobile and extraction work can proceed under a safety net.
- Heads-up for the extraction plans: resolve the `seedApp` IndexedDB version race before relying on the seeded shell specs as the D-07 green baseline.

---
*Phase: 02-shell-safety-extraction*
*Completed: 2026-06-15*
