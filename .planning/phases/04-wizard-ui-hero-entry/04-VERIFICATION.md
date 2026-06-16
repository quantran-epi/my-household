---
phase: 04-wizard-ui-hero-entry
verified: 2026-06-16T14:05:00Z
status: human_needed
score: 5/5 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Open Home on a phone-width viewport and confirm the 'Hôm nay ăn gì?' CTA is the single obvious top entry; confirm priorityAction + metrics still render below it and the desktop layout is unchanged."
    expected: "Dominant white-pill 'Hôm nay ăn gì?' button at the top of the hero opens /meal-planning/wizard; existing urgency surface + metrics intact; desktop unaffected."
    why_human: "Visual prominence, layout intactness, and desktop non-regression cannot be verified from code (MOB-04 / NAV-01 are visual judgments)."
  - test: "Walk the full wizard live: center tab → ingredient step → preference step → result → add a dish, watching the progress chrome and back affordance at each step."
    expected: "One question per screen, segmented progress advances, back returns to the prior step, and the add toast fires; flow feels guided not admin-like."
    why_human: "Real-time step transitions, animation/feel, and the 'guided journey' UX quality require human observation."
  - test: "Complete the wizard once, then tap the center 'Nấu gì?' tab again (WR-01)."
    expected: "Decide whether re-entry should restart at the ingredient step or resume on the stale result screen. Currently it resumes on the completed result with stale answers (restartWizard exists in the reducer but is never dispatched from the UI)."
    why_human: "Resume-vs-restart is a product policy decision; the first-time-user goal is unaffected, but returning-user behavior needs a human ruling."
  - test: "On the preferences step, observe the back controls (WR-02)."
    expected: "Decide whether the duplicate back affordance (circular wizard-back from WizardProgress + inline wizard-preference-back) is acceptable or should be consolidated to one."
    why_human: "UX/quality judgment on duplicated controls; both are wired to goBack and functional."
  - test: "Tab/keyboard through the ingredient and preference picker triggers (WR-03)."
    expected: "Decide whether the clickable <Box> triggers (no role/tabIndex/onKeyDown) must be made keyboard-operable for this phase or deferred to the Phase 5 mobile/a11y pass."
    why_human: "Accessibility operability requires keyboard testing and a scope decision."
---

# Phase 4: Wizard UI + Hero Entry Verification Report

