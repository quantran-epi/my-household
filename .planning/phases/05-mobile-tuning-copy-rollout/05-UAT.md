---
status: complete
phase: 05-mobile-tuning-copy-rollout
source:
  - 05-01-SUMMARY.md
  - 05-02-SUMMARY.md
  - 05-03-SUMMARY.md
  - 05-04-SUMMARY.md
  - 05-05-SUMMARY.md
  - 05-06-SUMMARY.md
  - 05-07-SUMMARY.md
started: 2026-06-18T12:14:45Z
updated: 2026-06-18T14:42:46Z
---

## Current Test

[testing complete]

## Test 3 Flow Map

Rule of thumb: Phase 5 bottom sheets cover scoped single-step pickers, quick action panels, and confirmations. Centered modals remain expected for multi-step cooking/planning flows, heavy legacy editors, and lower-traffic surfaces outside the Phase 5 migration scope.

Expected bottom sheets in the Phase 5 review scope:

- Wizard: ingredient picker, preference picker when the tag list is large, and result-step "choose another day".
- Shell drawer: PIN unlock and backup/restore panels inside the drawer.
- Shopping list: export, detail meal view, completion review, bought-info view, template apply, reload confirmation, and delete confirmation.
- Scheduled meal: add menu, template apply, date-range picker, range-shopping picker, row edit/detail/copy/delete, meal-slot time settings, toolkit add-shopping panel, and leftover-management single-step actions.
- Dish suggester, dishes, ingredients: dish-suggester action panels, dishes export/delete confirmation, dish-detail include/shopping-list panels, ingredient list add/inventory/edit/nutrition/delete, and inventory discard-expired confirmation.

Expected remaining modals:

- Complex or multi-step flows such as cooking sessions, finish-cooking flows, smart-planner flows, the main DishSuggester host flow, scheduled-meal cooking/slot detail/scope prompts, and larger nutrition/template/home legacy editors.
- Legacy heavy editors outside the Phase 5 scope, including some shopping-list add/edit/calendar/add-more flows, dishes add/edit/duration/cooking/detail flows, and ingredient detail/stats/use-first flows.

## Tests

### 1. Phone-first guided journey feel
expected: |
  On a phone-sized screen, the meal-planning journey feels comfortable rather than cramped: one question is visible at a time, the progress/back controls are easy to tap, primary actions sit in a thumb-friendly area, and no copy or controls overlap.
result: pass
reported: "match except for the buttons bottom, they are stacked vertically, must be horizontal, align both side"
severity: cosmetic
resolved: "Wizard action pairs changed to horizontal side-by-side rows; user confirmed the fix with 'yes'."

### 2. Journey and empty-state copy
expected: |
  The wizard ingredient, preference, and result screens use friendly Vietnamese copy from AppCopy, including empty catalog and no-preference states that explain what happened and offer a clear next action instead of feeling blank or technical.
result: pass

### 3. Bottom-sheet picker and confirmation pattern
expected: |
  Pickers and single-step confirmations in the migrated surfaces open as bottom sheets with clear body text and large action buttons, not as cramped desktop-style centered modals.
result: pass
reported: "bottom sheet UI is good, but i still dont know which flow open botton sheet, which open modal?"
severity: minor
resolved: "Added a sheet-vs-modal flow map to this UAT file. User accepted the rule/map and will flag specific remaining modal flows later if needed."

### 4. Shell and navigation copy
expected: |
  The main shell, drawer, search/offline text, PIN gate, backup surfaces, and navigation labels read like household-facing Vietnamese, keep important routes reachable, and avoid English/admin-style jargon in normal use.
result: pass

### 5. Shopping list and scheduled meal high-traffic screens
expected: |
  Shopping list and scheduled meal screens have natural labels, clear row actions, understandable confirmation sheets, and primary actions that are easy to reach on a phone.
result: pass
reported: "yes, but increase ActionButton size a bit, its too small now"
severity: minor
resolved: "Shared ActionButton default increased from 28px to 32px; user confirmed with 'yes'."

### 6. Dish suggester, dishes, and ingredient screens
expected: |
  Dish suggester, dish list, and ingredient list screens use clear Vietnamese labels for filters/actions/statuses, keep add/delete flows touch-friendly, and show destructive actions in an explicit bottom-sheet confirmation.
