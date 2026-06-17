---
phase: 05-mobile-tuning-copy-rollout
plan: 02
subsystem: ui
tags: [react, antd, bottom-sheet, mobile, mob-03, picker, confirmation]

# Dependency graph
requires:
  - phase: 02-shell-safety-extraction
    provides: "@components/Sheet (FastOverlay bottom-sheet with scroll-lock, Escape-close, auto-stacking z-index)"
provides:
  - "Long-tail single-step pickers/confirmations rendered via @components/Sheet (ShoppingList, ScheduledMeal, Dishes, Ingredient modules)"
  - "Auditable app-wide MOB-03 inventory disposition (every inventoried picker/confirmation file has a recorded per-file disposition)"
affects: [05-03, 05-04, 05-05, 05-06, 05-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Confirm Modal -> Sheet body with explicit primary/danger CTA stack (no onOk/footer slot)"
    - "Imperative modal.confirm -> useState(open) + declarative Sheet (D-06 case c state-lift)"
    - "Inline Popconfirm -> state-driven Sheet confirm for destructive batch actions"

key-files:
  created: []
  modified:
    - src/Modules/ShoppingList/Screens/ShoppingListExport.widget.tsx
    - src/Modules/ScheduledMeal/Screens/MealSlotTimesModal.tsx
    - src/Modules/ScheduledMeal/Screens/ScheduledMealToolkit.widget.tsx
    - src/Modules/ScheduledMeal/Screens/LeftoverManagement.screen.tsx
    - src/Modules/Dishes/Screens/DishesManageIngredient/DishDetail.widget.tsx
    - src/Modules/Dishes/Screens/DishesExport.widget.tsx
    - src/Modules/Dishes/Screens/FinishCooking.widget.tsx
    - src/Modules/Ingredient/Screens/IngredientInventory.widget.tsx

key-decisions:
  - "ShoppingListMealDetail.widget had no direct antd Modal/Popconfirm (only a child DishesReadonlyDetailModal component) — reclassified to no-op, nothing to convert"
  - "DishDetail cooking-session host Modal and FinishCooking imperative confirm left as-is (multi-step cooking flow) per D-06"
  - "Destructive confirms keep an explicit danger CTA inside the Sheet body (T-05-03 mitigation)"

patterns-established:
  - "Confirm-as-Sheet: render message + Stack justify=flex-end with secondary cancel + primary (danger) confirm Button replacing antd onOk/okButtonProps"
  - "Imperative confirm lift: replace modal.confirm/Popconfirm with a single useState target + a declarative Sheet"

requirements-completed: [MOB-03]

# Metrics
duration: 20min
completed: 2026-06-17
---

# Phase 5 Plan 02: Long-tail Picker/Confirmation Sheet Sweep Summary

**Swept the non-cluster long-tail single-step pickers/confirmations across ShoppingList, ScheduledMeal, Dishes, and Ingredient onto `@components/Sheet`, lifting two imperative/inline confirms to declarative Sheets, and recorded an auditable app-wide MOB-03 inventory disposition.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-06-17T00:11:00Z
- **Completed:** 2026-06-17T00:31:00Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- Converted 7 single-step content/picker/confirm surfaces to `<Sheet>` across the long-tail files (1 file was a no-op reclassification).
- Lifted one imperative `modal.confirm` (LeftoverManagement finish-confirm) and one inline `Popconfirm` (IngredientInventory discard-expired-batch) to declarative state-driven Sheets.
- Deliberately retained the multi-step cooking-flow modals (DishDetail cooking-session host, FinishCooking imperative duration confirm) with `// MOB-03` left-as-is annotations.
- Recorded the full app-wide MOB-03 inventory disposition so every inventoried file is accounted for (converted-by-plan or deferred-with-reason).

## Task Commits

Each task was committed atomically:

1. **Task 1: Convert ShoppingList/ScheduledMeal long-tail pickers to Sheet** - `9500f11` (feat)
2. **Task 2: Convert Dishes/Ingredient long-tail pickers to Sheet** - `91d236d` (feat)
3. **Task 3: Record full app-wide MOB-03 inventory disposition** - (this SUMMARY; documentation deliverable, committed with plan metadata)

## Files Created/Modified
- `src/Modules/ShoppingList/Screens/ShoppingListExport.widget.tsx` - Export content Modal -> Sheet; footer Copy/Download CTAs moved into the Sheet body.
- `src/Modules/ScheduledMeal/Screens/MealSlotTimesModal.tsx` - Meal-slot-times settings Modal -> Sheet; footer (reset/cancel/save) CTAs moved into the body.
- `src/Modules/ScheduledMeal/Screens/ScheduledMealToolkit.widget.tsx` - "Thêm lịch mua sắm" content Modal -> Sheet (FloatButton-anchored Popconfirm left as inline affordance — see disposition note).
- `src/Modules/ScheduledMeal/Screens/LeftoverManagement.screen.tsx` - Eat-part, discard (danger), and manual-add Modals -> Sheets; imperative finish-confirm `modal.confirm` lifted to a `finishItem` state + Sheet; removed now-unused `LEFTOVER_CONFIRM_Z_INDEX` and `useModal`.
- `src/Modules/Dishes/Screens/DishesManageIngredient/DishDetail.widget.tsx` - Nested dish-detail and shopping-list content Modals -> Sheets; cooking-session host Modal retained (multi-step) with annotation.
- `src/Modules/Dishes/Screens/DishesExport.widget.tsx` - Export content Modal -> Sheet; footer Copy/Download CTAs moved into the body.
- `src/Modules/Dishes/Screens/FinishCooking.widget.tsx` - Annotated the imperative duration-confirm as deliberately left-as-is (multi-step cooking flow, double-gated by an inner Popconfirm).
- `src/Modules/Ingredient/Screens/IngredientInventory.widget.tsx` - Inline "Bỏ lô hết hạn" Popconfirm lifted to a `discardBatchRow` state + danger confirm Sheet (satisfies the plan artifact: inventory picker hosted in `@components/Sheet`).

## MOB-03 Inventory Disposition

Authoritative source: `05-PATTERNS.md` "Picker/confirmation inventory (app-wide, D-06 broad sweep)". Every inventoried file has exactly one disposition below.

### Converted — this plan (05-02)

| File | Surface(s) converted | Notes |
|------|----------------------|-------|
| `ShoppingList/ShoppingListExport.widget` | Export content Modal | -> Sheet, CTAs in body |
| `ScheduledMeal/MealSlotTimesModal` | Settings Modal | -> Sheet, footer CTAs in body |
| `ScheduledMeal/ScheduledMealToolkit.widget` | "Thêm lịch mua sắm" content Modal | -> Sheet; inline FloatButton Popconfirm left as-is (anchored popover affordance, not a centered Modal) |
| `ScheduledMeal/LeftoverManagement.screen` | Eat-part, discard (danger), manual-add Modals + finish-confirm `modal.confirm` | 3 Modals -> Sheets, 1 imperative confirm lifted to state + Sheet |
| `Dishes/DishDetail.widget` | Nested dish-detail + shopping-list content Modals | -> Sheets; cooking-session host Modal retained (multi-step, annotated) |
| `Dishes/DishesExport.widget` | Export content Modal | -> Sheet, CTAs in body |
| `Ingredient/IngredientInventory.widget` | "Bỏ lô hết hạn" inline Popconfirm | lifted to state + danger Sheet |

### Reclassified — no convertible surface (left-as-is, recorded)

| File | Reason |
|------|--------|
| `ShoppingList/ShoppingListMealDetail.widget` | No direct antd `Modal`/`Popconfirm`/`modal.confirm`; the only modal is a child `DishesReadonlyDetailModal` component (out of this file's edit surface). Reclassified from "converted by 05-02" to no-op. |
| `Dishes/FinishCooking.widget` | Only picker surfaces are an imperative duration `modal.confirm` (entangled in the multi-step finish flow, double-gated by an inner Popconfirm) and that inner Popconfirm. Both left-as-is and annotated per D-06. Reclassified from "single-step portions converted" — no single-step standalone surface existed. |

### Converted — by named cluster plan (copy + sheet swap together)

| File | Owning plan |
|------|-------------|
| `ShoppingList.screen`, `ShoppingListDetail.widget` | 05-04 |
| `ScheduledMealList.screen` | 05-05 |
| `DishesList.screen`, `IngredientList.screen` | 05-06 |
| `DishSuggester.screen` | 05-06 |
| `SidebarDrawer.tsx` (PIN/backup Modals) | 05-03 |

### Deferred — complex multi-step flow (D-06 discretion)

| File | Reason |
|------|--------|
| `ScheduledMealFinishFlow.modal` | Multi-step finish flow, no single declarative Sheet equivalent |
| `CookingSession.widget` | Multi-step cooking session |
| `DishDetail.widget` cooking-session host Modal | Hosts the multi-step `CookingSessionWidget`; left-as-is + annotated (the file's other two Modals were converted) |
| `FinishCooking.widget` duration confirm | Imperative confirm entangled in the multi-step cooking finish flow; left-as-is + annotated |

### Deferred — out of phase scope (D-01 journey/high-traffic focus; D-06 subset discretion; lower-traffic long-tail)

| Module | Files |
|--------|-------|
| Home | `HouseholdHealth.widget`, `NutritionGoals.screen`, `Dashboard.screen`, `Templates.screen`, `HouseholdProfiles.screen`, `SyncBackupHealth.screen`, `NutritionCalculator.widget` |
| ScheduledMeal long-tail | `ScheduledMealCooking.widget`, `SmartPlannerTemplates.screen`, `ScheduledMealSlotDetail.modal`, `ScheduledMealEstimateSummary.widget`, `PrepTasks.screen`, `ScheduledMealScopePrompt.modal`, `SmartMealPlanner.screen` |
| Dishes long-tail | `DishesNutritionUsageModal.widget`, `DishStepList.widget`, `DishIngredientList.widget`, `CookingHistory.widget`, `DishesDetail.screen` |
| ShoppingList | `ShoppingListDetail.screen` (screen wrapper, distinct from the `.widget` converted in 05-04) |

These deferrals are scope/complexity statements, not difficulty judgments. The Home-module pickers are simple but lower-traffic and outside D-01's journey/high-traffic scope; D-06 explicitly permits a subset sweep with the remainder recorded. If a later phase widens the sweep, this disposition is the starting checklist.

## Decisions Made
- `ScheduledMealToolkit` FloatButton Popconfirm ("Bỏ chọn các thực đơn?") left as the inline anchored-popover affordance: it is attached to a floating action button, not a centered Modal, and converting it to a bottom sheet would be heavier than the inline confirm it replaces. The file's centered content Modal was the convertible surface and was swapped.
- Two inventory rows reclassified vs. the plan's reference table (`ShoppingListMealDetail.widget` -> no-op; `FinishCooking.widget` -> deferred multi-step) because the actual code had no standalone single-step surface there.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed now-unused `LEFTOVER_CONFIRM_Z_INDEX` and `useModal` import**
- **Found during:** Task 1 (LeftoverManagement.screen.tsx)
- **Issue:** After lifting the imperative `modal.confirm` to a Sheet, the `useModal` hook and the `LEFTOVER_CONFIRM_Z_INDEX` constant became unused — would surface as dead code / lint noise.
- **Fix:** Removed both; Sheet provides its own auto-stacking z-index so the explicit constant was redundant.
- **Files modified:** src/Modules/ScheduledMeal/Screens/LeftoverManagement.screen.tsx
- **Verification:** `yarn build` exit 0.
- **Committed in:** 9500f11 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking cleanup)
**Impact on plan:** Cleanup required by the imperative-confirm lift. Two inventory reclassifications recorded honestly in the disposition. No scope creep, no copy strings touched.

## Issues Encountered
- `DishDetail.widget.tsx` lives under `Dishes/Screens/DishesManageIngredient/` (not directly under `Dishes/Screens/` as the plan's files list implied). Located via `find` and edited at the correct path.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Long-tail picker/confirmation sweep complete; the disposition table is the checklist for any later broad sweep (cluster plans 05-03..05-07 own their own files).
- No copy strings were touched (`AppCopy.ts` untouched), so the cluster copy-migration plans run on a disjoint surface as designed.

## Self-Check: PASSED

- All 8 edited source files exist and 7 import `@components/Sheet` (FinishCooking.widget intentionally retains its imperative confirm — no Sheet, recorded as deferred).
- Task commits verified in git log: `9500f11` (Task 1), `91d236d` (Task 2).
- SUMMARY contains the "MOB-03 Inventory Disposition" section accounting for every inventoried file.

---
*Phase: 05-mobile-tuning-copy-rollout*
*Completed: 2026-06-17*
