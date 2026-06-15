# Phase 3: Wizard State Slice - Context

**Gathered:** 2026-06-15
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase makes the meal-planning wizard's progress and answers **live in persisted, selector-only state that survives the app's forced reloads** — and pins the current `DishScorer` behavior with characterization tests so later changes can't silently regress suggestions. There is **no wizard UI in this phase**: Phase 4 builds the actual step screens that consume this slice.

It delivers three things:

1. A **new RTK slice for wizard state** added to the existing `personal` persisted root (alongside `appContext`, `inventory`, `shoppingList`, `scheduledMeal`, `cookingSession`, `householdHealth`, `smartPlannerTemplate`) — **no new persisted root**. The slice holds the current step, a per-step answer model, and a session status, with action creators to commit each answer, advance/go-back, resume, and explicitly restart.
2. **Selectors** in `src/Store/Selectors.ts` for all wizard reads (current step, answers, status, "is resumable"). No component reads `state.personal.wizard.*` directly — this is the FND-03 contract.
3. **Characterization tests** that pin the current output of all five `DishScorer` methods (`score`, `scoreWithInventory`, `scoreCookNow`, `group`, `groupCookNow`) against golden fixtures, so Phase 4's wiring of the wizard result into the suggester can't change scoring behavior unnoticed.

**In scope:**
- A `WizardReducer` RTK slice (`createSlice`) + its `WizardState` model, registered in `personalReducer` in `src/Store/Store.ts`
- Per-step answer commit semantics so a forced reload mid-flow preserves prior answers (WIZ-06)
- Resume-on-mount: on app load, the slice rehydrates and exposes the last committed step so Phase 4 can resume there
- Selectors for every wizard read (FND-03 — no raw state access)
- Reducer unit tests for the slice (commit / advance / back / resume / restart, and the persistence-shape invariant)
- `DishScorer` characterization tests with golden fixtures covering all 5 methods

**Explicitly NOT in scope (later phases):**
- Any wizard UI, step screens, hero entry, progress bar, or "Tùy bạn" skip controls → Phase 4 (WIZ-01..05, WIZ-07, NAV-*)
- Wiring the wizard result into `DishSuggester` / `addScheduledMeal` → Phase 4 (WIZ-04, WIZ-05)
- Any change to `DishScorer` logic — this phase only *pins* current behavior, it does not modify scoring
- Copy migration of any wizard strings to `AppCopy` → Phase 5 (COPY-03)
- v2 wizard enhancements (portion step, fridge filter, remembered defaults, "why this dish") → Phase 6 (WIZ2-*)

Success = wizard step + answers live in a persisted `personal` slice read only through selectors, a forced reload mid-flow preserves prior answers and resumes from the last committed step, and the `DishScorer` golden tests pass against current output.

</domain>

<decisions>
## Implementation Decisions

### Answer Model Shape
- **D-01: Hybrid — typed known fields + an extensible bag.** The `WizardState` answer model carries explicitly typed fields for the answers Phase 4 already knows it needs (the inputs the existing suggester consumes — e.g. selected ingredient IDs and the `HouseholdPreferenceProfile`-relevant choices such as serving count, max cook minutes, preferred/avoided tags), PLUS a typed-but-open structure so Phase 4 can add new step answers without a slice migration. Rationale: the result step ultimately feeds `DishScorer.scoreCookNow(dishes, inventory, allDishes, allIngredients, profile, ...)` and `DishScorer.score(dishes, selectedIngredientIds, allDishes)` — so the known fields should map cleanly onto a `HouseholdPreferenceProfile` (defined in `AppContextReducer.ts`) and a `selectedIngredientIds: string[]`. The planner should model answers so Phase 4 can derive a `HouseholdPreferenceProfile` (or the subset the wizard collects) from wizard answers without reshaping the slice. Do not duplicate the full `HouseholdPreferenceProfile` type — reference/compose it.
- **D-02: Answers are stored as data, not derived suggestions.** The slice stores what the *user answered*, never the scored dishes. Suggestion computation stays in `DishScorer` and is invoked by Phase 4 at the result step. The slice must not import or call `DishScorer`.

### Step + Resume Modeling
- **D-03: String step key + explicit session status.** Model the current position as a **string step key** (a stable identifier like `"ingredients"` / `"servings"` / `"result"`, not a numeric index) so reordering or inserting steps in Phase 4 doesn't invalidate persisted state. Pair it with an explicit `status` enum (e.g. `idle` / `in_progress` / `completed`). Rationale: a numeric index is brittle across step-set changes and a forced reload mid-flow must land on a still-valid step. The planner defines the concrete step-key set as an extensible union/string with the Phase-4 steps as known values; the exact set is Claude's discretion but must be a string key, not an index.
- **D-04: Resume in-progress, explicit restart only.** On mount, if `status === 'in_progress'`, the wizard resumes from the last committed step with prior answers intact — it does **not** auto-reset. A fresh session begins only when an explicit restart action is dispatched (Phase 4 wires the "start over" affordance). Rationale: WIZ-06 requires surviving interruption/reload; silently resetting on mount would defeat that. A `completed` session is terminal — starting a new plan dispatches restart, which clears answers and sets status back to `in_progress` (or `idle` then first commit). The planner decides the exact idle-vs-in_progress entry transition.

