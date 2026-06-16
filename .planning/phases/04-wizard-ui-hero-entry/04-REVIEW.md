---
phase: 04-wizard-ui-hero-entry
reviewed: 2026-06-16T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - src/Modules/MealPlanning/Screens/WizardResult.widget.tsx
  - src/Modules/MealPlanning/Screens/Wizard.screen.tsx
  - src/Modules/MealPlanning/Screens/Wizard.screen.test.tsx
findings:
  critical: 0
  warning: 2
  info: 3
  total: 5
status: issues_found
---

# Phase 04: Code Review Report (gap-closure 04-06)

**Reviewed:** 2026-06-16
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

This review covers the phase-04 gap-closure changes: the wizard finish control (`wizard-finish`), the re-entry reset after completion, and the result-row button-overflow fix. Both of the prior review's top items are now addressed in these files. The former CR-01 (cosmetic step clamp) is resolved — `Wizard.screen.tsx` now renders the body off the clamped `currentStep` (lines 34-36, 56-58) rather than the raw persisted `step`, so an unknown/tampered or not-yet-built (`servings`/`time`) key falls back to the ingredients step instead of a blank dead-end. The former WR-01 (no restart on re-entry) is resolved — a mount-time `useEffect` dispatches `restartWizard()` when `status === 'completed'` (lines 26-29), and a new test asserts the behavior.

The button-overflow fix is sound: `ResultRow` now stacks the two actions in a vertical `Stack` with `width: "100%"` (WizardResult.widget.tsx:56-71), which removes the horizontal overflow on phone widths. `DishScorer.score(dishes, ids, dishes)` matches the verified signature `score(dishes, selectedIngredientIds, allDishes)` and `restartWizard`/`completeWizard` behave as the screen assumes.

Remaining findings are a one-frame flash of the stale completed result on re-entry (the reset runs after paint) and a test-coverage gap for the new finish control. No blockers, security issues, or data-loss risks found in the reviewed files.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: Re-entry reset runs after paint — stale completed result flashes for one frame

**File:** `src/Modules/MealPlanning/Screens/Wizard.screen.tsx:26-36, 56-58`
**Issue:** The restart is wired through `useEffect`, which fires after React commits and paints. On re-entry with a persisted `status === 'completed'` and `step === 'result'`, the first render computes `idx = 2`, `currentStep = 'result'`, and paints `<WizardResult />` with the stale prior answers (the previously added/scored dishes, or the empty-catalog screen). The effect then dispatches `restartWizard()`, flipping to the ingredients step on the next render. The result is a visible flash of the old result screen before the fresh start. The jsdom test cannot observe this because React Testing Library flushes effects synchronously inside `act`, so the regression is uncovered by `Wizard.screen.test.tsx`. (The empty `[]` deps with the eslint-disable is correct here — adding `status` would cause the effect to re-fire and wipe answers the moment `addDishToDay` sets `completed` mid-session, so the deps choice should be kept.)
**Fix:** Run the reset before paint so the result screen is never committed on re-entry. Use `useLayoutEffect` instead of `useEffect`:

```tsx
import React, { useLayoutEffect } from "react";
// ...
useLayoutEffect(() => {
    if (status === 'completed') dispatch(restartWizard());
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

Alternatively, treat a `completed` status as the ingredients step during render (e.g. compute `currentStep` as the first step when `status === 'completed'`) so the body never keys off the stale `result`.

### WR-02: New finish control and finish→navigate flow are untested

**File:** `src/Modules/MealPlanning/Screens/Wizard.screen.test.tsx:80-87`, `src/Modules/MealPlanning/Screens/WizardResult.widget.tsx:185-195`
**Issue:** The gap-closure added the `wizard-finish` ("Xong") button, which dispatches `completeWizard()` and navigates to `RootRoutes.AuthorizedRoutes.Root()`. The result-step test only asserts that `wizard-step-result` renders; there is no test that the finish button exists, dispatches `completeWizard` (status → `completed`), or triggers navigation. Given that the re-entry reset (WR-01 / the new restart test) depends on the wizard actually reaching `completed`, the finish path is the primary way a user marks completion and is currently unverified. A future change that drops the button or its dispatch would pass CI.
**Fix:** Add a test on the result step: render with a dish + `advanceWizardStep('result')`, click `wizard-finish`, and assert `store.getState().personal.wizard.status === 'completed'`. To assert navigation, render with a spy/location probe (e.g. a `useLocation` reader or a mocked `useNavigate`) and verify the redirect to the root route.

## Info

### IN-01: Redundant guard in `hasMatches`

**File:** `src/Modules/MealPlanning/Screens/WizardResult.widget.tsx:154`
**Issue:** `const hasMatches = ids.length > 0 && scored.length > 0;` — `DishScorer.score` returns `[]` when `selectedIngredientIds.length === 0` (DishScorer.ts:276), so `scored.length > 0` already implies `ids.length > 0`. The first clause is dead.
**Fix:** Simplify to `const hasMatches = scored.length > 0;` (optional; harmless as-is).

### IN-02: Title/label row has no shrink guard for long dish names

**File:** `src/Modules/MealPlanning/Screens/WizardResult.widget.tsx:45-52`
**Issue:** The header `Stack justify="space-between"` places the dish title and the match label side by side. A long dish name with a present `meta.label` can squeeze the label without a `flex-shrink`/`min-width` constraint. The action buttons (the in-scope overflow fix) are unaffected since they now stack vertically.
**Fix:** None required for this phase; if header overflow appears on narrow widths, allow the title to truncate (`minWidth: 0` + ellipsis) so the label stays readable.

### IN-03: Magic number `5` duplicated for the result cap

**File:** `src/Modules/MealPlanning/Screens/WizardResult.widget.tsx:161, 175`
**Issue:** Both the matched branch (`scored.slice(0, 5)`) and the fallback branch (`dishes.slice(0, 5)`) hardcode the cap of 5. Duplicated literal; a future change to the cap must be made in two places.
**Fix:** Extract a `const MAX_RESULTS = 5;` and reuse in both branches.

---

_Reviewed: 2026-06-16_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
