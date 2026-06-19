---
phase: 06-differentiator-enhancements
plan: 04
subsystem: ui
tags: [dish-suggester, cook-now, scoring, inventory, jest]

requires:
  - phase: 06-differentiator-enhancements
    provides: cook-now scoring + three-bucket grouping (06-02), UAT diagnosis (06-UAT, cook-now-single-group debug)
provides:
  - Cook-now grouping decoupled from serving-scaled readiness (baseReady signal)
  - Readiness-based middle/backup split in groupCookNow (no composite-score baseline)
  - Real scoreCookNow -> groupCookNow pipeline characterization test
affects: [dish-suggester, wizard-result, cook-now]

tech-stack:
  added: []
  patterns:
    - "Unscaled base-recipe readiness (baseReady) separate from serving-scaled coverage"
    - "Inventory-readiness bucketing instead of composite cookNowScore thresholds"

key-files:
  created:
    - .planning/phases/06-differentiator-enhancements/deferred-items.md
  modified:
    - src/Modules/DishSuggester/Helpers/DishScorer.ts
    - src/Modules/DishSuggester/Helpers/DishScorer.test.ts

key-decisions:
  - "Compute unscaled baseReady in scoreInventoryDishes and expose on ScoredDish; groupCookNow reads it so the Nấu ngay bucket is independent of servingCount scaling"
  - "Split middle/backup on missing-ingredient count (<=2 middle, else backup) instead of the cookNowScore >= 0.58 baseline that swallowed low-readiness dishes"

patterns-established:
  - "Pattern: serving-scaled coverage drives shopping/cost, unscaled coverage drives ready/not-ready classification"
  - "Pattern: characterization tests must exercise the real scoreCookNow -> groupCookNow pipeline, not synthetic ScoredDish inputs"

requirements-completed: [WIZ2-02]

duration: 12min
completed: 2026-06-19
---

# Phase 6 Plan 04: Cook-Now Grouping Fix Summary

**Cook-now results no longer collapse to the middle bucket — an unscaled `baseReady` signal drives "Nấu ngay" and a missing-count split routes low-readiness dishes to "Dự phòng", pinned by a real-pipeline test.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-06-19
- **Completed:** 2026-06-19
- **Tasks:** 2
- **Files modified:** 2 (+1 created)

## Accomplishments
- Fixed UAT gap (test 4): cook-now grouping yields all three buckets (Nấu ngay / Cần mua thêm ít / Dự phòng) under realistic serving counts.
- Decoupled "Nấu ngay" membership from serving-scaled amounts via a new unscaled `baseReady` field on `ScoredDish`, computed in `scoreInventoryDishes`.
- Re-tuned `groupCookNow`: removed the `cookNowScore >= 0.58` middle-bucket clause and split middle/backup on missing-ingredient count so many-missing dishes fall to "Dự phòng".
- Added a real `scoreCookNow -> groupCookNow` characterization test with `servingCount` (4) > `baseServings` (2), proving the three-bucket distribution.

## Task Commits

Each task was committed atomically (TDD):

1. **Task 1: Pin three-bucket cook-now distribution (RED)** - `3f13cb7` (test)
2. **Task 2: Decouple Nấu ngay readiness + re-tune split (GREEN)** - `1f16687` (fix)
3. **Deferred-item log (out-of-scope build break)** - `4118474` (docs)

_TDD: RED (`3f13cb7`) then GREEN (`1f16687`)._

## Files Created/Modified
- `src/Modules/DishSuggester/Helpers/DishScorer.ts` - Added `baseReady` to `ScoredDish`; tracked unscaled `baseRequired` in `scoreInventoryDishes`; rewrote `groupCookNow` to use `baseReady` for group 0 and a missing-count split (<=2 middle, else backup).
- `src/Modules/DishSuggester/Helpers/DishScorer.test.ts` - Added real-pipeline grouping test with serving scaling; re-tuned the synthetic `groupCookNow` expectation to the readiness-based boundary.
- `.planning/phases/06-differentiator-enhancements/deferred-items.md` - Logged the pre-existing `SheetActions` build break (out of scope).

## Decisions Made
- Kept serving-scaled coverage for shopping/cost (`missingIngredientIds`, `extraShoppingCost`) intact and introduced a separate unscaled `baseReady` purely for ready/not-ready classification. This preserves all existing `score`/`scoreWithInventory`/`scoreCookNow` characterization assertions while fixing the bucket collapse.
- Middle/backup boundary now uses `missingIngredientIds.length <= 2` (was `<= 3` plus a composite-score escape hatch). A near-ready dish is classified by inventory readiness, not by the speed/preference/nutrition baseline.

## Deviations from Plan

### Out-of-scope discovery (logged, not fixed)

**1. [Scope boundary] Pre-existing build break: `SheetActions` not exported**
- **Found during:** Task 2 verification (`yarn build`)
- **Issue:** `src/Modules/MealPlanning/Screens/WizardResult.widget.tsx:11` imports `SheetActions` from `@components/Sheet`, which only exports `Sheet`/`SheetProps`. `yarn build` and `tsc --noEmit` fail with `TS2305`.
- **Action:** Confirmed present at wave base commit `f16ef2e` and unrelated to DishScorer. Logged to `deferred-items.md`; owned by the sibling WizardResult plan (06-05). Not fixed here per the executor scope boundary.
- **Verification:** `tsc --noEmit` reports exactly 1 error, all in `WizardResult.widget.tsx`; no errors in DishScorer files.

---

**Total deviations:** 0 auto-fixed (1 out-of-scope item logged)
**Impact on plan:** Plan executed as written. The cook-now fix is complete and fully tested.

## Issues Encountered
- The worktree had no `node_modules` (worktrees do not get their own install). Symlinked the worktree `node_modules` to the main repo's install so `yarn test` / `tsc` could run. The symlink is gitignored and not committed.
- `yarn build` cannot reach completion because of the pre-existing `SheetActions` break above. Verified the DishScorer changes in isolation with `tsc --noEmit` (the only error is the unrelated, pre-existing one) and the full Jest suite for the file (8/8 passing).

## Verification
- `yarn test --watchAll=false --runTestsByPath src/Modules/DishSuggester/Helpers/DishScorer.test.ts` → 8 passed, 8 total.
- `tsc --noEmit` → DishScorer files clean; only the pre-existing `WizardResult.widget.tsx` `SheetActions` error remains (deferred to 06-05).

## Next Phase Readiness
- Cook-now grouping differentiator restored; ready for end-of-phase UAT re-test of test 4.
- `yarn build` will pass once sibling plan 06-05 fixes the `SheetActions` import in `WizardResult.widget.tsx`.

---
*Phase: 06-differentiator-enhancements*
*Completed: 2026-06-19*

## Self-Check: PASSED
- Files verified on disk: DishScorer.ts, DishScorer.test.ts, 06-04-SUMMARY.md, deferred-items.md
- Commits verified in git: 3f13cb7 (test), 1f16687 (fix), 4118474 (docs), c111d0d (docs)
