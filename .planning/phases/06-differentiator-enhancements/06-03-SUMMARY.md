---
phase: 06-differentiator-enhancements
plan: 03
subsystem: ui
tags: [wizard, shopping-list, missing-ingredients, bottom-sheet]

requires:
  - phase: 06-differentiator-enhancements (plan 02)
    provides: result cards with missingIngredientIds, ingredientDetails, and bottom-sheet reason pattern
provides:
  - selected missing-ingredient append reducer for incomplete shopping lists
  - result-card action and Sheet for adding missing ingredients to Đi chợ inline
  - duplicate-skipping, create-list, success, manage, and undo result states
affects: [phase-6-verification, deployment]

tech-stack:
  added: []
  patterns:
    - result-card convenience actions remain local to the wizard and dispatch existing Redux slice actions
    - missing ingredient sheets preselect addable rows and disable rows already present in the active shopping list

key-files:
  created:
    - src/Store/Reducers/ShoppingListReducer.test.ts
  modified:
    - src/Common/Copy/AppCopy.ts
    - src/Modules/MealPlanning/Screens/WizardResult.widget.tsx
    - src/Modules/MealPlanning/Screens/Wizard.screen.test.tsx
    - src/Store/Reducers/ShoppingListReducer.ts

key-decisions:
  - "The wizard targets the latest incomplete shopping list by createdDate and creates `Đi chợ hôm nay` inline only when none exists."
  - "Duplicate ingredient groups are skipped before dispatch and backed by reducer-level duplicate protection."
  - "Undo removes only ingredient groups added for the current dish/ingredient IDs when the target list is still incomplete."

patterns-established:
  - "Pattern: `data-testid=wizard-add-missing-*` identifies result cards that can open the missing-ingredient Sheet."
  - "Pattern: create-list-in-place flows dispatch `addShoppingList` followed by targeted ingredient append without navigating away."

requirements-completed: [WIZ2-03]

duration: 22min
completed: 2026-06-18
status: complete
---

# Phase 6 Plan 3: Inline Missing Ingredient Shopping Summary

**Wizard result cards can add selected missing ingredients to Đi chợ inline, with duplicate protection and no forced navigation.**

## Performance

- **Duration:** 22 min
- **Started:** 2026-06-18T16:06:00Z
- **Completed:** 2026-06-18T16:28:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Added `addIngredientGroupsToShoppingList` to append selected missing ingredient groups to incomplete lists only.
- Added reducer coverage for duplicate skipping and completed-list protection.
- Result cards with missing ingredients now render `wizard-add-missing-{dish.id}` and open a bottom Sheet.
- Missing rows are preselected, amount/unit labels use `ingredientDetails` when available, and duplicates are disabled as already added.
- If no incomplete shopping list exists, the Sheet creates `Đi chợ hôm nay` in place and appends selected rows without navigation.
- After adding, result cards show inline success with manage and undo actions.

## Task Commits

1. **Task 1: Add selected missing ingredient append reducer** - `a8137d6` (feat)
2. **Task 2: Wire result-card missing ingredient Sheet and inline state** - `6a7e7e7` (feat)

**Plan metadata:** _docs commit follows this SUMMARY_

## Files Created/Modified

- `src/Store/Reducers/ShoppingListReducer.ts` - selected missing ingredient append action with duplicate and completed-list guards.
- `src/Store/Reducers/ShoppingListReducer.test.ts` - focused reducer coverage.
- `src/Common/Copy/AppCopy.ts` - missing-ingredient Sheet, success, manage, and undo copy.
- `src/Modules/MealPlanning/Screens/WizardResult.widget.tsx` - result-card action, Sheet flow, create-list path, success/manage/undo state.
- `src/Modules/MealPlanning/Screens/Wizard.screen.test.tsx` - includes the shopping-list slice in the wizard test store.

## Decisions Made

- The latest incomplete shopping list is selected by `createdDate`; completed lists are ignored.
- New lists are created with empty dishes/scheduled meals and only the selected missing ingredient groups, preserving the user's current wizard context.
- Standard selected-ingredient results fall back to name-only rows; cook-now rows use scored `needToBuyAmount` and unit details.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The first build caught TypeScript literal inference on the default create-list name. The state was widened to `string`, then `yarn build` passed.
- Existing `selectInventoryHealthConfig`/`selectSharedConfig` selector behavior still emits a reselect dev warning in the focused wizard test. Tests pass and build passes; this predates the 06-03 work.

## User Setup Required

None - no external service configuration required.

## Verification

- `yarn test --watchAll=false --runTestsByPath src/Store/Reducers/ShoppingListReducer.test.ts` - passed, 2 tests.
- `yarn test --watchAll=false --runTestsByPath src/Store/Reducers/ShoppingListReducer.test.ts src/Modules/MealPlanning/Screens/Wizard.screen.test.tsx` - passed, 8 tests.
- `yarn build` - passed with existing unrelated lint warnings.
- `rg -n "wizard-add-missing-|addIngredientGroupsToShoppingList" src/Modules/MealPlanning/Screens/WizardResult.widget.tsx src/Store/Reducers/ShoppingListReducer.ts` - found expected result-screen hook and reducer action.

## Next Phase Readiness

Phase 6 implementation is complete and ready for phase-level verification covering WIZ2-01 through WIZ2-05.

---
*Phase: 06-differentiator-enhancements*
*Completed: 2026-06-18*

## Self-Check: PASSED

- FOUND: `src/Modules/MealPlanning/Screens/WizardResult.widget.tsx`
- FOUND: `src/Store/Reducers/ShoppingListReducer.ts`
- FOUND: `src/Store/Reducers/ShoppingListReducer.test.ts`
- FOUND: commit `a8137d6`
- FOUND: commit `6a7e7e7`
- FOUND: `.planning/phases/06-differentiator-enhancements/06-03-SUMMARY.md`
