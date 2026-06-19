---
phase: 06-differentiator-enhancements
plan: 05
subsystem: ui
tags: [wizard, meal-planning, antd, react, shopping-list, household-health, app-copy]

# Dependency graph
requires:
  - phase: 04-wizard-ui-hero-entry
    provides: route-hosted meal wizard (Wizard.screen, servings step, result widget)
  - phase: 06-differentiator-enhancements
    provides: grouped wizard results + missing-ingredient sheet (06-02/06-03)
provides:
  - Confirm-gated clear-defaults with title-above-buttons remembered-defaults hint
  - Full-width portions-step member cards with health status tag and preference description
  - Existing-vs-new shopping-list target selector in the missing-ingredient sheet
  - SheetActions horizontal action-row component exported from @components/Sheet
affects: [wizard, shopping-list, meal-planning UAT follow-up]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SheetActions: shared horizontal action row (one action full-width, two share the row equally)"
    - "Per-member wizard description fallback (notes -> preference counts -> empty label) all via AppCopy"
    - "Destructive wizard action gated through useModal().confirm with danger ok button"

key-files:
  created: []
  modified:
    - src/Common/Copy/AppCopy.ts
    - src/Modules/MealPlanning/Screens/Wizard.screen.tsx
    - src/Modules/MealPlanning/Screens/WizardServingsStep.widget.tsx
    - src/Modules/MealPlanning/Screens/WizardResult.widget.tsx
    - src/Components/FastOverlay/FastOverlay.tsx
    - src/Components/Sheet/index.ts

key-decisions:
  - "Created the missing SheetActions component (pre-existing broken import) rather than stripping it, honoring the 06-UI-SPEC sheet-action rule"
  - "Member card description prefers free-text notes, else a likes/avoids/blocks preference summary, mirroring HouseholdProfiles"
  - "missingTargetMode defaults by active-list presence and resets on every sheet open so the choice never carries between dishes"

patterns-established:
  - "SheetActions: one child stretches full width, multiple children share the row via equal flex"
  - "Wizard destructive actions route through useModal().confirm with cancelText + danger ok"

requirements-completed: [WIZ2-01, WIZ2-03, WIZ2-04]

# Metrics
duration: ~25min
completed: 2026-06-19
---

# Phase 6 Plan 5: Wizard UI Gap Closure Summary

**Confirm-gated clear-defaults with stacked hint, full-width member status cards on the portions step, and an existing-vs-new shopping-list selector for missing ingredients — plus the previously-missing SheetActions component restored.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-06-19
- **Completed:** 2026-06-19
- **Tasks:** 3 (plus 1 blocking-issue fix)
- **Files modified:** 6

## Accomplishments
- Clearing remembered wizard defaults now asks for confirmation (danger ok button) before deleting — nothing is removed silently. The remembered-defaults hint stacks the title above its two actions.
- Each member on the portions step renders as a full-width card showing name, a `HouseholdHealthStatusTag` (default `neutral`), and a short description (notes or `X thích · Y tránh · Z chặn`).
- The missing-ingredient sheet now offers an existing-vs-new shopping-list selector when an open list exists; choosing "new" reveals the list-name input and always creates a fresh list.
- Restored the `SheetActions` component (imported by WizardResult since 06-02/06-03 but never defined/exported), unblocking `yarn build`.

## Task Commits

Each task was committed atomically:

1. **Blocking fix: export missing SheetActions** - `835bbaa` (fix)
2. **Task 1: Confirm-gate clear-defaults and restack hint** - `abc5571` (feat)
3. **Task 2: Full-width member status cards** - `c9085c8` (feat)
4. **Task 3: Existing-vs-new shopping-list target** - `542893a` (feat)

## Files Created/Modified
- `src/Common/Copy/AppCopy.ts` - Added `clearDefaultsConfirmTitle/Body`, `memberPreferenceSummary`, `memberNoPreferences`, `missingTargetExistingOption`, `missingTargetNewOption` to `AppCopy.wizard`
- `src/Modules/MealPlanning/Screens/Wizard.screen.tsx` - `useModal().confirm` gate on clear-defaults; restacked hint to column (title above buttons)
- `src/Modules/MealPlanning/Screens/WizardServingsStep.widget.tsx` - Full-width member cards with status tag + description helper; preserved `wizard-member-{id}` testid
- `src/Modules/MealPlanning/Screens/WizardResult.widget.tsx` - `missingTargetMode` state + Radio selector; mode-aware `confirmAddMissingIngredients`, `missingRows`, and footer label
- `src/Components/FastOverlay/FastOverlay.tsx` - Added `SheetActions` horizontal action-row component + `SheetActionsProps`
- `src/Components/Sheet/index.ts` - Re-exported `SheetActions` / `SheetActionsProps`

## Decisions Made
- Built `SheetActions` to match the 06-UI-SPEC rule (one action full-width, two horizontal) instead of removing the broken import, since multiple sheet flows in WizardResult depend on it.
- Member card description prefers `notes`, then a likes/avoids/blocks preference summary, then a neutral "no preferences" label — always sourced from `AppCopy.wizard`, never inline Vietnamese.
- `missingTargetMode` resets in `openMissingSheet` so the existing/new choice never leaks between dishes, and `missingRows` is computed against an empty list in "new" mode so nothing is mistakenly pre-marked already-added.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created the missing `SheetActions` export**
- **Found during:** Task 1 (first `yarn build`)
- **Issue:** `WizardResult.widget.tsx` imports `SheetActions` from `@components/Sheet`, but the symbol was never defined or exported anywhere in `src/` (introduced as a broken import in commits 06-02/06-03). `yarn build` failed with `'SheetActions' is not exported from '@components/Sheet'`, blocking the build verification for both Task 1 and Task 3, and Task 3 directly edits the same file.
- **Fix:** Added a `SheetActions` component to `src/Components/FastOverlay/FastOverlay.tsx` (horizontal row; one action stretches full width, multiple actions share equal flex per 06-UI-SPEC) and re-exported it (plus `SheetActionsProps`) through `src/Components/Sheet/index.ts`.
- **Files modified:** src/Components/FastOverlay/FastOverlay.tsx, src/Components/Sheet/index.ts
- **Verification:** `yarn build` exits 0; focused wizard screen test (which renders WizardResult) passes.
- **Committed in:** `835bbaa` (separate blocking-fix commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The fix was required for any build to pass and honors the existing UI-SPEC sheet-action contract. No scope creep beyond restoring the already-referenced API.

## Issues Encountered
- The worktree had no `node_modules`; symlinked the main repo's `node_modules` (gitignored, not committed) so `yarn build` and `yarn test` could run. No source impact.

## Verification
- `yarn build` exits 0 (run after each task).
- `yarn test --watchAll=false --runTestsByPath src/Modules/MealPlanning/Screens/Wizard.screen.test.tsx` — 6/6 pass.
- `wizard-member-{id}` testid preserved; all new visible strings live in `AppCopy.wizard`; no model or reducer changes.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All three Phase 6 UAT wizard gaps (tests 1, 2, 6) are closed and build/test-verified.
- Native Vietnamese household-user copy review remains the standing follow-up (carried from Phase 5).
- Mobile smoke check of the new card/selector layouts is recommended at phase verification.

---
*Phase: 06-differentiator-enhancements*
*Completed: 2026-06-19*
