---
phase: 05-mobile-tuning-copy-rollout
plan: 06
subsystem: ui
tags: [copy-migration, app-copy, sheet, mobile, vietnamese, dish-suggester, dishes, ingredient, mob-01, mob-02, mob-03, copy-03]

# Dependency graph
requires:
  - phase: 01-copy-infrastructure
    provides: typed AppCopy module + CopyKey union + glossary
  - phase: 05-mobile-tuning-copy-rollout (plan 05-05)
    provides: AppCopy.scheduledMeal namespace + prior Sheet/list-screen migration pattern
provides:
  - AppCopy.dishSuggester, AppCopy.dishes, and AppCopy.ingredient namespaces
  - DishSuggester, DishesList, and IngredientList screens reading user-facing copy through AppCopy
  - DishesList delete confirm as a Sheet with explicit danger CTA
  - IngredientList add/inventory/edit/nutrition/delete hosts as Sheets
  - Primary list add actions explicitly sized to 44px targets
affects: [05-07, phase-5-verification, deployment]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - AppCopy namespace extension by screen cluster with named-arg interpolation fns
    - Sheet body action stack for destructive confirms using Button type="primary" danger size="large"
    - Router basename derives from PUBLIC_URL so Playwright and GitHub Pages use the same path

key-files:
  created: []
  modified:
    - src/Common/Copy/AppCopy.ts
    - src/Modules/DishSuggester/Screens/DishSuggester.screen.tsx
    - src/Modules/Dishes/Screens/DishesList.screen.tsx
    - src/Modules/Ingredient/Screens/IngredientList.screen.tsx
    - src/Routing/RootRouter.tsx
    - src/App.test.tsx

key-decisions:
  - "DishSuggester work was resumed from two existing production commits and not re-executed; remaining work started at DishesList/IngredientList to avoid duplicate edits."
  - "DishesList converted the destructive delete confirm to Sheet and left larger content/cooking modals in place; those are not the single-step confirm surface named by the plan."
  - "IngredientList converted all direct Modal/FastModalShell hosts in the list file to Sheet because they are single-step list-level hosts and the plan acceptance grep forbids onOk/footer-null remnants there."
  - "Route basename mismatch (/my-household router vs /my-recipes PUBLIC_URL/e2e) blocked the NAV-02 e2e proof, so RootRouter now derives basename from PUBLIC_URL."

patterns-established:
  - "Pattern: list delete Sheet renders body text, Button type=primary danger size=large, then a size=large cancel button using AppCopy.common.cancel."
  - "Pattern: list-level add/edit/inventory/nutrition hosts can move to Sheet while keeping DeferredModalContent inside the Sheet body."

requirements-completed: [COPY-03, MOB-03, MOB-01, MOB-02]

# Metrics
duration: 47min
completed: 2026-06-17
status: complete
---

# Phase 5 Plan 6: DishSuggester, Dishes, Ingredient List Cluster Summary

**The final high-traffic list cluster now reads migrated copy from `AppCopy`, uses Sheets for the remaining single-step list confirmations/hosts, preserves the `/dish-suggester` route, and has touch-sized primary add affordances.**

## Performance

- **Started:** 2026-06-17T14:50:00Z
- **Completed:** 2026-06-17T15:37:53Z
- **Tasks:** 3
- **Files modified:** 6 source files

## Accomplishments

- Resumed the already-started DishSuggester task from commits `f7cb9e9` and `d93d92d`; no duplicate work was dispatched after the safe-resume check found production commits without a SUMMARY.
- Added `AppCopy.dishes` and migrated `DishesList.screen.tsx` user-facing copy, including title, filters, loading count, row labels, menu labels, status badges, toasts, modal titles, and confirm text.
- Converted the DishesList destructive delete confirm from an antd Modal `okButtonProps danger` flow to a Sheet with explicit danger CTA.
- Added `AppCopy.ingredient` and migrated `IngredientList.screen.tsx` user-facing copy, including stock filters, page actions, search/loading text, category reset, inventory status cards, row menu labels, modal titles, and delete text.
- Converted IngredientList direct list-level add, inventory, edit, nutrition, and delete hosts to Sheets; the old `Modal`/`FastModalShell` imports are gone from the file.
- Fixed the router basename to derive from `PUBLIC_URL`, unblocking the `dish-suggester` Playwright route proof and aligning runtime routing with the `/my-recipes` deployment path.

## Task Commits

1. **Task 1: DishSuggester.screen copy migration + Sheet action hosts** — `f7cb9e9`, `d93d92d` (feat, resumed from prior session)
2. **Task 2: DishesList.screen copy migration + danger-confirm Sheet swap + touch targets** — `618800f` (feat)
3. **Task 3: IngredientList.screen copy migration + picker/confirm Sheet swap + touch targets** — `b6fe118` (feat)

**Verification fix:** `2c0b482` (fix) — aligns `BrowserRouter` basename with `PUBLIC_URL` so `/my-recipes/dish-suggester` renders under Playwright/GitHub Pages.

**Plan metadata:** _docs commit follows this SUMMARY_

## Files Created/Modified

