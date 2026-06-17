---
phase: 05-mobile-tuning-copy-rollout
plan: 01
subsystem: ui
tags: [react, antd, copy, i18n, vietnamese, mobile, touch-targets, appcopy]

# Dependency graph
requires:
  - phase: 01-copy-infrastructure
    provides: typed AppCopy source-of-truth (@common/Copy), build-gated CopyKey union, review-only glossary
  - phase: 04-wizard-ui-hero-entry
    provides: the guided meal-planning wizard screens (ingredient/preference/result steps, progress chrome, thumb-zone CTA idiom)
provides:
  - Extended AppCopy.wizard namespace covering every meal-planning journey string
  - Extended AppCopy.emptyStates namespace with empty-catalog + no-preferences journey empties
  - 5 journey files reading copy via @common/Copy with zero inline user-facing literals
  - >=44px touch targets on the journey back control + large/full-width result CTAs
affects: [05-07 voice-refinement, copy-rollout, mobile-tuning]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Journey copy migration: inline VN literal -> AppCopy.wizard.* / AppCopy.emptyStates.* direct object access (D-07)"
    - "Touch-target tuning within the inline-style + antd-token idiom (no responsive framework, D-05)"

key-files:
  created: []
  modified:
    - src/Common/Copy/AppCopy.ts
    - src/Modules/MealPlanning/Screens/WizardIngredientStep.widget.tsx
    - src/Modules/MealPlanning/Screens/WizardPreferenceStep.widget.tsx
    - src/Modules/MealPlanning/Screens/WizardResult.widget.tsx
    - src/Modules/MealPlanning/Components/WizardProgress.tsx

key-decisions:
  - "Migrated journey literals verbatim into AppCopy (no rewording) — rewording is deferred to 05-07 per D-03 order"
  - "Reused common.skip / common.back rather than adding duplicate wizard keys where values matched"
  - "Bumped only the sub-44px circle back-button + result CTAs; left already-compliant step-screen CTAs and compact 28px ActionButton rows untouched"

patterns-established:
  - "Pattern 1: interpolated copy is a single named-arg arrow fn (selectedIngredients/selectedPreferences/ingredientMatchSummary/progressStep)"
  - "Pattern 2: empty-states render friendly AppCopy.emptyStates copy, never blank or a red error"

requirements-completed: [COPY-03, COPY-05, MOB-01, MOB-02]

# Metrics
duration: 18min
completed: 2026-06-17
---

# Phase 5 Plan 01: Journey Copy Migration & Touch-Target Polish Summary

**Every meal-planning wizard string now reads from the typed AppCopy source of truth, friendly empty-states are wired from AppCopy.emptyStates, and journey touch targets meet the >=44px phone-first bar.**

## Performance

- **Duration:** ~18 min
- **Completed:** 2026-06-17
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Extended `AppCopy.wizard` with 22 journey keys (titles, picker triggers, sheet titles, match labels, count/interpolation fns) and `AppCopy.emptyStates` with 4 journey empties (empty-catalog title/body/cta, no-preferences)
- Migrated all inline Vietnamese literals on the 5 journey files (`WizardIngredientStep`, `WizardPreferenceStep`, `WizardResult`, `WizardProgress`) to `AppCopy.*` references — both quoted attributes and JSX text nodes
- Wired the empty-catalog and no-preferences states to friendly `AppCopy.emptyStates` copy (COPY-05)
- Bumped the circle back control from 40px to 44px and added `size="large"` to the result-row, finish, and day-sheet CTAs (MOB-01/MOB-02) without introducing any responsive framework (D-05)

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend AppCopy with the journey namespace surface** - `7d9863b` (feat)
2. **Task 2: Swap journey inline literals to AppCopy + wire friendly empty-states** - `19d06ae` (feat)
3. **Task 3: Phone-first touch-target polish on journey controls** - `7954120` (feat)

## Files Created/Modified
- `src/Common/Copy/AppCopy.ts` - Extended wizard + emptyStates namespaces covering every journey string
- `src/Modules/MealPlanning/Screens/WizardIngredientStep.widget.tsx` - Reads copy from AppCopy; no inline literals
- `src/Modules/MealPlanning/Screens/WizardPreferenceStep.widget.tsx` - Reads copy + no-preferences empty-state from AppCopy
- `src/Modules/MealPlanning/Screens/WizardResult.widget.tsx` - Reads copy + empty-catalog from AppCopy; result/finish/day-sheet CTAs `size="large"`
- `src/Modules/MealPlanning/Components/WizardProgress.tsx` - Progress + back aria from AppCopy; back control bumped to 44px

## Decisions Made
- Kept phrasing as the current literal values verbatim — this plan migrates, it does not reword (rewording is 05-07 per D-03).
- Reused existing `common.skip` ("Tùy bạn") and `common.back` ("Quay lại") rather than adding duplicate wizard keys, since the values already matched.
- Only the circle back-button (the single sub-44px journey control) was touch-bumped; the compact 28px `ActionButton` rows were intentionally left alone per the pattern-map caution.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- **Journey cold-start e2e could not be verified in this environment (pre-existing, NOT a regression).** `yarn test:e2e --grep 'cold-start|wizard'` failed at the very first assertion — `expect(getByTestId('dashboard')).toBeVisible()` on initial app load — before any wizard screen renders. To rule out my changes as the cause I ran the untouched `dashboard.spec.ts`, which fails identically at the same dashboard-load assertion (the seeded app never boots to the dashboard in this environment, with a warm dev server confirmed serving the app). Since the failure is upstream of all wizard code and reproduces on a spec this plan did not touch, it is an environmental/seed issue, not a regression from this plan. `yarn build` is green and the `MealPlanning` unit suite (`Wizard.screen.test.tsx`, 4 tests) passes. Per Task 3's acceptance note, the e2e skip and reason are recorded here.

## Verification

- `yarn build` — green (derived CopyKey union compiles; no malformed copy key)
- `yarn test --watchAll=false --testPathPattern='MealPlanning'` — 4 passed, 0 failed
- Acceptance greps confirmed: all 4 files import `@common/Copy`; zero leftover known journey literals; `AppCopy.emptyStates.` wired (4 refs); `data-testid="wizard-empty-catalog"` preserved; `height: 44`/`height={44}` present with no `height: 40` leftover; `size="large"` count = 4 (>= 3); no responsive/breakpoint library introduced
- e2e (`cold-start|wizard`) — could not run in this environment (pre-existing dashboard-load failure, see Issues Encountered)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- The `wizard` + `emptyStates` key surface is now the migration template the rest of Phase 5 mirrors; 05-07 voice-refinement can reword these keys in place without re-touching screens.
- Concern carried forward: the e2e environment cannot currently boot the seeded dashboard — phase-level UAT should run the journey e2e once the environment/seed issue is resolved.

## Self-Check: PASSED

All claimed files exist on disk and all three task commits are present in git history:
- Files: AppCopy.ts, WizardIngredientStep.widget.tsx, WizardPreferenceStep.widget.tsx, WizardResult.widget.tsx, WizardProgress.tsx, 05-01-SUMMARY.md — all FOUND
- Commits: 7d9863b, 19d06ae, 7954120 — all FOUND

---
*Phase: 05-mobile-tuning-copy-rollout*
*Completed: 2026-06-17*
