---
phase: 06-differentiator-enhancements
reviewed: 2026-06-19T00:00:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - src/Common/Copy/AppCopy.ts
  - src/Components/FastOverlay/FastOverlay.tsx
  - src/Components/Sheet/index.ts
  - src/Modules/DishSuggester/Helpers/DishScorer.test.ts
  - src/Modules/DishSuggester/Helpers/DishScorer.ts
  - src/Modules/MealPlanning/Screens/Wizard.screen.tsx
  - src/Modules/MealPlanning/Screens/WizardResult.widget.tsx
  - src/Modules/MealPlanning/Screens/WizardServingsStep.widget.tsx
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 06: Code Review Report

**Reviewed:** 2026-06-19T00:00:00Z
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

Reviewed the two gap-closure changes: the DishScorer cook-now grouping fix (06-04) and the wizard UI gap closure plus the new `SheetActions` component (06-05). No security vulnerabilities, crashes, or data-loss defects found. Cross-module references all resolve (`selectHouseholdHealthProfiles`, `HouseholdHealthStatusTag`, `useModal`, `Radio`, the `Sheet/index.ts` re-export), and member fields read by the new servings-step description are guaranteed non-null by `normalizeHouseholdMemberProfile`, so the direct `.length` accesses are safe.

The findings are correctness-of-intent and consistency issues rather than hard bugs: the `groupCookNow` bucket metadata no longer matches the new bucketing logic, the "new list" target mode silently drops ingredients that were in the old list, and the `baseReady` "Nấu ngay" label can overstate readiness at higher serving counts. The rest are minor quality items.

## Warnings

### WR-01: `groupCookNow` bucket metadata (minScore/maxScore) no longer matches the bucketing logic

**File:** `src/Modules/DishSuggester/Helpers/DishScorer.ts:406-424`
**Issue:** The bucketing logic was rewritten to route dishes by `baseReady` / `missingIngredientIds.length` (`>= baseReady` to "Nấu ngay", `<= 2 missing` to "Cần mua thêm ít", else "Dự phòng"). But the group descriptor objects still advertise score ranges that the code no longer enforces:
```ts
{ label: "Nấu ngay", minScore: 0.75, maxScore: 1, ... }
{ label: "Cần mua thêm ít", minScore: 0.5, maxScore: 0.75, ... }
{ label: "Dự phòng", minScore: 0, maxScore: 0.5, ... }
```
A `baseReady` dish with a composite `cookNowScore` of 0.3 now lands in the "Nấu ngay" bucket whose `minScore` claims 0.75. Any consumer that trusts `minScore`/`maxScore` (e.g. for filtering, tooltips, or analytics) will be misled. The fields are now decorative and contradict the actual contents.
**Fix:** Either drop `minScore`/`maxScore` from the cook-now groups (they are not used for routing anymore), or recompute them from the dishes actually placed in each bucket. For example:
```ts
return groups
    .filter(group => group.dishes.length > 0)
    .map(group => {
        const scores = group.dishes.map(d => d.cookNowScore ?? d.score);
        return { ...group, minScore: Math.min(...scores), maxScore: Math.max(...scores) };
    });
```

### WR-02: Switching to "Tạo danh sách mới" silently excludes ingredients that were in the open list

**File:** `src/Modules/MealPlanning/Screens/WizardResult.widget.tsx:316-322, 282-289, 608-640`
**Issue:** `openMissingSheet` seeds `selectedMissingIds` by diffing against the open list (`rows.filter(row => !row.alreadyAdded)`), so any missing ingredient that already exists in the open list is left out of the selection. When the user then switches `missingTargetMode` to `'new'`, `missingRows` recomputes against `undefined`, so `alreadyAdded` becomes `false` for every row — but those previously-excluded ingredients are still absent from `selectedMissingIds`, so their checkboxes render unchecked. The net effect: choosing "create a new list" produces a new list that is missing the very ingredients the user expected a fresh list to contain, with no indication why they are unchecked.
**Fix:** Re-seed the selection when the target mode changes so a fresh list pre-selects all missing ingredients. For example, in the `onChange` handler (or an effect keyed on `missingTargetMode`/`missingTarget`):
```ts
const onTargetModeChange = (mode: 'existing' | 'new') => {
    setMissingTargetMode(mode);
    const list = mode === 'existing' ? activeShoppingList : undefined;
    const rows = buildMissingRows(missingTarget!.item, ingredients, list);
    setSelectedMissingIds(rows.filter(r => !r.alreadyAdded).map(r => r.ingredientId));
};
```

