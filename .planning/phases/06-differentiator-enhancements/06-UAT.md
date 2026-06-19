---
status: diagnosed
phase: 06-differentiator-enhancements
source:
  - 06-01-SUMMARY.md
  - 06-02-SUMMARY.md
  - 06-03-SUMMARY.md
started: 2026-06-19T00:00:00Z
updated: 2026-06-19T00:30:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Portions / Member Selection Step
expected: After picking ingredients and before preferences, a new step "Nhà mình có ai ăn bữa này?" appears. Household members are selectable if they exist; otherwise a +/- serving-count stepper shows with large tap targets. The step is skippable ("Tùy bạn").
result: issue
reported: "pass but the layout of member not good, i want each member selection is a card, stretch full width, consist of member name, member status and short description"
severity: cosmetic

### 2. Remembered Defaults, Start Fresh, Clear Defaults
expected: On a repeat wizard run a subtle hint "Đang dùng lựa chọn lần trước" appears with your previous answers prefilled. You can "Chọn lại từ đầu" to reset the current run, or "Xóa lựa chọn đã nhớ" to clear remembered defaults. Clearing asks for confirmation — nothing is deleted silently.
result: issue
reported: "clearing not ask for confirm, and the layout of subtle hint and the 2 buttons is condensed, the title should above and two button below"
severity: major

### 3. Cook-Now Toggle on Preferences
expected: On the preference step there is an optional toggle "Ưu tiên nấu được ngay". It is off by default and can be turned on without blocking the flow.
result: pass

### 4. Cook-Now Result Grouping
expected: With cook-now enabled and inventory data present, results group into "Nấu ngay", "Cần mua thêm ít", and "Dự phòng". The flow never dead-ends on an empty ready group. With weak/empty inventory you see the hint "Kho chưa đủ rõ, mình vẫn xếp món theo nguyên liệu bạn chọn." and results still appear (fallback to chosen ingredients).
result: issue
reported: "only \"need buy a bit\" section show up"
severity: major

### 5. Result Card Reason + Detail Sheet
expected: Each result card shows a one-line natural household reason. Tapping the small question-mark icon opens a sheet "Vì sao gợi ý món này?" explaining matched ingredients, missing ingredients, preference fit, and household fit — in plain language with no raw score numbers.
result: pass

### 6. Add Missing Ingredients to Đi chợ Inline
expected: Result cards with missing ingredients show "Thêm vào Đi chợ". Tapping opens a sheet with the missing rows preselected; items already on the active list are disabled as already added. Adding keeps you on the result page and shows inline success with manage and undo actions. If no incomplete shopping list exists, it creates "Đi chợ hôm nay" in place.
result: issue
reported: "pass. but need option to add to a brand new shopping list if user dont want to add to existing open shopping list"
severity: minor

## Summary

total: 6
passed: 2
issues: 4
pending: 0
skipped: 0

## Gaps

- truth: "Member selection on the portions step is presented in a usable, clear layout."
  status: failed
  reason: "User reported: pass but the layout of member not good, i want each member selection is a card, stretch full width, consist of member name, member status and short description"
  severity: cosmetic
  test: 1
  root_cause: "WizardServingsStep renders each member as a thin single-line <button> showing only member.name + check icon. No status/description rendered. status is not on HouseholdMemberProfile — it lives in HouseholdMemberHealthProfile.status (HouseholdHealthReducer), and there is no description field (compose from notes or the 'X thích · Y tránh · Z chặn' preference summary). A full-width member-card pattern already exists in HouseholdProfiles.screen.tsx (avatar + name + summary + HouseholdHealthStatusTag)."
  artifacts:
    - path: "src/Modules/MealPlanning/Screens/WizardServingsStep.widget.tsx"
      issue: "Member rendered as single-line name button; status/description not wired"
    - path: "src/Store/Selectors.ts"
      issue: "selectHouseholdHealthProfiles / selectMemberHealthProfile available to source status"
    - path: "src/Modules/Home/Screens/HouseholdHealth.widget.tsx"
      issue: "Reusable HouseholdHealthStatusTag for the status pill"
  missing:
    - "Replace single-line member button with full-width card (column layout, md padding, accent #7436dc selected state, >=44px tap target)"
    - "Render name + status (via HouseholdHealthStatusTag fed from health-profile map, default 'neutral') + short description (notes or preference summary)"
    - "Add any new visible strings to AppCopy.wizard"
  debug_session: .planning/debug/member-selection-layout.md

