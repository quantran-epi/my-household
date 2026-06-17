---
phase: 05-mobile-tuning-copy-rollout
reviewed: 2026-06-17T16:04:03Z
depth: standard
files_reviewed: 27
files_reviewed_list:
  - src/App.test.tsx
  - src/Common/Copy/AppCopy.ts
  - src/Modules/DishSuggester/Helpers/DishScorer.test.ts
  - src/Modules/DishSuggester/Screens/DishSuggester.screen.tsx
  - src/Modules/DishSuggester/Screens/DishSuggesterPage.screen.tsx
  - src/Modules/Dishes/Screens/DishesExport.widget.tsx
  - src/Modules/Dishes/Screens/DishesList.screen.tsx
  - src/Modules/Dishes/Screens/DishesManageIngredient/DishDetail.widget.tsx
  - src/Modules/Dishes/Screens/FinishCooking.widget.tsx
  - src/Modules/Ingredient/Screens/IngredientInventory.widget.tsx
  - src/Modules/Ingredient/Screens/IngredientList.screen.tsx
  - src/Modules/MealPlanning/Components/WizardProgress.tsx
  - src/Modules/MealPlanning/Screens/WizardIngredientStep.widget.tsx
  - src/Modules/MealPlanning/Screens/WizardPreferenceStep.widget.tsx
  - src/Modules/MealPlanning/Screens/WizardResult.widget.tsx
  - src/Modules/ScheduledMeal/Screens/LeftoverManagement.screen.tsx
  - src/Modules/ScheduledMeal/Screens/MealSlotTimesModal.tsx
  - src/Modules/ScheduledMeal/Screens/ScheduledMealAdd.widget.tsx
  - src/Modules/ScheduledMeal/Screens/ScheduledMealList.screen.tsx
  - src/Modules/ScheduledMeal/Screens/ScheduledMealToolkit.widget.tsx
  - src/Modules/ShoppingList/Screens/ShoppingList.screen.tsx
  - src/Modules/ShoppingList/Screens/ShoppingListDetail.widget.tsx
  - src/Modules/ShoppingList/Screens/ShoppingListExport.widget.tsx
  - src/Routing/MasterPage.tsx
  - src/Routing/RootRouter.tsx
  - src/Routing/Shell/SidebarDrawer.tsx
  - tests/e2e/dish-suggester.spec.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
fixed_during_review: 3
status: clean
---

# Phase 05: Code Review Report

**Reviewed:** 2026-06-17T16:04:03Z  
**Depth:** standard  
**Status:** clean after review fixes

## Summary

Phase 5 completes the phone-first and copy rollout across the guided journey, shell, shopping-list, scheduled-meal, dish-suggester, dishes, and ingredient list surfaces. The review focused on three risk areas: route/deploy basename correctness, Modal-to-Sheet behavior preservation, and copy migration consistency through `AppCopy`.

No open correctness, security, or data-loss findings remain in the reviewed Phase 5 scope.

## Fixed During Review

### FX-01: Stale e2e labels after the AppCopy voice pass

**File:** `tests/e2e/dish-suggester.spec.ts`  
**Issue:** The focused route proof still searched for the old title/action labels (`Nấu gì hôm nay?`, `Kế hoạch chi phí`) after the Phase 5 voice pass changed them to `Hôm nay nấu gì?` and `Tính chi phí`. The app behavior was correct; the test was stale.  
**Fix:** Updated the assertions to the new copy.  
**Commit:** `5c28c0f`  
**Verification:** `yarn test:e2e tests/e2e/dish-suggester.spec.ts --reporter=line` passed.

### FX-02: Date-sensitive DishScorer characterization fixture

**File:** `src/Modules/DishSuggester/Helpers/DishScorer.test.ts`  
**Issue:** The fixture expected an expiry `daysLeft` of `1` for `2026-06-17`, but the real system date is 2026-06-17, so the test received `0`. Production scorer code was unchanged; the characterization test needed deterministic time.  
**Fix:** Froze Jest time to `2026-06-16T12:00:00.000Z` for this test file.  
**Commit:** `7fe1c55`  
**Verification:** `CI=true yarn test --watchAll=false` passed.

### FX-03: DishSuggester route wrapper still had inline old copy

**Files:** `src/Modules/DishSuggester/Screens/DishSuggesterPage.screen.tsx`, `src/Common/Copy/AppCopy.ts`  
**Issue:** The `/dish-suggester` wrapper page still hardcoded `Nấu gì hôm nay?` and its subtitle, while the embedded suggester had moved to `AppCopy.dishSuggester.title`. This left route-level copy out of sync with the final voice pass.  
**Fix:** Reused `AppCopy.dishSuggester.title` for the wrapper heading/screen title and added `AppCopy.dishSuggester.pageSubtitle` for the wrapper subtitle.  
**Commit:** `baeec34`  
**Verification:** Build, Jest, and the focused dish-suggester e2e all passed after the fix.

## Review Notes

- `RootRouter` now derives `BrowserRouter` basename from `PUBLIC_URL`, aligning source, Playwright, and GitHub Pages at `/my-recipes`.
- The reviewed destructive confirm conversions render explicit `Button type="primary" danger size="large"` actions inside `Sheet`, with cancel/close paths preserved.
- Ingredient list add/edit/inventory/nutrition/delete hosts now use `Sheet` without losing their `DeferredModalContent` lazy body pattern.
- Remaining `Modal` and `Modal.confirm` sites found by repo-wide grep are legacy or out-of-scope surfaces, not regressions introduced by this Phase 5 gate.
- Native Vietnamese household-user sign-off was not available in this automated run; it is recorded as verification follow-up rather than a code-review finding.

---

_Reviewed inline because typed GSD subagents were unavailable in this Codex session and the local `gsd-tools.cjs` helper fails to load its package metadata._