result: pass
reported: "all bottom sheet action if has one button, stretch it fullwidth, if has 2+, align horizontal, align both side"
follow_up_reported: "no, whe bottom sheet is overflow now, redundant scroll"
latest_follow_up_reported: "no, the delete confirmation bottomsheet still overflow, the buttons overflow, redundant scroll"
severity: minor
resolved: "Delete confirmation sheets now remove duplicate inner padding, the sheet shell/body guard against horizontal overflow, and SheetActions clamps two-button rows inside the footer. User confirmed with: its ok now."

### 7. Native Vietnamese voice review
expected: |
  Across the migrated journey and high-traffic screens, wording feels familiar to a local Vietnamese household user, uses consistent terms for the same concept, and has no English or technical leftovers that make the app feel like an admin tool.
result: pass

## Summary

total: 7
passed: 7
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "On a phone-sized screen, the meal-planning journey feels comfortable rather than cramped: one question is visible at a time, the progress/back controls are easy to tap, primary actions sit in a thumb-friendly area, and no copy or controls overlap."
  status: fixed
  reason: "User reported: match except for the buttons bottom, they are stacked vertically, must be horizontal, align both side"
  severity: cosmetic
  test: 1
  root_cause: "Phase 5 touch-target polish used the full-width vertical CTA idiom for wizard action pairs, but the desired mobile layout is a horizontal footer row with one action aligned to each side."
  artifacts:
    - path: "src/Modules/MealPlanning/Screens/WizardIngredientStep.widget.tsx"
      issue: "Ingredient-step bottom actions were rendered as a vertical Stack with each button width 100%."
    - path: "src/Modules/MealPlanning/Screens/WizardPreferenceStep.widget.tsx"
      issue: "Preference-step bottom actions were rendered as a vertical Stack with each button width 100%."
    - path: "src/Modules/MealPlanning/Screens/WizardResult.widget.tsx"
      issue: "Result-row paired actions used the same vertical Stack pattern."
  missing:
    - "Render paired wizard actions in a horizontal flex row with side-by-side equal-width buttons."
    - "Keep >=44px touch targets and allow labels to wrap inside each half-width button."
  fixed_in:
    - "src/Modules/MealPlanning/Screens/WizardIngredientStep.widget.tsx"
    - "src/Modules/MealPlanning/Screens/WizardPreferenceStep.widget.tsx"
    - "src/Modules/MealPlanning/Screens/WizardResult.widget.tsx"
  verification:
    - "CI=true yarn test --watchAll=false --testPathPattern='Wizard.screen.test.tsx'"
    - "yarn build"
    - "yarn test:e2e tests/e2e/wizard-cold-start.spec.ts --reporter=line"
    - "Mobile viewport check at 390x844 confirmed same-row, side-by-side, >=44px buttons."
    - "User confirmed the visual fix with 'yes'."
  debug_session: ""

- truth: "Pickers and single-step confirmations in the migrated surfaces open as bottom sheets with clear body text and large action buttons, not as cramped desktop-style centered modals."
  status: fixed
  reason: "User reported: bottom sheet UI is good, but i still dont know which flow open botton sheet, which open modal?"
  severity: minor
  test: 3
  root_cause: "The UAT checkpoint described the bottom-sheet pattern but did not name the actual Phase 5 flows, while the app intentionally keeps some complex/out-of-scope flows as centered modals."
  artifacts:
    - path: ".planning/phases/05-mobile-tuning-copy-rollout/05-UAT.md"
      issue: "Test 3 lacked a concrete flow map for what should open as a bottom sheet versus a modal."
    - path: ".planning/phases/05-mobile-tuning-copy-rollout/05-PATTERNS.md"
      issue: "The implementation inventory exists in planning notes, but it was not surfaced in the conversational UAT checkpoint."
  missing:
    - "Add a Test 3 flow map covering expected bottom sheets and expected remaining modals."
  fixed_in:
    - ".planning/phases/05-mobile-tuning-copy-rollout/05-UAT.md"
  verification:
    - "Static scan of current Sheet/Modal hosts in src/Modules and src/Routing."
    - "Flow map added to the active Phase 5 UAT session."
    - "User accepted the flow map with: yes, if any modal need to be converted to bottom sheet, i will tell you later."
  debug_session: ""