### Persistence Survival (WIZ-06 core)
- **D-05: Per-step commit, persisted via the existing `personal` root.** Each answer is committed to the slice as its step completes (one action per step), and because the slice lives under the already-persisted `personal` root (redux-persist → IndexedDB), each commit is durable. A forced reload (Gist sync, service-worker update, admin lock/unlock — the app's reload-as-recovery idiom from Phase 2 D-02) re-reads the persisted blob and prior answers survive. No new persist config, no manual storage writes — registering the reducer under `personalReducer` is sufficient.
- **D-06: Tolerate older persisted blobs (defensive defaults).** Following the established selector pattern (Architecture.md: selectors defensively default missing slices with `?? {}` / `?? []` to tolerate blobs predating newer slices), the wizard selectors must return a safe default when the `wizard` slice is absent from an older persisted `personal` blob — never throw. This matters because existing users have a persisted `personal` root without a `wizard` key.

### DishScorer Characterization Tests
- **D-07: All 5 methods, golden fixtures.** Pin current output for `score`, `scoreWithInventory`, `scoreCookNow`, `group`, and `groupCookNow` using golden/snapshot fixtures — representative dish/ingredient/inventory inputs in, captured current output asserted. Rationale: success criterion 4 requires later changes can't silently regress suggestions; covering all five (not just the wizard's immediate path) protects the whole suggester surface that Phase 4 touches. The fixtures must be deterministic (stable ordering — the methods already sort by score then missing-count) and capture the *current* behavior as the baseline, not an idealized one. These are characterization tests: if current output looks odd, pin it as-is and note it, don't "fix" it this phase.
- **D-08: Co-locate with the existing test convention.** Place tests next to the existing reducer-test pattern (`*.test.ts` co-located, per `CookingSessionReducer.test.ts`). `DishScorer` tests live beside `DishScorer.ts` in `src/Modules/DishSuggester/Helpers/`. The planner confirms the Jest/CRA test runner setup already in use (per TESTING.md) rather than introducing a new harness.

