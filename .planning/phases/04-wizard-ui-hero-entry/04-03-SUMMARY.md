---
phase: 04-wizard-ui-hero-entry
plan: 03
subsystem: ui
tags: [react, redux, react-router, antd, wizard, meal-planning, routing]

# Dependency graph
requires:
  - phase: 04-wizard-ui-hero-entry
    provides: "WizardIngredientStep/WizardPreferenceStep (04-01), WizardResult (04-02), MealPlanningRouter + MealPlanningRoutes (04-01)"
  - phase: 03-wizard-state-slice
    provides: "wizard RTK slice (selectWizardStep/selectWizardAnswers, commit/advance/goBack/complete actions)"
provides:
  - "WizardScreen container — persisted step-key state machine mapping current step to step widget"
  - "WizardProgress chrome — segmented progress indicator + conditional neutral back affordance"
  - "Live route /meal-planning/wizard rendering the wizard inside the app Container"
  - "data-testids: wizard-screen, wizard-progress, wizard-back"
affects: [cold-start-e2e-04-05, home-hero-04-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Selector-only step read (selectWizardStep, sole read path); clamp unknown keys via Math.max(0, indexOf)"
    - "Container dispatches commitWizardAnswer then advanceWizardStep on advance; goBackWizardStep on back"
    - "ActionButton back-button idiom reused verbatim; data-testid hosted on wrapping span (ActionButton props don't forward it)"
    - "Container unit test mocks nanoid (App.test.tsx pattern) + trims test store to the slices the tree reads"

key-files:
  created:
    - src/Modules/MealPlanning/Components/WizardProgress.tsx
    - src/Modules/MealPlanning/Screens/Wizard.screen.tsx
    - src/Modules/MealPlanning/Screens/Wizard.screen.test.tsx
  modified:
    - src/Routing/RootRouter.tsx

key-decisions:
  - "WIZARD_STEPS = ['ingredients', 'preferences', 'result'] module-local constant (planner D-03/D-05 lean flow — servings/time keys exist in the union but are not steps this phase)"
  - "data-testid='wizard-back' lives on a span wrapping ActionButton, since the shared ActionButton's explicit prop list does not forward data-testid"
  - "Container test mocks nanoid and wires only shared.ingredient/shared.dishes/personal.wizard — the other slices transitively import ESM-only nanoid and the wizard tree never reads them"

patterns-established:
  - "Persisted-step container: read via selectWizardStep, clamp with Math.max(0, WIZARD_STEPS.indexOf(step)), render exactly one step by discrete equality"

requirements-completed: [WIZ-02, WIZ-03]

# Metrics
duration: 15min
completed: 2026-06-16
---

# Phase 4 Plan 03: Wizard Container + Route Registration Summary

**WizardScreen container that maps the persisted wizard step-key to the matching step widget, a WizardProgress chrome (segmented indicator + conditional neutral back), and the /meal-planning/wizard route element wired into RootRouter.**

## Performance

- **Duration:** ~15 min
- **Tasks:** 3
- **Files modified:** 4 (3 created, 1 modified)

## Accomplishments
- `WizardProgress` renders a segmented step indicator (current/completed markers `#7436dc`, remaining `#f5f5f5`), a `Bước {current+1}/{total}` label (13px/600), and a conditional neutral back affordance reusing the DishSuggester `ActionButton shape="circle"` + `<LeftOutlined />` idiom verbatim (neutral `#595959`, `aria-label="Quay lại"`). Back is omitted entirely when `onBack` is undefined (first step).
- `WizardScreen` reads the current step exclusively via `selectWizardStep`, computes `idx = Math.max(0, WIZARD_STEPS.indexOf(step))` (clamps tampered/unknown keys to the first step — threat T-04-06), and renders exactly one step widget by discrete equality (T-04-07). `goNext` dispatches `commitWizardAnswer` then `advanceWizardStep(next)`; `goBack` dispatches `goBackWizardStep(prev)`; back is hidden on the first step.
- Container unit test proves the three step renders plus the back-button visibility transition (hidden on ingredients, visible on preferences, result renders after advancing).
- Registered the `/meal-planning/wizard` route as a `MealPlanningRouter` sub-router with a `WizardScreen` child route, sibling to the existing `ScheduledMealRoutes` block — purely additive, no existing route touched (NAV-02).

## Task Commits

Each task was committed atomically:

1. **Task 1: Build the WizardProgress chrome component** - `de9df95` (feat)
2. **Task 2: Build the Wizard.screen container + unit test** - `ba1ceda` (feat)
3. **Task 3: Register the wizard route element in RootRouter.tsx** - `0a5363f` (feat)

## Files Created/Modified
- `src/Modules/MealPlanning/Components/WizardProgress.tsx` - `WizardProgress` step indicator + conditional neutral back button matching UI-SPEC color/typography rules.
- `src/Modules/MealPlanning/Screens/Wizard.screen.tsx` - `WizardScreen` container; `WIZARD_STEPS` constant; selector-only step read; commit-then-advance / go-back dispatch wiring.
- `src/Modules/MealPlanning/Screens/Wizard.screen.test.tsx` - Container unit test (Provider + MemoryRouter, nanoid mocked, trimmed test store) covering the three step renders + back-button transition.
- `src/Routing/RootRouter.tsx` - Added `MealPlanningRouter` + `WizardScreen` imports and the MealPlanning sub-router route block (additive).

## Decisions Made
- Kept `WIZARD_STEPS = ['ingredients', 'preferences', 'result']` per the planner's lean-flow decision; the `servings`/`time` union members are intentionally not steps this phase.
- Hosted `data-testid="wizard-back"` on a `<span>` wrapping `ActionButton` because the shared `ActionButton`'s explicit prop interface does not forward `data-testid` — wrapping preserves the back-button idiom verbatim while satisfying the acceptance criteria (the `aria-label` stays on the button itself).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Container test could not load the full production store (ESM nanoid)**
- **Found during:** Task 2
- **Issue:** Building the test store from all production reducers fails at module load — `ShoppingListReducer`, `HouseholdHealthReducer`, and `CookingSessionReducer` (and `Selectors.ts` transitively) import the ESM-only `nanoid@4`, which Jest's `transformIgnorePatterns` does not transpile (`SyntaxError: Cannot use import statement outside a module`).
- **Fix:** Mocked `nanoid` at the top of the test file (`jest.mock('nanoid', () => ({ nanoid: () => 'test-id' }))`) — the exact pattern already established in `src/App.test.tsx` — and trimmed the test store to only the slices the wizard tree actually reads (`shared.ingredient`, `shared.dishes`, `personal.wizard`). The selectors use optional chaining on `personal.*`, so the trimmed store resolves cleanly.
- **Files modified:** src/Modules/MealPlanning/Screens/Wizard.screen.test.tsx
- **Commit:** ba1ceda

## Issues Encountered
- The result step's empty-catalog branch renders `wizard-empty-catalog`, not `wizard-step-result`. The third test seeds one minimal dish (`addDishes`) so the canonical `wizard-step-result` branch renders, matching the acceptance criterion.

## Threat Model Verification
- T-04-06 (Tampering, persisted `currentStep`): `selectWizardStep` falls back to `WIZARD_FIRST_STEP`; `idx = Math.max(0, WIZARD_STEPS.indexOf(step))` clamps unknown keys to the first step rather than rendering nothing. Mitigated.
- T-04-07 (DoS, step render loop): exactly one step renders per key via discrete equality checks; no recursion or unbounded mapping. Mitigated.
- T-04-SC (installs): no new package installs — all imports (react-redux, react-router-dom, antd, `@components`/`@store`) already present. Accepted as specified.

## Next Phase Readiness
- `/meal-planning/wizard` is a live route rendering the container inside the shell `<Container>`; the human-check (visual confirmation + existing routes unaffected) is ready to be exercised, and the full cold-start flow is slated for the 04-05 E2E.
- The container exposes `wizard-screen`, `wizard-progress`, and `wizard-back` testids for downstream E2E.

## Self-Check: PASSED
- `src/Modules/MealPlanning/Components/WizardProgress.tsx` — FOUND
- `src/Modules/MealPlanning/Screens/Wizard.screen.tsx` — FOUND
- `src/Modules/MealPlanning/Screens/Wizard.screen.test.tsx` — FOUND
- `src/Routing/RootRouter.tsx` — FOUND
- `.planning/phases/04-wizard-ui-hero-entry/04-03-SUMMARY.md` — FOUND
- Commit `de9df95` (Task 1) — FOUND
- Commit `ba1ceda` (Task 2) — FOUND
- Commit `0a5363f` (Task 3) — FOUND
- Commit `900f241` (plan metadata) — FOUND

---
*Phase: 04-wizard-ui-hero-entry*
*Completed: 2026-06-16*
