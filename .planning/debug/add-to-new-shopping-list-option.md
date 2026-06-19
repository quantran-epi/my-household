---
status: diagnosed
trigger: "add-to-new-shopping-list-option: user wants explicit option to add missing ingredients to a BRAND-NEW shopping list even when an open list already exists"
created: 2026-06-19T00:00:00Z
updated: 2026-06-19T00:00:00Z
---

## Current Focus

hypothesis: The missing-ingredient Sheet has no UI affordance to choose a target list; confirmAddMissingIngredients unconditionally targets the latest incomplete list and only creates a new list when none exists.
test: Read WizardResult.widget.tsx Sheet body + confirmAddMissingIngredients, and ShoppingListReducer addShoppingList/addIngredientGroupsToShoppingList.
expecting: No branch keyed on a user choice; reducer already supports create+append.
next_action: Return ROOT CAUSE FOUND (diagnose-only mode).

## Symptoms

expected: In the "Thêm vào Đi chợ" sheet, the user can choose between adding to the existing open shopping list OR creating a brand-new shopping list, regardless of whether an incomplete list already exists.
actual: The flow auto-targets the latest incomplete list; it only creates a new list when no incomplete list exists. No user option to force a new list.
errors: None.
reproduction: Test 6 in 06-UAT.md — result card with missing ingredients, open "Thêm vào Đi chợ" while an incomplete list exists.
started: Discovered during Phase 6 UAT (feature shipped in plan 06-03).

## Eliminated

- hypothesis: The reducer cannot create a new list and append in one flow.
  evidence: confirmAddMissingIngredients already does addShoppingList then addIngredientGroupsToShoppingList in the no-active-list branch. Capability exists; only the UI choice is missing.
  timestamp: 2026-06-19T00:00:00Z

## Evidence

- timestamp: 2026-06-19T00:00:00Z
  checked: WizardResult.widget.tsx confirmAddMissingIngredients (lines 322-371)
  found: targetList = getLatestIncompleteShoppingList(...); shoppingList = targetList ?? {new list}; addShoppingList dispatched only when !targetList.
  implication: Target list is decided solely by existence of an incomplete list. No user input feeds this decision.

- timestamp: 2026-06-19T00:00:00Z
  checked: WizardResult.widget.tsx Sheet body (lines 564-575)
  found: When activeShoppingList exists -> static label missingTargetList; else -> create-list name Input. Mutually exclusive on existence, not on user choice.
  implication: UI never offers "create new" when an active list is present.

- timestamp: 2026-06-19T00:00:00Z
  checked: ShoppingListReducer.ts addShoppingList (line 125) + addIngredientGroupsToShoppingList (lines 300-336)
  found: add pushes a ShoppingList; addIngredientGroupsToShoppingList appends groups to a list by id with duplicate + completed-list guards.
  implication: Backend supports create-then-append already; gap is purely UI affordance + wiring in confirmAddMissingIngredients.

- timestamp: 2026-06-19T00:00:00Z
  checked: 06-UI-SPEC.md Interaction Contract
  found: "One sheet action stretches full width; two sheet actions sit horizontally." Current SheetActions has Cancel + primary (two).
  implication: Add the choice inside the sheet body (toggle/radio), not as a third SheetAction.

## Resolution

root_cause: The missing-ingredient flow lacks a user-facing target-list selector. confirmAddMissingIngredients derives the target purely from getLatestIncompleteShoppingList existence, and the Sheet only shows a create-list input when NO incomplete list exists. There is no state or control letting the user opt to create a new list when one is already open.
fix: (not applied - diagnose only)
verification: (n/a)
files_changed: []
