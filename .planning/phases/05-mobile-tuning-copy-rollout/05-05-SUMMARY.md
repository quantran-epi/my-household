---
phase: 05-mobile-tuning-copy-rollout
plan: 05
subsystem: ui
tags: [copy-migration, app-copy, sheet, mobile, vietnamese, scheduled-meal, mob-01, mob-02, mob-03, copy-03]

# Dependency graph
requires:
  - phase: 01-copy-infrastructure
    provides: typed AppCopy module + CopyKey union + glossary (the namespace this plan extends)
  - phase: 05-mobile-tuning-copy-rollout (plan 05-04)
    provides: AppCopy.shoppingList namespace + Sheet adoption baseline (delete + template-apply + reload-confirm Sheets)
provides:
  - AppCopy.scheduledMeal namespace covering ScheduledMealList.screen + ScheduledMealAdd.widget (~60 leaves)
  - ScheduledMealList.screen reading all user-facing copy from AppCopy
  - ScheduledMealAdd.widget reading all user-facing copy from AppCopy
  - All 5 list-level Modals -> Sheet (add menu, template apply, range picker, range shopping, plus 4 plan-row Sheets edit/meal/copy/delete)
  - Add-widget worst-offender footer CTA retuned to full-width size=large minHeight 44 (MOB-01/02)