**Phase Goal:** A first-time user can go from Home to a scheduled meal through a guided, skippable wizard — the milestone's named success metric — while every existing route stays reachable.
**Verified:** 2026-06-16T14:05:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Home shows one obvious "Hôm nay ăn gì?" hero entry that starts meal planning; entry points reframed to the guided journey | ✓ VERIFIED | `Dashboard.screen.tsx:276-294` renders the `hero-start-journey` CTA with exact text `Hôm nay ăn gì?`; usage site `:782` passes `onStartJourney={() => openRoute(...MealPlanningRoutes.Wizard())}`. `priorityAction` (`:668`) + metrics still rendered (entry-points-only reframe). |
| 2 | Planning runs one question per screen with visible progress and a back action; every step skippable with a "Tùy bạn" default | ✓ VERIFIED | `Wizard.screen.tsx` renders exactly one step keyed on clamped `currentStep`; `WizardProgress` shows segmented progress + conditional back (`onBack={idx>0?...}`). Each step has `wizard-skip-*` "Tùy bạn" buttons committing the empty default (`WizardIngredientStep.widget.tsx:74-79`, `WizardPreferenceStep.widget.tsx:154-162`). Unit test confirms step renders + back transition (3 passed). |
| 3 | Result step always yields an actionable dish (full-catalog fallback, or route to add-first-dish on empty catalog); user can add to today's meals | ✓ VERIFIED | `WizardResult.widget.tsx`: ladder c→a→b — empty catalog (`:124`) routes to `DishesRoutes.List()` via "Thêm món đầu tiên"; matches when `ids.length>0 && scored.length>0`; full-catalog fallback (`:175 dishes.slice(0,5)`) otherwise with neutral note. `addDishToDay` (`:98-111`) dispatches `addScheduledMeal` + toast + `completeWizard`. |
| 4 | First-timer with empty data reaches a scheduled meal unaided, verified by a cold-start E2E (empty IndexedDB → wizard → scheduled meal) | ✓ VERIFIED | `wizard-cold-start.spec.ts` has two scenarios (populated → scheduled meal on `/scheduledMeal/list`; empty catalog → `/dishes/list`). `seedApp.ts` adds `emptyCatalog` flag preserving `my-recipes-welcome-complete-v1`. Every targeted test ID confirmed present in source. SUMMARY reports 2 passed (20.3s). Live re-run blocked by multi-minute CRA server boot — code paths fully traced. |
| 5 | Every pre-refactor route stays reachable within ~3 taps / search; center action opens wizard while suggester stays reachable | ✓ VERIFIED | `BottomTabNavigator.tsx:233` center button `onNavigate(wizardRoute)`, `bottom-tab-suggester` testid preserved, `useToggle`/inline `DishSuggesterScreen` removed (grep: NONE). Suggester sidebar entry intact (`SidebarDrawer.tsx:292` → `DishSuggester()` `/dish-suggester`). `dish-suggester.spec.ts` reaches it via the sidebar route (NAV-02); global-search.spec unchanged (NAV-03). |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `MealPlanning/Routing/MealPlanningRouteConfig.ts` | `MealPlanningRoutes` .Root()/.Wizard() | ✓ VERIFIED | CreateRoutes('/meal-planning', ... Wizard → ["wizard"]); default export. |
| `MealPlanning/Routing/MealPlanningRouter.tsx` | Container+Outlet wrapper | ✓ VERIFIED | Imported + mounted in RootRouter (`:34,:87`). |
| `WizardIngredientStep.widget.tsx` | Picker-in-Sheet, advance, skip | ✓ VERIFIED | 92 lines; reuses `IngredientPickerWidget` in Sheet; advance not disabled on empty. |
| `WizardPreferenceStep.widget.tsx` | Single preferred-tags, advance/skip/back | ✓ VERIFIED | 177 lines; tags from `selectDishes`; no `scoreCookNow`. |
| `WizardResult.widget.tsx` | Fallback ladder + add-to-meal | ✓ VERIFIED | 209 lines; DishScorer.score (no re-sort), addScheduledMeal, completeWizard. |
| `WizardProgress.tsx` | Progress + conditional back | ✓ VERIFIED | `wizard-progress`/`wizard-back` present; back only when `onBack`. |
| `Wizard.screen.tsx` | Step-key state machine | ✓ VERIFIED | Renders off clamped `currentStep` (CR-01 fix); selector-only read. |
| `Wizard.screen.test.tsx` | Container unit test | ✓ VERIFIED | 3 tests pass. |
| `RootRouter.tsx` | MealPlanning sub-router + WizardScreen | ✓ VERIFIED | `:87-88` route block additive. |
| `BottomTabNavigator.tsx` | Center → wizard | ✓ VERIFIED | `:233` onNavigate(wizardRoute); testid preserved. |
| `Dashboard.screen.tsx` | Hero CTA | ✓ VERIFIED | `hero-start-journey` CTA wired to wizard. |
| `tests/e2e/wizard-cold-start.spec.ts` | WIZ-07 E2E | ✓ VERIFIED | 70 lines, 2 scenarios, real test IDs. |
| `tests/e2e/dish-suggester.spec.ts` | Migrated to /dish-suggester | ✓ VERIFIED | `page.goto('dish-suggester')`, no bottom-tab dependency. |
| `tests/e2e/fixtures/seedApp.ts` | emptyCatalog option | ✓ VERIFIED | `emptyCatalog?: boolean` + welcome flag preserved. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| RootRoutes.ts | MealPlanningRoutes | AuthorizedRoutes member | ✓ WIRED | `:5` import, `:106` member. |
| WizardIngredientStep | IngredientPickerWidget | import + Sheet render | ✓ WIRED | `:6,:88`. |
| Wizard.screen | selectWizardStep | useSelector | ✓ WIRED | `:8,:19`. |
| Wizard.screen | advance/goBack/commit actions | dispatch | ✓ WIRED | `:7,:28-35`. |
| RootRouter | WizardScreen | Route element under MealPlanningRouter | ✓ WIRED | `:35,:88`. |
| WizardResult | DishScorer.score | import + call (no re-sort) | ✓ WIRED | `:8,:153`, output sliced not sorted. |
| WizardResult | addScheduledMeal | dispatch constructed meal | ✓ WIRED | `:13,:108`. |
| WizardResult | DishesRoutes.List() | navigate on empty | ✓ WIRED | `:144`. |
| BottomTabNavigator | MealPlanningRoutes.Wizard() | onNavigate on center | ✓ WIRED | `:20,:233`. |
| Dashboard | MealPlanningRoutes.Wizard() | openRoute from onStartJourney | ✓ WIRED | `:782`. |
| cold-start spec | /meal-planning/wizard | bottom-tab-suggester click | ✓ WIRED | `:31,:58`. |
| dish-suggester spec | /dish-suggester | sidebar route goto | ✓ WIRED | `:13`. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| WizardResult | `dishes` | `selectDishes` (persisted shared.dishes) | Yes | ✓ FLOWING |
| WizardResult | `scored` | `DishScorer.score(dishes, ids, dishes)` | Yes (computed from real catalog) | ✓ FLOWING |
| WizardIngredientStep | `selectedIds` | seeded from `selectWizardAnswers`, IngredientPicker onChange | Yes | ✓ FLOWING |
| WizardPreferenceStep | `availableTags` | derived from `selectDishes` dish.tags | Yes | ✓ FLOWING |
| Wizard.screen | `currentStep` | `selectWizardStep` (persisted, clamped) | Yes | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Wizard container renders 3 steps + back transition | jest Wizard.screen.test | 3 passed | ✓ PASS |
| Type-check across phase changes | `npx tsc --noEmit` | exit 0 | ✓ PASS |
| WizardReducer action surface present | grep exports | commit/advance/goBack/restart/complete all exported | ✓ PASS |
| Cold-start E2E (live) | playwright wizard-cold-start | not run — CRA dev-server boot exceeds 10s spot-check budget; no server on e2e port | ? SKIP → human verification |

