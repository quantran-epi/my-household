---
phase: 04-wizard-ui-hero-entry
reviewed: 2026-06-16T06:35:41Z
depth: standard
files_reviewed: 16
files_reviewed_list:
  - src/Modules/Home/Screens/Dashboard.screen.tsx
  - src/Modules/MealPlanning/Components/WizardProgress.tsx
  - src/Modules/MealPlanning/Routing/MealPlanningRouteConfig.ts
  - src/Modules/MealPlanning/Routing/MealPlanningRouter.tsx
  - src/Modules/MealPlanning/Screens/Wizard.screen.test.tsx
  - src/Modules/MealPlanning/Screens/Wizard.screen.tsx
  - src/Modules/MealPlanning/Screens/WizardIngredientStep.widget.tsx
  - src/Modules/MealPlanning/Screens/WizardPreferenceStep.widget.tsx
  - src/Modules/MealPlanning/Screens/WizardResult.widget.tsx
  - src/Routing/RootRouter.tsx
  - src/Routing/RootRoutes.ts
  - src/Routing/Shell/BottomTabNavigator.tsx
  - tests/e2e/dish-suggester.spec.ts
  - tests/e2e/fixtures/seedApp.ts
  - tests/e2e/wizard-cold-start.spec.ts
findings:
  critical: 1
  warning: 4
  info: 2
  total: 7
status: issues_found
---

# Phase 04: Code Review Report

**Reviewed:** 2026-06-16T06:35:41Z
**Depth:** standard
**Files Reviewed:** 16
**Status:** issues_found

## Summary

The wizard entry flow (hero "Hôm nay ăn gì?" button + repointed center tab → `/meal-planning/wizard`) is wired correctly, and the happy-path E2E coverage matches the rendered test IDs. The step machine, scorer integration, and empty-catalog routing behave as intended on the documented paths.

The most serious issue is a non-functional safety clamp in `Wizard.screen.tsx`: the code comment explicitly claims it protects against a tampered/unknown persisted step (threat T-04-06) by falling back to the first step, but the guard only adjusts the progress-bar index — the actual step rendering still keys off the raw `step` value, so a corrupted or future (`servings`/`time`) step key renders a blank screen with no back button and no way to advance. That is a dead-end, which directly contradicts the phase's "never a dead-end" requirement. Secondary findings cover a missing wizard restart on re-entry (returning users land mid/end-flow), duplicated back affordances, and keyboard-inaccessible clickable `<div>`s.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Step clamp is cosmetic only — unknown/tampered step renders a blank dead-end

**File:** `src/Modules/MealPlanning/Screens/Wizard.screen.tsx:19-45`
**Issue:** The comment at lines 20-21 states the code clamps unknown/tampered persisted step keys to the first step "rather than rendering nothing (threat T-04-06)." But the clamp only applies to `idx` (used for the progress bar and the back-button condition). The actual step body is rendered by matching the raw `step` value:

```tsx
const idx = Math.max(0, WIZARD_STEPS.indexOf(step)); // -1 -> 0 (progress only)
...
{step === 'ingredients' && <WizardIngredientStep onNext={goNext} />}
{step === 'preferences' && <WizardPreferenceStep onNext={goNext} onBack={goBack} />}
{step === 'result' && <WizardResult />}
```

When `step` is not one of the three (e.g. a corrupted persisted value, or `'servings'`/`'time'` which exist in the `WizardStepKey` union per the comment at lines 12-14 but are not in `WIZARD_STEPS`), `idx` becomes `0`, the progress bar shows "Bước 1/3", the back button is hidden (`idx > 0` is false), and none of the three step conditionals match — so the screen renders only the progress bar with no content and no recovery path. The protection the comment claims does not exist.

**Fix:** Render off the clamped step rather than the raw value so the fallback actually lands on the first step:

```tsx
const idx = Math.max(0, WIZARD_STEPS.indexOf(step));
const safeStep = WIZARD_STEPS[idx]; // always a valid step key

// ...
{safeStep === 'ingredients' && <WizardIngredientStep onNext={goNext} />}
{safeStep === 'preferences' && <WizardPreferenceStep onNext={goNext} onBack={goBack} />}
{safeStep === 'result' && <WizardResult />}
```

## Warnings

### WR-01: Wizard never restarts on entry — returning users land mid/end-flow

**File:** `src/Modules/MealPlanning/Screens/Wizard.screen.tsx:17-22`, `src/Routing/Shell/BottomTabNavigator.tsx:229-239`
**Issue:** `WizardScreen` reads `currentStep` straight from the persisted slice and never resets on mount. `completeWizard()` (WizardResult.widget.tsx:110) only flips `status` to `'completed'`; it leaves `currentStep` at `'result'` and keeps the prior `answers`. After a user completes the flow once, tapping the prominent center "Nấu gì?" tab (which routes to `/meal-planning/wizard`) drops them back on the result list (or empty-catalog screen) with stale answers instead of a fresh "Bạn có sẵn nguyên liệu gì?" start. A `restartWizard` action exists in the reducer but is never dispatched from the UI. The cold-start E2E only exercises a fresh (idle) state, so this regression is uncovered.
**Fix:** On entry, restart when the wizard is already completed (or always restart for a tab-initiated entry). For example, in `WizardScreen`:

