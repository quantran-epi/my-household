---
phase: 04-wizard-ui-hero-entry
plan: 06
subsystem: MealPlanning wizard UI
tags: [wizard, ui, gap-closure, uat-fixes, mobile]
requires:
  - Phase 3 wizard RTK slice (restartWizard/completeWizard, selectWizard* selectors)
  - Phase 4 wizard UI screens (Wizard.screen, WizardResult.widget)
provides:
  - Explicit wizard finish ("Xong") affordance on the result step
  - Mount-time restart of a completed wizard on re-entry
  - Vertically-stacked full-width result-row action buttons (no phone overflow)
affects:
  - src/Modules/MealPlanning/Screens/WizardResult.widget.tsx
  - src/Modules/MealPlanning/Screens/Wizard.screen.tsx
tech-stack:
  added: []
  patterns:
    - Mount-only useEffect (empty deps) to reset persisted slice state on screen entry
    - Vertical full-width Stack for phone-first button layout
key-files:
  created: []
  modified:
    - src/Modules/MealPlanning/Screens/WizardResult.widget.tsx
    - src/Modules/MealPlanning/Screens/Wizard.screen.tsx
    - src/Modules/MealPlanning/Screens/Wizard.screen.test.tsx
decisions:
  - Restart on mount via empty-deps effect; restartWizard flips status to in_progress so it cannot loop
  - Finish button only on the dish-list branch, not the empty-catalog branch (nothing to finish)
metrics:
  duration: 6 min
  completed: 2026-06-16
---

# Phase 4 Plan 06: Wizard UAT Gap Closure Summary

Closed three UAT-diagnosed wizard defects: added an explicit "Xong" finish control that completes the wizard and returns home, reset a completed wizard to the ingredients step on re-entry, and stacked result-row action buttons vertically full-width so they fit phone-width cards.

## What Was Built

### Task 1 — Finish affordance + result-row button overflow (gaps 1 and 3)
- `WizardResult.widget.tsx`: changed the `ResultRow` action `Stack` from a default row to `direction="column"` + `fullwidth`, and set `width: "100%"` on both buttons ("Thêm vào hôm nay" / "Chọn ngày khác") so they stack and span the card on narrow viewports.
- Added a `wizard-finish` primary button labeled "Xong" after the matches/fallback list and before the day-picker `Sheet`. Its `onClick` dispatches `completeWizard()` then navigates to `RootRoutes.AuthorizedRoutes.Root()` ("/"). The implicit `completeWizard()` inside `addDishToDay` was left intact.
- Commit: `72904f8`

### Task 2 — Restart on re-entry + screen test (gap 2)
- `Wizard.screen.tsx`: imported `useEffect`, `restartWizard`, and `selectWizardStatus`. Added a mount-only effect (`[]` deps, with `eslint-disable-next-line react-hooks/exhaustive-deps`) that dispatches `restartWizard()` when `status === 'completed'`. The existing clamp logic then renders the ingredients step fresh.
- `Wizard.screen.test.tsx`: imported `completeWizard` and added a test "restarts a completed wizard at the ingredients step on re-entry" — dispatches advance→result, completeWizard, renders, and asserts the ingredients step shows, the result step does not, and status is back to `in_progress`. The three pre-existing tests remain unchanged and green.
- Commit: `b66df24`

## Verification

- `Wizard.screen.test.tsx`: 4 passed, 4 total (3 existing + 1 new reset test).
- `WizardReducer.test.ts`: 9 passed, 9 total (no reducer changes; behavior already covered).
- `tsc --noEmit`: no errors in the two edited source files.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None. The finish button wires the real `completeWizard` dispatch and real navigation; no placeholders introduced.

## Self-Check: PASSED

- FOUND: src/Modules/MealPlanning/Screens/WizardResult.widget.tsx (contains `wizard-finish`, `completeWizard()`)
- FOUND: src/Modules/MealPlanning/Screens/Wizard.screen.tsx (contains `restartWizard()`)
- FOUND commit: 72904f8 (Task 1)
- FOUND commit: b66df24 (Task 2)
