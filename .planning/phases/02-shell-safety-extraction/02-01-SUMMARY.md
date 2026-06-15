---
phase: 02-shell-safety-extraction
plan: 01
subsystem: e2e-baseline
tags: [playwright, e2e, shell, regression-baseline]
requires:
  - "src/Routing/MasterPage.tsx shell (SidebarDrawer, CookingPill, BottomTabNavigator)"
  - "tests/e2e/fixtures seed infrastructure (seedApp, createRegressionSeed)"
provides:
  - "Green Playwright shell baseline (navigation + drawer + backup-center modal + bottom-tab active state)"
  - "Cooking-pill render + modal-open coverage"
  - "A status:'cooking' session in the regression seed"
affects:
  - "All e2e specs (shared seedApp fixture was repaired)"
tech-stack:
  added: []
  patterns:
    - "Scope modal assertions to section[role=dialog] to disambiguate from the always-open drawer aside[role=dialog]"
    - "Seed welcome-complete localStorage flag so MasterPage onboarding redirect does not hijack routes"
key-files:
  created:
    - tests/e2e/cooking-pill.spec.ts
  modified:
    - tests/e2e/app-shell-navigation.spec.ts
    - tests/e2e/fixtures/testData.ts
    - tests/e2e/fixtures/seedApp.ts
decisions:
  - "Source is the source of truth for labels (extraction is verified-identical): repaired spec to current source, did not change src/"
  - "Fixed two pre-existing shared-fixture blockers (IndexedDB VersionError + missing welcome flag) so a real green baseline is reachable"
metrics:
  duration: ~25 min
  completed: 2026-06-15
---

# Phase 02 Plan 01: Shell E2E Baseline Summary

Established a real, green Playwright baseline for the shell interactions before any extraction, by repairing the stale `app-shell-navigation.spec.ts`, adding cooking-pill coverage with a seeded cooking session, and fixing two pre-existing shared-fixture blockers that prevented any spec from running green on a clean checkout.

## What Was Built

- **Repaired `app-shell-navigation.spec.ts`** to match current `MasterPage.tsx` source:
  - Expense-planner label asserted as `Tính chi phí` (not the stale `Kế hoạch chi phí`).
  - `Lịch sử nấu ăn` asserted against `sidebar-drawer-primary-nav` (it is a primary-nav item, not a tools item).
  - `Đồng bộ mới` and `Sao lưu cá nhân` asserted inside the backup-center modal opened by clicking `Dữ liệu & sao lưu`, scoped to `section[role=dialog]` (the always-open drawer is `aside[role=dialog]`).
  - Kept genuinely-present tools assertions (`Hướng dẫn sử dụng`, Admin login/state) and the route-feedback behavior test.
  - Added bottom-tab active-state assertions via `aria-pressed` on `bottom-tab-dishes` / `bottom-tab-scheduled-meals` for the current route.
- **New `cooking-pill.spec.ts`**: after seed, navigates to `./`, asserts `active-cooking-floating-button` is visible, clicks it, and asserts the cooking modal renders the seeded session's step content.
- **Seeded cooking session** in `testData.ts`: a `status:"cooking"` session referencing `dish-com-ga`, wired into `createRegressionSeed().personal.cookingSession.sessions`, plus a `TEST_IDS.cookingSessions.active` id. Matches the `CookingSession` model shape (`id`, `dishId`, `dishName`, `startedAt`, `status`, `steps`, `currentStepIndex`).

## Verification

- `yarn test:e2e tests/e2e/app-shell-navigation.spec.ts` → 2 passed.
- `yarn test:e2e tests/e2e/cooking-pill.spec.ts` → 1 passed.
- Combined run → 3 passed.
- `git diff --name-only <base>..HEAD -- src/` → empty (test/fixtures only, as required).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] IndexedDB VersionError in shared seed fixture**
- **Found during:** Task 1 (initial clean-checkout run to observe RESEARCH Pitfall 1).
- **Issue:** `seedApp.openAppDb` hard-opened `my-recipes` at `indexedDB.open('my-recipes', 1)`. The app boots during the preceding `page.goto('/')` and localforage lazily bumps the DB version to 2 (blob-support store creation). The fixed `version 1` open then threw `VersionError: The requested version (1) is less than the existing version (2)` deterministically, failing every spec (confirmed against the unrelated `dashboard.spec.ts` control). The plan predicted stale-label failures; the actual clean-checkout state was blocked before any assertion ran.
- **Fix:** Open without a fixed version (`indexedDB.open('my-recipes')`) so the seed matches whatever localforage created, while `onupgradeneeded` still creates the stores on a brand-new DB.
- **Files modified:** tests/e2e/fixtures/seedApp.ts
- **Commit:** 6940337

**2. [Rule 3 - Blocking] Onboarding redirect hijacked every seeded route**
- **Found during:** Task 1 (after fix #1, the next failure surfaced).
- **Issue:** `seedApp` calls `localStorage.clear()` and never set `my-recipes-welcome-complete-v1`. `MasterPage` redirects to the UserGuideWelcome screen whenever `isUserGuideWelcomeComplete()` is false, so every seeded navigation landed on the onboarding screen instead of the requested route (`dish-virtual-list` never rendered).
- **Fix:** Set `localStorage['my-recipes-welcome-complete-v1'] = '1'` in the shared seed right after the storage clear, so all specs boot past onboarding.
- **Files modified:** tests/e2e/fixtures/seedApp.ts
- **Commit:** 6940337

Both fixes live in shared fixture code (test-only, never bundled). They unblock the entire e2e suite, not just this plan's specs, and were prerequisites for any trustworthy "before" baseline (the explicit goal of FND-02). The plan's predicted stale-label failures were real and were also fixed once these blockers were cleared.

## Threat Flags

None. Changes are test/fixtures only (matches threat register T-02-01 accept disposition). Zero new packages installed (T-02-SC).

## Self-Check: PASSED

- Files: tests/e2e/app-shell-navigation.spec.ts, tests/e2e/cooking-pill.spec.ts, tests/e2e/fixtures/testData.ts, tests/e2e/fixtures/seedApp.ts — all FOUND.
- Commits: 6940337, 6b90c22 — all FOUND.