```tsx
const status = useSelector(selectWizardStatus);
React.useEffect(() => {
    if (status === 'completed') dispatch(restartWizard());
}, []); // run once on mount
```

Confirm the intended resume-vs-restart policy against the planner decision (D-03/D-05) before choosing; if resume is intended for an in-progress flow, scope the reset to `status === 'completed'`.

### WR-02: Duplicate back affordance on the preferences step

**File:** `src/Modules/MealPlanning/Screens/Wizard.screen.tsx:37-44`, `src/Modules/MealPlanning/Screens/WizardPreferenceStep.widget.tsx:82-100`
**Issue:** On the preferences step (`idx === 1`), `WizardProgress` renders a circular back button (`wizard-back`, shown because `idx > 0`) and `WizardPreferenceStep` independently renders its own "Quay lại" back affordance (`wizard-preference-back`). Both call `goBack`, so the screen shows two back controls doing the same thing. The ingredient step (first step) has no progress back button, so the inconsistency is specific to preferences. This is a quality/UX defect and risks confusing both users and future test maintenance (two competing test IDs for one action).
**Fix:** Pick one back affordance. Since `WizardProgress` already owns the back control for any step where `idx > 0`, drop the inline back block from `WizardPreferenceStep` (and remove the now-unused `onBack` prop), or conversely suppress the progress back button when the step renders its own.

### WR-03: Clickable `<div>`/`<Box>` triggers are not keyboard accessible

**File:** `src/Modules/MealPlanning/Screens/WizardIngredientStep.widget.tsx:31-59`, `src/Modules/MealPlanning/Screens/WizardPreferenceStep.widget.tsx:83-139`
**Issue:** The ingredient picker trigger (`wizard-ingredient-trigger`), the preference picker trigger (`wizard-preference-trigger`), and the preference back affordance (`wizard-preference-back`) are `<Box>` (div) elements with `onClick` but no `role="button"`, no `tabIndex`, and no `onKeyDown` handler. They cannot be focused or activated via keyboard, which fails basic accessibility/operability and is inconsistent with the tag/metric controls elsewhere that use real `<button>` elements.
**Fix:** Use a native `<button type="button">` (as the tag grid and hero metrics already do), or add `role="button"`, `tabIndex={0}`, and an `onKeyDown` that fires the same handler on Enter/Space.

### WR-04: `eatPartCount` can initialize below the stepper minimum

**File:** `src/Modules/Home/Screens/Dashboard.screen.tsx:590-593, 896-902`
**Issue:** `_openEatPart` sets `eatPartCount = Math.min(1, item.portions)`. `availableLeftovers` only filters `portions > 0` (line 587), so a leftover with `portions` of e.g. `0.5` yields an initial count of `0.5` — fine — but a fractional portion below the stepper `min` of `0.5` (e.g. `0.3`) would seed a value of `0.3` while the `NumberStepper` enforces `min={0.5}` and `max={item.portions}` (`0.3`), producing an inconsistent/invalid initial state where min > max. `_confirmEatPart` clamps to `[0, portions]` so it won't over-consume, but the modal opens in an invalid state. Note: this file is largely pre-existing; flagged because the leftover modal is exercised by the dashboard hero changes in scope.
**Fix:** Clamp the seed into the valid range, e.g. `setEatPartCount(Math.min(1, Math.max(0.5, item.portions)))`, or guard the eat-part action so it is unavailable for portions below the minimum step.

## Info

### IN-01: Mixed date libraries (dayjs in wizard, moment app-wide)

**File:** `src/Modules/MealPlanning/Screens/WizardResult.widget.tsx:16, 96, 119`
**Issue:** `WizardResult` uses `dayjs` for the day picker while the rest of the app (Dashboard, scheduled meals) uses `moment`. The value is converted to a native `Date` via `pickedDate.toDate()` before dispatch (line 119), so there's no functional bug, but introducing a second date library increases bundle size and cognitive load.
**Fix:** Prefer the project's established date library (moment) for consistency, or confirm dayjs is the intended forward direction and document it.

### IN-02: Hardcoded default meal slot in wizard scheduling

**File:** `src/Modules/MealPlanning/Screens/WizardResult.widget.tsx:98-107`
**Issue:** `addDishToDay` always defaults the slot to `"dinner"` with no UI affordance to choose breakfast/lunch. Acceptable for the lean phase scope, but worth noting so it is a conscious decision rather than an oversight — every wizard-added dish lands on dinner.
**Fix:** None required for this phase; track as a follow-up if slot selection is desired.

---

_Reviewed: 2026-06-16T06:35:41Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