affects: [05-06, 05-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - scheduledMeal namespace continues the AppCopy convention from Phase 1 (PascalCase as-const, named-arg arrow fns for interpolation, direct object access at call sites)
    - Reuse of common.cancel ("Hủy") to normalize the previous "Huỷ" diacritic variant on this screen
    - Sheet body-CTA stack with size="large" minHeight 44 replaces antd Modal onOk/okText/cancelText/okButtonProps surface for every single-step picker and confirmation in this cluster

key-files:
  created: []
  modified:
    - src/Common/Copy/AppCopy.ts
    - src/Modules/ScheduledMeal/Screens/ScheduledMealList.screen.tsx
    - src/Modules/ScheduledMeal/Screens/ScheduledMealAdd.widget.tsx

key-decisions:
  - "scheduledMeal namespace seeded by Task 1 (list-screen keys) and extended additively by Task 2 (add-widget keys); single namespace covers both files to keep ScheduledMeal copy in one place (mirrors the shoppingList convention from 05-04)"
  - "All 5 list-level Modals were converted to Sheet — none deferred. The add-menu, template-apply and range-shopping Modals were single-step content hosts (case a). The range-picker, copy-to-day, edit, meal-detail Modals were also single-step. The delete-confirm Modal got case-b body danger CTA. None hit MOB-03's multi-step exception."
  - "ScheduledMealCookingModal and ScheduledMealSlotDetailModal were NOT touched: they are sub-component modals owned by sibling files (ScheduledMealCooking.widget, ScheduledMealSlotDetail.modal) and out of scope per the plan's files_modified contract"
  - "Worst-offender footer retuned: Stack justify=\"flex-end\" + default Button -> Stack direction=\"column\" + Button size=\"large\" width 100% minHeight 44 (MOB-01/02 wizard idiom — D-05 no responsive framework introduced)"
  - "Glossary compliance: no Tạo mới / Thêm mới introduced; the existing 'Tạo' verbs are domain-specific creation actions (template instantiation, range-shopping cart creation) preserved verbatim per migrate-only rule (rewording is 05-07)"
  - "Diacritic normalization: the file had three 'Huỷ' variants in cancelText props (lines 432, 481, 770 of the pre-migration file). All replaced by AppCopy.common.cancel which uses the canonical 'Hủy' value — recorded as a normalization deviation under Auto-fixed Issues."

patterns-established:
  - "Pattern: list screen with multiple modal-hosted Add widgets — wrap each in Sheet + Box padding 16, drop footer={null}, drop destroyOnClose, map onCancel -> onClose. The hosted widget keeps its own 'Save' CTA so no Sheet-level onOk/footer is needed."
  - "Pattern: add widget footer thumb-zone — Stack direction=\"column\" gap=8 fullwidth + Button type=\"primary\" size=\"large\" width 100% minHeight 44, label from AppCopy.common.save."

requirements-completed: [COPY-03, MOB-03, MOB-01, MOB-02]

# Metrics
duration: 18min
completed: 2026-06-17
---

# Phase 5 Plan 5: ScheduledMeal Copy + Sheet + Thumb-zone CTA Summary

**ScheduledMealList screen and ScheduledMealAdd widget now read all Vietnamese copy from `AppCopy.scheduledMeal`, every Modal in this cluster renders as a `@components/Sheet`, and the named worst-offender footer CTA is full-width thumb-zone size=large minHeight 44.**

## Performance

- **Duration:** ~18 min
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Task 1 (commit `7d8b6a3`): seeded `AppCopy.scheduledMeal` namespace covering ~46 list-screen strings (header, day navigator, slot cards, plan rows, dropdown, all five list-level Modal titles + actions, plan-row Modals, delete confirm). Migrated `ScheduledMealList.screen.tsx` (804 LOC) end-to-end. Converted all five list-level Modals to `@components/Sheet`: add-menu (case a, hosts ScheduledMealAddWidget via DeferredModalContent), template-apply (case a, body-CTA stack), range-picker (case a, body-CTA stack), range-shopping (case a, hosts ShoppingListAddWidget). Converted four plan-row Modals to Sheets: edit (case a, hosts ScheduledMealEditWidget), meal-detail (case a, ShoppingListMealDetailWidget + feedback history), copy-to-day (case a, DatePicker + body-CTA stack), delete-confirm (case b, danger body CTA). Diacritic normalized "Huỷ" -> "Hủy" via `common.cancel`.
- Task 2 (commit `142de64`): extended `AppCopy.scheduledMeal` with ~12 add-widget keys (defaultMenuName, createdToast, nameLabel, namePlaceholder, plannedDateLabel, plannedDatePlaceholder, forWhomLabel, forWhom, existingMealsTitle, emptyMealLine, estimateTitle; reused common.save for the footer). Migrated `ScheduledMealAdd.widget.tsx` (181 LOC) end-to-end including the slot label data table (now reads from AppCopy.scheduledMeal.slot{Morning,Noon,Evening} which Task 1 already seeded). Retuned the named worst-offender footer from `Stack justify="flex-end"` + default `Button` to `Stack direction="column"` + `Button type="primary" size="large" minHeight 44 width 100%` (MOB-01/02 wizard idiom).

## Task Commits

1. **Task 1: ScheduledMealList.screen — copy migration + list-Modal Sheet swap** — `7d8b6a3` (feat)
2. **Task 2: ScheduledMealAdd.widget — copy migration + worst-offender footer CTA retune** — `142de64` (feat)

**Plan metadata:** _docs commit follows this SUMMARY_

## Files Created/Modified

- `src/Common/Copy/AppCopy.ts` — added `scheduledMeal` namespace (~58 leaves total across both tasks: list-screen + add-widget). All values are static strings or named-arg interpolation arrow fns; reused `common.cancel` and `common.save` rather than duplicating into the namespace.
- `src/Modules/ScheduledMeal/Screens/ScheduledMealList.screen.tsx` — every user-facing literal -> AppCopy; 9 Modals -> Sheet (5 list-level + 4 plan-row); `Modal` import dropped (kept `DeferredModalContent`); helper `getVietnameseWeekShoppingListName` now reads through `AppCopy.scheduledMeal.weekShoppingListName`. All `data-testid` preserved (none were named on the Modals being swapped — Sheets carry no new test ids either, matching the pre-migration contract).
- `src/Modules/ScheduledMeal/Screens/ScheduledMealAdd.widget.tsx` — every inline literal -> AppCopy; mealSlotLabels data-table sources labels from `AppCopy.scheduledMeal.slot{Morning,Noon,Evening}`; SmartForm `itemDefinitions` labels read from AppCopy; save toast uses `AppCopy.scheduledMeal.createdToast`; footer CTA full-width `size="large"` minHeight 44.

## Decisions Made

- **One namespace per module surface, not per file.** `scheduledMeal` covers both the list screen and the add widget so consumers never have to guess which file owns a key. Mirrors the `shoppingList` convention established in 05-04. Task 1 seeded it; Task 2 extended additively.
- **All 5 list-level Modals were swapped — none deferred.** PATTERNS.md cited "5 modals" with the content "Thêm thực đơn" called out as the case-a example. After re-reading the file, the 5 are: add-menu, template-apply, range-picker, range-shopping, and the four plan-row Modals (which are 4 nested Modals inside `ScheduledMealPlanRow`). All 9 are single-step pickers/confirmations and were swapped. None hit MOB-03's "multi-step / complex" exception.
- **ScheduledMealCookingModal and ScheduledMealSlotDetailModal NOT touched.** These are imported from sibling files (`./ScheduledMealCooking.widget`, `./ScheduledMealSlotDetail.modal`) and out of scope per the plan's `files_modified` contract. Their internal modal/sheet shape is left for future plans (likely the long-tail picker sweep follow-on if needed).
- **Worst-offender footer retuned to wizard idiom.** Replaced `Stack fullwidth justify="flex-end"` + default-size `Button` with `Stack direction="column" gap={8} fullwidth` + `Button type="primary" size="large" width 100% minHeight 44`. Matches `WizardIngredientStep.widget.tsx` lines 61-80 (the analog cited in PATTERNS.md) and `ShoppingListDetail.widget` completion-review CTA from 05-04.
- **Glossary compliance.** `rg 'Tạo mới|Thêm mới' src/Common/Copy/AppCopy.ts` returns 0. The existing user-authored "Tạo" verbs (templateCreateAction, rangeCreateAction, copyAction "Sao chép") use the canonical creation verb in domain context — preserved verbatim per migrate-only rule (rewording is 05-07).
- **Sheet body padding convention.** Each Sheet body wraps the hosted widget or content in `Box style={{ padding: 16 }}` (or directly on a Stack), matching the 05-04 ShoppingListDetail Sheet conversions. The pre-migration Modals relied on antd's default body padding; padding it explicitly inside the Sheet preserves visual spacing.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Diacritic normalization "Huỷ" -> "Hủy"**

- **Found during:** Task 1
- **Issue:** Three `cancelText="Huỷ"` props on this file used the precomposed "Huỷ" variant while the rest of the codebase (and `AppCopy.common.cancel`) uses "Hủy". Mixed-glyph rendering is a subtle correctness bug — same word, different code points, inconsistent across the app shell.
- **Fix:** Replaced all three `cancelText="Huỷ"` props by routing the cancel CTA through `AppCopy.common.cancel`. The Sheet conversions absorb the cancel handler into a body-CTA `Button onClick={...}>{AppCopy.common.cancel}</Button>`, so the antd `cancelText` prop is no longer present.
- **Files modified:** src/Modules/ScheduledMeal/Screens/ScheduledMealList.screen.tsx
- **Commit:** 7d8b6a3
- **Plan acknowledgement:** The plan called this normalization out explicitly under Task 1 read_first / artifacts; recording here for auditability.

No other deviations. The plan was executed exactly as written.

## Issues Encountered

None. Build green on both task commits with no new warnings introduced in either migrated file (the eslint warnings in the build output all originate in unrelated files: `ScheduledMealFinishFlow.modal`, `ScheduledMealSlotDetail.modal`, `SmartMealPlanner.screen`, `ShoppingListAdd.widget`, `ShoppingListEdit.widget` — pre-existing, out of scope per execute-plan boundary rule).

## User Setup Required

None — no external service configuration required.

## Verification

- `yarn build` green at both commit points (Task 1 `7d8b6a3`, Task 2 `142de64`).
- Acceptance grep on `ScheduledMealList.screen.tsx`:
  - `rg -n 'footer=\{null\}' src/Modules/ScheduledMeal/Screens/ScheduledMealList.screen.tsx` -> 0 matches.
  - `rg -n 'onOk=' src/Modules/ScheduledMeal/Screens/ScheduledMealList.screen.tsx` -> 0 matches.
  - `rg -n '<Modal\\b' src/Modules/ScheduledMeal/Screens/ScheduledMealList.screen.tsx` -> 0 matches (all swapped to Sheet).
  - All four diacritic passes (double-quote, single-quote, template-literal, JSX-text) -> 0 user-facing literals outside comments.
- Acceptance grep on `ScheduledMealAdd.widget.tsx`:
  - `rg -n 'justify="flex-end"' src/Modules/ScheduledMeal/Screens/ScheduledMealAdd.widget.tsx` -> 0 matches.
  - `rg -n 'size="large"' src/Modules/ScheduledMeal/Screens/ScheduledMealAdd.widget.tsx` -> 1 match (the new save footer CTA).
  - All four diacritic passes -> 0 user-facing literals outside comments.
- `rg -n 'Tạo mới|Thêm mới' src/Common/Copy/AppCopy.ts` -> 0 matches (glossary).

## Next Phase Readiness

- ScheduledMeal journey-adjacent surfaces are now copy-clean and Sheet-clean. `AppCopy.scheduledMeal` is the canonical namespace for any future ScheduledMeal screen work (`ScheduledMealEdit.widget`, `ScheduledMealEstimateSummary.widget`, `ScheduledMealMealPlanner.widget`, `LeftoverManagement.screen`, `MealSlotTimesModal`, `ScheduledMealCooking.widget`, `ScheduledMealSlotDetail.modal`, `PrepTasks.screen`, `MemberDishFeedbackHistory.widget`) — those files were not in this plan's scope but can extend the same namespace when their plans run (likely 05-06 Dishes/DishSuggester/Ingredient cluster + 05-07 reword pass).
- The "host an add-widget inside a Sheet via DeferredModalContent" pattern (Task 1's add-menu + range-shopping + plan-row edit Sheets) is the model for any future content-Modal swap that hosts a heavy form widget — wrap in Sheet, keep DeferredModalContent for lazy mount, pad the body with Box style padding 16, let the hosted widget own its own primary CTA.

---
*Phase: 05-mobile-tuning-copy-rollout*
*Completed: 2026-06-17*

## Self-Check: PASSED

- FOUND: src/Common/Copy/AppCopy.ts (scheduledMeal namespace seeded + extended)
- FOUND: src/Modules/ScheduledMeal/Screens/ScheduledMealList.screen.tsx (migrated)
- FOUND: src/Modules/ScheduledMeal/Screens/ScheduledMealAdd.widget.tsx (migrated)
- FOUND: commit 7d8b6a3 (Task 1)
- FOUND: commit 142de64 (Task 2)
- FOUND: .planning/phases/05-mobile-tuning-copy-rollout/05-05-SUMMARY.md