### Claude's Discretion
- Exact file names and locations: `WizardReducer.ts` under `src/Store/Reducers/`, the `WizardState` model under `src/Store/Models/`, mirroring the existing slice/model split.
- The concrete set of typed answer fields and the exact step-key union values (seed with the Phase-4 steps that are inferable from WIZ-01..05, but Phase 4 owns the final set).
- The precise `status` enum values and the idle↔in_progress↔completed transition rules, as long as D-04's resume/restart semantics hold.
- Selector names and granularity (e.g. one `selectWizard*` family), following the `src/Store/Selectors.ts` `createSelector` + defensive-default conventions.
- Golden fixture format (inline literals vs. fixture files, Jest `toMatchSnapshot` vs. explicit `toEqual` against committed expected values) — pick whichever is most readable and deterministic.
- Whether to add a small set of action-creator unit tests beyond the persistence-shape invariant.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` — **FND-03** (wizard state in an RTK slice under existing `personal` root, selector-only reads, no new persisted root) and **WIZ-06** (answers persist per step, resume after reload/interruption). These two are this phase's entire requirement scope. WIZ-01..05, WIZ-07, NAV-* are Phase 4; do not build them here.
- `.planning/ROADMAP.md` §"Phase 3: Wizard State Slice" — goal + 4 success criteria (persisted slice via selectors, per-step commit survives forced reload, resume-from-last-step on mount, `DishScorer` characterization tests).

### Codebase maps (this milestone)
- `.planning/codebase/ARCHITECTURE.md` — §"State Layer" (slice + selectors + models split), §"Data Flow → Primary Request Path" (dispatch → Immer reducer → redux-persist → IndexedDB), §"Anti-Patterns → Direct raw state access" (the FND-03 mandate: always read via `Selectors.ts`), §"Architectural Constraints → Schema tolerance" (selectors defensively default missing slices — informs D-06).
- `.planning/codebase/CONVENTIONS.md` — slice/action-creator naming, single-object exports, `strict: false` (guard manually), co-located `*.test.ts` convention, match surrounding indentation/quote style.
- `.planning/codebase/TESTING.md` — existing Jest/CRA unit-test setup; the basis for the reducer tests and `DishScorer` golden tests (D-07, D-08).
- `.planning/codebase/STRUCTURE.md` §"Where to Add New Code" — `src/Store/Reducers/`, `src/Store/Models/`, `src/Store/Selectors.ts` locations and path aliases (`@store/*`).

### Key source files (integration points / patterns to mirror)
- `src/Store/Store.ts` — the `personalReducer` `combineReducers` where the new `wizard` reducer is registered (no new persist root); the `persist:personal` config to leave untouched.
- `src/Store/Reducers/SmartPlannerTemplateReducer.ts` — smallest clean `createSlice` exemplar (initial state, normalize helper, renamed action exports, capped list) — closest analog for the wizard slice shape.
- `src/Store/Reducers/CookingSessionReducer.test.ts` — the co-located reducer-test pattern to mirror (D-08).
- `src/Store/Reducers/AppContextReducer.ts` — defines `HouseholdPreferenceProfile`; the wizard answer model should map onto / compose this rather than duplicate it (D-01).
- `src/Store/Selectors.ts` — `createSelector` + defensive-default (`?? {}` / `?? []`) conventions for the new wizard selectors (D-06).
- `src/Modules/DishSuggester/Helpers/DishScorer.ts` — the 5 methods to characterize (`score`, `scoreWithInventory`, `scoreCookNow`, `group`, `groupCookNow`) and their input signatures (D-07). Note `scoreCookNow` takes a `HouseholdPreferenceProfile` — the link between the wizard answers (D-01) and the suggester.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SmartPlannerTemplateReducer.ts`: cleanest minimal `createSlice` template (normalize-on-write, renamed action creators, `export default ...reducer`) — copy its shape for `WizardReducer`.
- `HouseholdPreferenceProfile` type (`AppContextReducer.ts`): the profile `DishScorer.scoreCookNow` consumes; the wizard's typed answer fields should compose/produce a subset of it.
- Existing `createSelector` selectors in `Selectors.ts` with defensive defaulting — direct pattern for wizard selectors that must tolerate a missing `wizard` key in older `personal` blobs.
- Co-located `CookingSessionReducer.test.ts` — the unit-test pattern (runner already configured per TESTING.md).

### Established Patterns
- Two persisted roots only (`shared`, `personal`); new personal slices are added to `personalReducer`'s `combineReducers` — no new persist config needed (the whole `personal` root is already persisted to IndexedDB).
- Reads always go through `src/Store/Selectors.ts`; raw `state.personal.*` access is a documented anti-pattern (this is FND-03's enforcement point).
- Selectors default missing slices (`?? []`, `?? {}`) to tolerate blobs predating newer slices — required here since existing users' `personal` blob has no `wizard` key.
- `DishScorer` methods are pure and already deterministic (sort by score, then missing-count) — they snapshot cleanly with fixed inputs.

### Integration Points
- `WizardReducer` registers in `personalReducer` in `src/Store/Store.ts` (the only Store.ts edit).
- `WizardState` model under `src/Store/Models/` (mirrors existing `@store/Models/*`).
- New `selectWizard*` selectors in `src/Store/Selectors.ts` — the sole read path Phase 4 will use.
- `DishScorer.test.ts` beside `DishScorer.ts`; no production code in `DishScorer.ts` changes.

</code_context>

<specifics>
## Specific Ideas

- WIZ-06's "survives the app's sync/service-worker reload" maps directly to Phase 2 D-02's reload-as-recovery idiom: the proof is that a per-step commit lands in the persisted `personal` blob *before* any reload, so rehydration restores it. The reducer tests should assert the persistence-shape invariant (committed answer is in the slice state that redux-persist would serialize), not mock IndexedDB.
- Step position is a **string key, never an index** — so Phase 4 can reorder/insert steps without breaking anyone's mid-flow persisted state (D-03).
- Characterization tests pin **current** behavior as the baseline. If a current `DishScorer` output looks surprising, capture it as-is and leave a note — correcting scoring is explicitly out of scope this phase.

</specifics>

<deferred>
## Deferred Ideas

- Wizard step UI, hero entry, progress indicator, per-step "Tùy bạn" skip defaults → Phase 4 (WIZ-01..05, WIZ-07).
- Wiring the wizard result into `DishSuggester` and `addScheduledMeal` → Phase 4 (WIZ-04, WIZ-05).
- v2 wizard answer fields: portion step, fridge/inventory filter, remembered defaults, "why this dish" reasoning → Phase 6 (WIZ2-01..05).
- Migrating any wizard-related copy to `AppCopy` → Phase 5 (COPY-03).
- Refactoring or improving `DishScorer` scoring logic — this phase only pins it; any change is a separate, later effort.

</deferred>

---

*Phase: 3-Wizard State Slice*
*Context gathered: 2026-06-15*
