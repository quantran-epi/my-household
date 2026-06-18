---
phase: 06-differentiator-enhancements
plan: 02
subsystem: ui
tags: [wizard, cook-now, dish-scoring, reasons, bottom-sheet]

requires:
  - phase: 06-differentiator-enhancements (plan 01)
    provides: wizard memberIds, servingCount, cookNowOnly, and remembered defaults
provides:
  - optional cook-now toggle on the preference step
  - cook-now result grouping using DishScorer.scoreCookNow and groupCookNow
  - natural reason line and question-mark detail sheet on result cards
affects: [06-03, phase-6-verification, deployment]

tech-stack:
  added: []
  patterns:
    - result cards carry a one-line household reason plus a non-numeric Sheet detail
    - cook-now mode uses richer scorer only when the user opts in and inventory data exists

key-files:
  created: []
  modified:
    - src/Common/Copy/AppCopy.ts
    - src/Modules/MealPlanning/Screens/WizardPreferenceStep.widget.tsx
    - src/Modules/MealPlanning/Screens/WizardResult.widget.tsx
    - src/Modules/MealPlanning/Screens/Wizard.screen.test.tsx
    - src/Modules/DishSuggester/Helpers/DishScorer.ts
    - src/Modules/DishSuggester/Helpers/DishScorer.test.ts

key-decisions:
  - "Cook-now remains optional; standard selected-ingredient scoring and full-catalog fallback remain the non-inventory path."
  - "The middle cook-now group label is `Cần mua thêm ít`, matching Phase 6 D-09."
  - "Reason detail sheets expose matched/missing/preference/household factors but no raw score numbers."

patterns-established:
  - "Pattern: `answers.cookNowOnly === true && inventory has data` gates cook-now scoring."
  - "Pattern: `data-testid=wizard-reason-*` and `wizard-reason-detail-*` identify card explanation affordances."

requirements-completed: [WIZ2-02, WIZ2-05]

duration: 19min
completed: 2026-06-18
status: complete
---

# Phase 6 Plan 2: Cook-Now Grouping And Suggestion Reasons Summary

**Wizard results now support optional cook-now grouping and every result card explains its recommendation with a natural, non-numeric detail affordance.**

## Performance

- **Duration:** 19 min
- **Started:** 2026-06-18T15:47:00Z
- **Completed:** 2026-06-18T16:06:00Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Added `Ưu tiên nấu được ngay` as an optional preference-step toggle stored in wizard answers/defaults.
- Updated `DishScorer.groupCookNow` middle label to `Cần mua thêm ít` and kept characterization coverage green.
- Result cards use `scoreCookNow` and `groupCookNow` when cook-now is enabled and inventory exists.
- Result cards now show a one-line reason and a question-mark detail button.
- Detail sheets explain matched ingredients, missing ingredients, preference matches/avoids, and household fit without score math.
- Empty/weak inventory keeps the flow alive by falling back to selected-ingredient or full-catalog suggestions.

## Task Commits

1. **Task 1: Add optional cook-now toggle to wizard preferences** - `5b4af44` (feat)
2. **Task 2: Align cook-now grouping label with Phase 6 contract** - `80b4783` (feat)
3. **Task 3: Render grouped result cards with reason line and detail sheet** - `66ead98` (feat)

**Plan metadata:** _docs commit follows this SUMMARY_

## Files Created/Modified

- `src/Common/Copy/AppCopy.ts` - cook-now, availability, reason, and detail copy.
- `src/Modules/MealPlanning/Screens/WizardPreferenceStep.widget.tsx` - optional cook-now switch.
- `src/Modules/MealPlanning/Screens/WizardResult.widget.tsx` - grouped results, reason line, detail sheet.
- `src/Modules/MealPlanning/Screens/Wizard.screen.test.tsx` - fuller test store and cook-now toggle assertion.
- `src/Modules/DishSuggester/Helpers/DishScorer.ts` - Phase 6 group label.
- `src/Modules/DishSuggester/Helpers/DishScorer.test.ts` - updated characterization expectation.

## Decisions Made

- Cook-now is not a strict filter; it changes grouping/ranking only when inventory data can support it.
- The result card reason prioritizes practical household signals: ready-to-cook, few missing ingredients, preference fit, then fallback text.
- Detail sheets deliberately avoid raw numeric score values; counts and ingredient names are allowed because they are user-facing practical facts.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Existing `selectInventoryHealthConfig`/`selectSharedConfig` selector behavior emits a reselect dev warning in the focused wizard test. Tests pass and build passes; the warning predates this phase's logic and does not block behavior.

## User Setup Required

None - no external service configuration required.

## Verification

- `yarn test --watchAll=false --runTestsByPath src/Modules/MealPlanning/Screens/Wizard.screen.test.tsx` - passed, 6 tests.
- `yarn test --watchAll=false --runTestsByPath src/Modules/DishSuggester/Helpers/DishScorer.test.ts` - passed, 7 tests.
- `yarn test --watchAll=false --runTestsByPath src/Modules/DishSuggester/Helpers/DishScorer.test.ts src/Modules/MealPlanning/Screens/Wizard.screen.test.tsx` - passed, 13 tests.
- `yarn build` - passed with existing unrelated lint warnings.
- `rg -n "scoreCookNow|groupCookNow|wizard-reason-|wizard-reason-detail-" src/Modules/MealPlanning/Screens/WizardResult.widget.tsx` - found expected result-screen hooks.

## Next Phase Readiness

Plan 06-03 can use result-card missing ingredient data and the existing detail sheet pattern to add selected missing ingredients to Đi chợ inline.

---
*Phase: 06-differentiator-enhancements*
*Completed: 2026-06-18*

## Self-Check: PASSED

- FOUND: `src/Modules/MealPlanning/Screens/WizardResult.widget.tsx`
- FOUND: `src/Modules/DishSuggester/Helpers/DishScorer.ts`
- FOUND: commit `5b4af44`
- FOUND: commit `80b4783`
- FOUND: commit `66ead98`
- FOUND: `.planning/phases/06-differentiator-enhancements/06-02-SUMMARY.md`