### WR-03: `baseReady` routes dishes to "Nấu ngay" even when stock is short for the requested serving count

**File:** `src/Modules/DishSuggester/Helpers/DishScorer.ts:179-184, 414-417`
**Issue:** `baseReady` is computed against the UNscaled base recipe, while `missingIngredientIds` reflects the serving-scaled requirement. A dish where stock covers the base recipe (2 servings) but not the user's selected 4 servings will have `baseReady === true` and a non-empty `missingIngredientIds`, yet it is placed in the "Nấu ngay" (cook now) bucket. The user picked a higher serving count in the servings step, so labeling the dish as immediately cookable overstates readiness — they cannot actually cook the requested portions with current stock. This is the documented intent, but it is worth confirming it is the desired UX, because the result row will still show a "Thiếu N" availability label (`scoredMeta`), producing a dish that is simultaneously grouped as "Nấu ngay" and badged as missing ingredients.
**Fix:** If the intent is "you can cook a smaller batch right now," consider surfacing that nuance in the row (e.g. a "đủ cho khẩu phần gốc" hint) so the "Nấu ngay" grouping and the "Thiếu N" badge do not appear contradictory. If full-serving readiness is required for "Nấu ngay", gate the bucket on `missingIngredientIds.length === 0` rather than `baseReady`.

## Info

### IN-01: Orphaned copy key `missingTargetList`

**File:** `src/Common/Copy/AppCopy.ts:96`
**Issue:** `missingTargetList` was the only consumer's string for the old "Thêm vào: {name}" label in `WizardResult.widget.tsx`. The 06-05 change replaced that call site with `missingTargetExistingOption`, leaving `missingTargetList` with no remaining references in `src/`. Dead copy entry.
**Fix:** Remove `missingTargetList` from `AppCopy.wizard`, or repurpose it if a future call site is planned.

### IN-02: `SheetActions` uses the array index as the React key for conditionally-rendered children

**File:** `src/Components/FastOverlay/FastOverlay.tsx:412-427`
**Issue:** Children are cloned with `key={index}`. In the inline add/undo panel (`WizardResult.widget.tsx:169-187`) the undo `Button` is conditionally rendered, so the surviving "manage" button shifts between index 0 and index 1 as the undo button appears/disappears. The key change forces React to unmount/remount the manage button. The buttons are stateless, so the impact is cosmetic (possible flicker / lost focus), but index keys over a variable-length filtered list are an anti-pattern.
**Fix:** Preserve the keys that `React.Children.toArray` already assigns instead of overriding with the index, or derive a stable key from the child:
```ts
return React.cloneElement(child as React.ReactElement, {
    key: child.key ?? index,
    style: { flex: "1 1 0", minWidth: 0, ...childStyle },
});
```

### IN-03: Radio `onChange` value assigned to a union without validation

**File:** `src/Modules/MealPlanning/Screens/WizardResult.widget.tsx:581`
**Issue:** `onChange={event => setMissingTargetMode(event.target.value)}` — antd's `RadioChangeEvent.target.value` is typed `any`, so an unexpected value would be accepted into the `'existing' | 'new'` state with no compile-time guard. In practice only the two declared `Radio` values can fire, so the risk is theoretical.
**Fix (optional):** Narrow explicitly: `onChange={event => setMissingTargetMode(event.target.value === 'new' ? 'new' : 'existing')}`.

---

_Reviewed: 2026-06-19T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