- truth: "Clearing remembered defaults asks for confirmation (no silent deletion), and the remembered-defaults hint with its two actions is laid out clearly."
  status: failed
  reason: "User reported: clearing not ask for confirm, and the layout of subtle hint and the 2 buttons is condensed, the title should above and two button below"
  severity: major
  test: 2
  root_cause: "Two issues in the remembered-defaults hint block of Wizard.screen.tsx (06-01). (1) Clear button wires onClick directly to dispatch(clearWizardDefaults()) — no confirmation gate, violating UI-SPEC 'Destructive confirmation / no silent deletion'. (2) Hint container Box uses single-row flex (justifyContent: space-between) forcing title + both buttons onto one line. A reusable confirm pattern exists via useModal().confirm (see DishesDetail.screen.tsx). AppCopy.wizard lacks confirm title/body keys."
  artifacts:
    - path: "src/Modules/MealPlanning/Screens/Wizard.screen.tsx"
      issue: "Clear button dispatches without confirm; hint Box is row flex (cramped)"
    - path: "src/Common/Copy/AppCopy.ts"
      issue: "Missing destructive-confirm title/body copy keys in wizard block"
  missing:
    - "Gate clear-defaults behind useModal().confirm with danger okButton, okText=clearDefaultsAction, cancel text, onOk dispatches clearWizardDefaults"
    - "Add AppCopy.wizard confirm title + body keys"
    - "Change hint Box to flexDirection column, alignItems flex-start, drop space-between so title sits above the two-button row (gap 8 / sm token)"
  debug_session: .planning/debug/clear-defaults-confirm-and-layout.md

- truth: "With cook-now enabled and inventory present, results show all three groups (Nấu ngay, Cần mua thêm ít, Dự phòng) as appropriate, never collapsing to a single group."
  status: failed
  reason: "User reported: only \"need buy a bit\" section show up"
  severity: major
  test: 4
  root_cause: "Bug is in DishScorer, not the render layer. (1) 'Nấu ngay' (group 0) is gated on missingIngredientIds.length === 0, but scoreCookNow scales required amounts by servingCount/baseServings (baseServings defaults 2). With servingCount > 2 (normal household), scaled requirements exceed stock so missing is never 0 — group 0 stays empty. scoreWithInventory/group do NOT apply this scaling, which is why standard grouping shows a ready group but cook-now never does. (2) 'Dự phòng' (group 2) rarely populates because the middle-bucket condition includes '|| cookNowScore >= 0.58' and cookNowScore carries a ~0.5+ fixed baseline from speed/preference/nutrition/budget weights, so low-readiness dishes still clear it; only dishes with >3 missing fall to backup. Unit test masks this by feeding synthetic score/missing values instead of running the real scoreCookNow→groupCookNow pipeline."
  artifacts:
    - path: "src/Modules/DishSuggester/Helpers/DishScorer.ts"
      issue: "groupCookNow requires missing===0 against serving-scaled amounts (group 0 never fills); middle/backup split leans on high-baseline cookNowScore >= 0.58"
    - path: "src/Modules/DishSuggester/Helpers/DishScorer.test.ts"
      issue: "Test uses synthetic inputs, never exercises real scaling pipeline — masks the bug"
  missing:
    - "Decouple 'Nấu ngay' readiness from serving-scaled amounts (base zero-missing on unscaled requirements or allow a small shortfall tolerance)"
    - "Re-tune middle/backup boundary so cookNowScore baseline doesn't swallow low-readiness dishes (drop '|| cookNowScore >= 0.58' or split on inventory readiness instead of composite score)"
    - "Add a test running real scoreCookNow→groupCookNow with servingCount > baseServings to pin the three-bucket distribution"
  debug_session: .planning/debug/cook-now-single-group.md

- truth: "When adding missing ingredients, the user can choose to add them to a brand-new shopping list instead of being forced into the existing open list."
  status: failed
  reason: "User reported: pass. but need option to add to a brand new shopping list if user dont want to add to existing open shopping list"
  severity: minor
  test: 6
  root_cause: "Missing UI affordance, not a defect. confirmAddMissingIngredients derives targetList purely from getLatestIncompleteShoppingList existence and only dispatches addShoppingList in the !targetList branch; the Sheet body shows a static 'adding to {name}' label when an active list exists and only reveals the create-list Input when none exists. Reducer already supports create-then-append (addShoppingList + addIngredientGroupsToShoppingList), so the gap is purely UI wiring."
  artifacts:
    - path: "src/Modules/MealPlanning/Screens/WizardResult.widget.tsx"
      issue: "Target list chosen by existence, not user input; create-list Input unreachable while an open list exists"
    - path: "src/Common/Copy/AppCopy.ts"
      issue: "Needs selector option labels (add-to-existing / create-new)"
  missing:
    - "Add missingTargetMode state ('existing' | 'new'), default 'existing' when active list exists else 'new'"
    - "In Sheet body, when an open list exists render a selector (Radio/Segmented) for 'Thêm vào {name}' vs 'Tạo danh sách mới', revealing the name Input on 'new'"
    - "Branch confirmAddMissingIngredients on chosen mode (force addShoppingList + append on 'new'); key footer label off mode; reset mode in openMissingSheet"
  debug_session: .planning/debug/add-to-new-shopping-list-option.md