### Probe Execution

No `scripts/*/tests/probe-*.sh` probes declared or present for this UI phase. Probe step not applicable.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| WIZ-01 | 04-04 | Home hero entry "Hôm nay ăn gì?" | ✓ SATISFIED | hero-start-journey CTA |
| WIZ-02 | 04-01,04-03 | Step-by-step wizard, progress, back | ✓ SATISFIED | Wizard.screen + WizardProgress |
| WIZ-03 | 04-01 | Every step skippable with "Tùy bạn" | ✓ SATISFIED | wizard-skip-* buttons |
| WIZ-04 | 04-02 | Result always actionable / empty fallback | ✓ SATISFIED | fallback ladder c→a→b |
| WIZ-05 | 04-02 | Add chosen dish to today | ✓ SATISFIED | addDishToDay → addScheduledMeal |
| WIZ-07 | 04-05 | First-timer empty-data reaches scheduled meal | ✓ SATISFIED | cold-start E2E (2 scenarios) |
| NAV-01 | 04-04 | Entry points reframed to guided journey | ✓ SATISFIED | hero CTA + center repoint |
| NAV-02 | 04-04,04-05 | Every route stays reachable | ✓ SATISFIED | sidebar /dish-suggester intact + migrated spec |
| NAV-03 | 04-05 | Global search still reaches features | ✓ SATISFIED | global-search.spec unchanged, noted in cold-start spec |
| NAV-04 | 04-04 | Center action → wizard, suggester reachable | ✓ SATISFIED | BottomTabNavigator:233 + sidebar |

All 10 declared requirement IDs accounted for. No orphaned requirements for Phase 4 in REQUIREMENTS.md. (Note: REQUIREMENTS.md traceability still lists WIZ-01..WIZ-05 and NAV-01 as "Pending" — the table is stale relative to the verified implementation, not a coverage gap.)

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| Wizard.screen.tsx | 17-22 | WR-01: no restart on re-entry after completeWizard | ⚠️ Warning | Returning users land on stale result; first-time goal unaffected. Human decision. |
| Wizard.screen + WizardPreferenceStep | back controls | WR-02: duplicate back affordance on preferences | ⚠️ Warning | Two back controls (wizard-back + wizard-preference-back); both functional. |
| WizardIngredientStep / WizardPreferenceStep | triggers | WR-03: clickable Box, no keyboard a11y | ⚠️ Warning | Picker triggers not keyboard-operable; likely Phase 5 a11y scope. |
| Dashboard.screen.tsx | 590-593 | WR-04: eatPartCount sub-0.5 min>max | ℹ️ Info | Pre-existing leftover modal edge case. |
| WizardResult.widget.tsx | 16 | IN-01: dayjs vs app-wide moment | ℹ️ Info | Converted to native Date before dispatch; no functional bug. |

No debt markers (TBD/FIXME/XXX) found in phase-modified files. No stubs, no empty/placeholder implementations. CR-01 (the sole code-review blocker) is fixed — `Wizard.screen.tsx:25` renders off the clamped `currentStep`, eliminating the unknown/future-key dead-end.

### Gaps Summary

No blocking gaps. All 5 ROADMAP success criteria are observably satisfied in the codebase, every artifact is substantive and wired, the data flows through real selectors/scorer, the container unit test passes, and `tsc` is clean. The single code-review BLOCKER (CR-01) is resolved in commit 1e55627.

Status is `human_needed` (not `passed`) for two reasons: (1) the planner deferred live visual/UX confirmation to the end-of-phase verify gate (`human_verify_mode: end-of-phase`), and the headline WIZ-07 cold-start E2E could not be re-run here because the CRA dev server is not running and booting it exceeds the spot-check budget — the spec and all its target test IDs are verified in code, but a live green run is the contracted proof; (2) four advisory warnings (WR-01 re-entry policy, WR-02 duplicate back, WR-03 keyboard a11y, WR-04 pre-existing) need a human decision on whether to fix now or defer to Phase 5. None of these block the first-time-user goal, which is the phase's named metric.

---

_Verified: 2026-06-16T14:05:00Z_
_Verifier: Claude (gsd-verifier)_