- `src/Common/Copy/AppCopy.ts` — added `dishSuggester`, `dishes`, and `ingredient` namespaces for the migrated cluster.
- `src/Modules/DishSuggester/Screens/DishSuggester.screen.tsx` — completed before resume; screen reads `AppCopy.dishSuggester` and keeps the action hosts as Sheets.
- `src/Modules/Dishes/Screens/DishesList.screen.tsx` — migrated all remaining Vietnamese literals to `AppCopy.dishes`, converted delete confirm to Sheet, and set the add icon to 44px.
- `src/Modules/Ingredient/Screens/IngredientList.screen.tsx` — migrated all Vietnamese literals to `AppCopy.ingredient`, converted list-level hosts to Sheets, and set the add icon to 44px.
- `src/Routing/RootRouter.tsx` — derives router basename from `PUBLIC_URL` instead of hardcoding `/my-household`.
- `src/App.test.tsx` — follows the configured basename in the dashboard smoke test.

## Decisions Made

- **Safe resume over re-execution.** Production commits for `05-06` already existed without a SUMMARY, so the remaining work was reconciled from disk and continued from the incomplete Dishes/Ingredient tasks.
- **DishesList confirm scope.** The plan specifically named the destructive confirm with `okButtonProps danger`; that flow is now a Sheet. Larger Dishes content/cooking modals remain in place because they are form/session hosts rather than the single-step confirm surface being fixed here.
- **IngredientList full direct-host conversion.** IngredientList had direct add/edit/inventory/nutrition/delete hosts in the same file. They are now Sheets so the plan's `onOk`/`footer={null}` acceptance grep is clean.
- **Routing basename is a deployment correctness issue.** The route proof initially failed because the app was mounted at `/my-household` while `.env`, Playwright, and build output use `/my-recipes`. Deriving from `PUBLIC_URL` keeps dev, e2e, and GitHub Pages aligned.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Router basename mismatch blocked NAV-02 e2e**

- **Found during:** Plan-level e2e verification
- **Issue:** `yarn test:e2e tests/e2e/dish-suggester.spec.ts --reporter=line` could not find `dish-suggester-page` because `RootRouter` hardcoded `/my-household` while Playwright and `.env` served `/my-recipes`.
- **Fix:** `RootRouter` now derives its basename from `process.env.PUBLIC_URL`; `App.test.tsx` follows the same configured basename.
- **Files modified:** `src/Routing/RootRouter.tsx`, `src/App.test.tsx`
- **Verification:** reran the focused e2e; it passed (`1 passed`, 8.6s).
- **Committed in:** `2c0b482`

---

**Total deviations:** 1 auto-fixed blocking verification issue.  
**Impact on plan:** No scope creep in UI behavior; this was necessary for the plan's required route-reachability proof and deployment path correctness.

## Issues Encountered

- The first `dish-suggester` e2e run failed at route entry because of the basename mismatch above. After the fix, the same spec passed.
- `yarn build` still reports existing unrelated eslint warnings in older files (`SharedSyncModal`, form wrappers, `useScreenTitle`, several Dishes/ScheduledMeal/ShoppingList widgets). No new build failure was introduced by this plan.

## User Setup Required

None — no external service configuration required.

## Verification

- `yarn build` — passed after implementation and again after the router basename fix.
- `yarn test:e2e tests/e2e/dish-suggester.spec.ts --reporter=line` — failed before basename fix, then passed after `2c0b482`.
- `rg -n "[À-ỹ]" src/Modules/Dishes/Screens/DishesList.screen.tsx src/Modules/Ingredient/Screens/IngredientList.screen.tsx` — 0 matches.
- `rg -n "okButtonProps" src/Modules/Dishes/Screens/DishesList.screen.tsx` — 0 matches.
- `rg -n "onOk=|footer=\{null\}" src/Modules/Ingredient/Screens/IngredientList.screen.tsx` — 0 matches.
- `rg -n "size=\"large\"|height:\s*44|height=\{44\}" src/Modules/Dishes/Screens/DishesList.screen.tsx src/Modules/Ingredient/Screens/IngredientList.screen.tsx` — matches the touch-sized add icons and Sheet action CTAs.

## Next Phase Readiness

- All copy-migration plans are complete through 05-06. Plan 05-07 can now run as intended: a single-file `AppCopy.ts` voice pass, with keys locked and screen consumers untouched.
- The `/dish-suggester` reachability gate is green under the actual `/my-recipes` deploy path, so deployment verification will test the same basename as production.

---
*Phase: 05-mobile-tuning-copy-rollout*  
*Completed: 2026-06-17*

## Self-Check: PASSED

- FOUND: `src/Common/Copy/AppCopy.ts`
- FOUND: `src/Modules/DishSuggester/Screens/DishSuggester.screen.tsx`
- FOUND: `src/Modules/Dishes/Screens/DishesList.screen.tsx`
- FOUND: `src/Modules/Ingredient/Screens/IngredientList.screen.tsx`
- FOUND: commit `f7cb9e9`
- FOUND: commit `d93d92d`
- FOUND: commit `618800f`
- FOUND: commit `b6fe118`
- FOUND: commit `2c0b482`
- FOUND: `.planning/phases/05-mobile-tuning-copy-rollout/05-06-SUMMARY.md`
