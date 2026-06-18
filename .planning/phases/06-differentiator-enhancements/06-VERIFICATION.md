# Phase 6 Verification: Differentiator Enhancements

**Date:** 2026-06-18  
**Status:** Passed  
**Scope:** WIZ2-01 through WIZ2-05

## Requirement Proof

| Requirement | Status | Evidence |
|-------------|--------|----------|
| WIZ2-01: "Who's eating?" portion step | Passed | `WizardAnswers.memberIds` and `servingCount` are explicit fields; `WizardServingsStep.widget.tsx` provides household-member selection plus serving +/- fallback; `Wizard.screen.tsx` inserts `servings` between ingredients and preferences. |
| WIZ2-02: Optional inventory/cook-now filter | Passed | `WizardPreferenceStep.widget.tsx` renders the `cookNowOnly` toggle; `WizardResult.widget.tsx` uses `DishScorer.scoreCookNow` and `groupCookNow` when inventory exists; `DishScorer.groupCookNow` labels the middle group as `Cần mua thêm ít`. |
| WIZ2-03: Inline missing ingredient to Đi chợ | Passed | `ShoppingListReducer.ts` exports `addIngredientGroupsToShoppingList`; `WizardResult.widget.tsx` renders `wizard-add-missing-{dish.id}`, opens a missing-ingredient Sheet, preselects addable rows, creates a list in place when needed, skips duplicates, and shows success/manage/undo state. |
| WIZ2-04: Remember last answers as defaults | Passed | `WizardState.lastCompletedAnswers` persists under `personal.wizard`; `advanceWizardStep('result')` and `completeWizard()` save defaults; `restartWizard()` prefills from defaults; `startFreshWizard()` clears only the current run; `clearWizardDefaults()` removes stored defaults. |
| WIZ2-05: One-line why-this-dish reason | Passed | `WizardResult.widget.tsx` renders `wizard-reason-{dish.id}` and `wizard-reason-detail-{dish.id}`; the detail Sheet lists matched/missing ingredients, preference factors, and household factors without raw scores. |

## Automated Verification

- `yarn test --watchAll=false --runTestsByPath src/Store/Reducers/WizardReducer.test.ts` — passed, 12 tests.
- `yarn test --watchAll=false --runTestsByPath src/Modules/MealPlanning/Screens/Wizard.screen.test.tsx` — passed, 6 tests.
- `yarn test --watchAll=false --runTestsByPath src/Modules/DishSuggester/Helpers/DishScorer.test.ts` — passed, 7 tests.
- `yarn test --watchAll=false --runTestsByPath src/Store/Reducers/ShoppingListReducer.test.ts` — passed, 2 tests.
- `yarn test --watchAll=false --runTestsByPath src/Store/Reducers/ShoppingListReducer.test.ts src/Modules/MealPlanning/Screens/Wizard.screen.test.tsx` — passed, 8 tests.
- `yarn build` — passed with existing unrelated lint warnings.
- `rg -n "wizard-add-missing-|addIngredientGroupsToShoppingList" src/Modules/MealPlanning/Screens/WizardResult.widget.tsx src/Store/Reducers/ShoppingListReducer.ts` — found expected result-card hook and reducer action.

## UAT Notes

- The Phase 6 flow remains route-hosted and uses the existing phone-first wizard container.
- All new visible strings are in `AppCopy.wizard`.
- Bottom-sheet flows use `Sheet` and `SheetActions`; the missing-ingredient Sheet keeps the user on the result page after add.
- The time/effort step remains deferred because dish data does not yet expose a stable time/effort attribute beyond existing duration fields.

## Residual Risks

- The focused wizard test still emits an existing reselect dev warning from `selectInventoryHealthConfig` / `selectSharedConfig`. It does not fail tests or build.
- Browser/mobile rendering still needs a deployment smoke check against the built app before pushing `docs/`.