- truth: "Shopping list and scheduled meal screens have natural labels, clear row actions, understandable confirmation sheets, and primary actions that are easy to reach on a phone."
  status: fixed
  reason: "User reported: yes, but increase ActionButton size a bit, its too small now"
  severity: minor
  test: 5
  root_cause: "The shared ActionButton default was still the older compact 28px/11px row-action size, so shopping-list and scheduled-meal action pills read too small after the Phase 5 mobile pass."
  artifacts:
    - path: "src/Components/Button/ActionButton.tsx"
      issue: "Default ActionButton height/font/padding were 28px/11px/9px, below the desired comfortable compact size for phone review."
  missing:
    - "Increase the shared default ActionButton visual size slightly while preserving explicit per-call-site sizes such as 44px back buttons."
  fixed_in:
    - "src/Components/Button/ActionButton.tsx"
  verification:
    - "CI=true yarn test --watchAll=false --testPathPattern='Wizard.screen.test.tsx'"
    - "yarn build"
    - "Browser check confirmed default ActionButton instances render at 32px height."
    - "User confirmed the adjusted size with 'yes'."
  debug_session: ""

- truth: "Dish suggester, dish list, and ingredient list screens use clear Vietnamese labels for filters/actions/statuses, keep add/delete flows touch-friendly, and show destructive actions in an explicit bottom-sheet confirmation."
  status: fixed
  reason: "User reported: all bottom sheet action if has one button, stretch it fullwidth, if has 2+, align horizontal, align both side; follow-up: no, whe bottom sheet is overflow now, redundant scroll"
  severity: minor
  test: 6
  root_cause: "Bottom-sheet action layouts were implemented per call site. Some sheets had the desired horizontal pair layout, but others still used ad hoc vertical/block button groups or raw one-off full-width styling. The first shared helper also allowed action labels to wrap and auto-grow button height, and several converted sheets still had modal-era inner maxHeight/overflowY wrappers, creating redundant nested scroll. Delete confirmation sheets then still carried modal-era inner padding inside an already padded Sheet body, while the Sheet body lacked an explicit horizontal-overflow guard; on narrow screens that made the confirmation content/footer feel squeezed and scroll-prone."
  artifacts:
    - path: "src/Components/Sheet/SheetActions.tsx"
      issue: "No shared bottom-sheet action footer primitive existed before this fix; first pass allowed auto-height wrapped labels and did not explicitly cap each button inside a two-button row."
    - path: "src/Components/FastOverlay/FastOverlay.tsx"
      issue: "Sheet shell/body did not explicitly set border-box sizing and horizontal overflow clipping."
    - path: "src/Modules/ShoppingList/Screens/ShoppingList.screen.tsx"
      issue: "Delete confirmation sheet had a duplicate padded Stack inside the already padded Sheet body."
    - path: "src/Modules/Dishes/Screens/DishesList.screen.tsx"
      issue: "Delete confirmation sheet had a duplicate padded Stack inside the already padded Sheet body."
    - path: "src/Modules/Ingredient/Screens/IngredientList.screen.tsx"
      issue: "Delete confirmation sheet had a duplicate padded Stack inside the already padded Sheet body."
    - path: "src/Modules/ScheduledMeal/Screens/ScheduledMealList.screen.tsx"
      issue: "Delete confirmation sheet had a duplicate padded Stack inside the already padded Sheet body."
    - path: "src/Components/GistBackupWidget.tsx"
      issue: "The nested backup sheet action buttons mixed block buttons and a raw Flex pair instead of the sheet action rule."
    - path: "src/Modules/ScheduledMeal/Screens/ScheduledMealAdd.widget.tsx"
      issue: "The add-scheduled-meal save action used one-off full-width styling instead of the shared bottom-sheet action rule."
    - path: "src/Modules/ShoppingList/Screens/ShoppingListExport.widget.tsx"
      issue: "Converted sheet content still had an inner maxHeight/overflowY preview wrapper."
    - path: "src/Modules/Dishes/Screens/DishesExport.widget.tsx"
      issue: "Converted sheet content still had an inner maxHeight/overflowY preview wrapper."
    - path: "src/Modules/ShoppingList/Screens/ShoppingListDetail.widget.tsx"
      issue: "Meal detail sheet still had a nested scroll wrapper inside the sheet body."
    - path: "src/Modules/ScheduledMeal/Screens/ScheduledMealList.screen.tsx"
      issue: "Scheduled-meal detail sheet still had a nested scroll wrapper inside the sheet body."
    - path: "src/Modules/*/Screens/*.tsx"
      issue: "Phase 5 bottom-sheet confirm/export/add/edit footers needed a shared one-button/full-width and multi-button/horizontal pattern."
  missing:
    - "Add a shared SheetActions helper for bottom-sheet footers."
    - "Use SheetActions for Phase 5 bottom-sheet single-action and multi-action footers, including nested widgets hosted inside sheets."
    - "Keep bottom-sheet action buttons fixed at 44px high so horizontal actions do not grow the footer and force extra scrolling."
    - "Clamp each two-button action to half of the action row and keep the action row non-wrapping."
    - "Remove modal-era nested maxHeight/overflowY wrappers from converted sheet content so the sheet body is the only scroll container."
    - "Remove duplicate inner padding from delete confirmation sheet content and let the Sheet body own spacing."
    - "Add box-sizing and horizontal overflow guardrails to the Sheet shell/body."
    - "Add focused tests proving one action stretches full width and multiple actions stay horizontal in a side-by-side row."
  fixed_in:
    - "src/Components/FastOverlay/FastOverlay.tsx"
    - "src/Components/Sheet/SheetActions.tsx"
    - "src/Components/Sheet/index.ts"
    - "src/Components/Sheet/Sheet.test.tsx"
    - "src/Components/GistBackupWidget.tsx"
    - "src/Routing/Shell/SidebarDrawer.tsx"
    - "src/Modules/MealPlanning/Screens/WizardResult.widget.tsx"
    - "src/Modules/ShoppingList/Screens/ShoppingList.screen.tsx"
    - "src/Modules/ShoppingList/Screens/ShoppingListDetail.widget.tsx"
    - "src/Modules/ShoppingList/Screens/ShoppingListAdd.widget.tsx"
    - "src/Modules/ShoppingList/Screens/ShoppingListAddMoreDishes.widget.tsx"
    - "src/Modules/ShoppingList/Screens/ShoppingListExport.widget.tsx"
    - "src/Modules/Dishes/Screens/DishesExport.widget.tsx"
    - "src/Modules/Dishes/Screens/DishesList.screen.tsx"
    - "src/Modules/Ingredient/Screens/IngredientAdd.widget.tsx"
    - "src/Modules/Ingredient/Screens/IngredientEdit.widget.tsx"
    - "src/Modules/Ingredient/Screens/IngredientInventory.widget.tsx"
    - "src/Modules/Ingredient/Screens/IngredientList.screen.tsx"
    - "src/Modules/DishSuggester/Screens/DishSuggester.screen.tsx"
    - "src/Modules/ScheduledMeal/Screens/ScheduledMealAdd.widget.tsx"
    - "src/Modules/ScheduledMeal/Screens/ScheduledMealEdit.widget.tsx"
    - "src/Modules/ScheduledMeal/Screens/ScheduledMealList.screen.tsx"
    - "src/Modules/ScheduledMeal/Screens/MealSlotTimesModal.tsx"
    - "src/Modules/ScheduledMeal/Screens/LeftoverManagement.screen.tsx"
  verification:
    - "CI=true yarn test --watchAll=false --testPathPattern='Sheet.test.tsx'"
    - "CI=true yarn test --watchAll=false --testPathPattern='Wizard.screen.test.tsx'"
    - "rm -rf node_modules/.cache && yarn build"
    - "yarn build"
    - "yarn test:e2e tests/e2e/dish-suggester.spec.ts --reporter=line"
    - "Browser measurement at 360x740 for shopping-list, dish, and ingredient delete confirmation sheets confirmed no sheet/body horizontal overflow, no body vertical overflow, and two horizontal 44px buttons inside the action row."
    - "Browser measurement at 320x640 for shopping-list, dish, and ingredient delete confirmation sheets confirmed sheetScrollWidth == sheetClientWidth, bodyScrollWidth == bodyClientWidth, bodyScrollHeight == bodyClientHeight, and two horizontal 140x44 buttons inside the action row."
    - "User confirmed the delete confirmation bottom-sheet overflow fix with: its ok now."
    - "Browser measurement at 390x844 on sidebar PIN sheet confirmed bodyScrollHeight == bodyClientHeight and fixed 44px full-width action button."
    - "Static scan of adjusted converted sheet files confirmed the old maxHeight/overflowY wrappers were removed."
    - "Combined shopping-list e2e was attempted; failures were in pre-existing row-editor/copy selectors, not the sheet-scroll layout path."
    - "Static scan of Sheet call sites confirmed footer action groups use SheetActions; remaining unwrapped sheets are content-only or host nested widgets whose footers now use SheetActions."
  debug_session: ""
