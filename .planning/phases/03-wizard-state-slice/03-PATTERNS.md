# Phase 3: Wizard State Slice - Pattern Map

**Mapped:** 2026-06-15
**Files analyzed:** 6 (4 new, 2 modified)
**Analogs found:** 6 / 6

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/Store/Reducers/WizardReducer.ts` (new) | reducer (RTK slice) | event-driven (per-step commit) | `src/Store/Reducers/SmartPlannerTemplateReducer.ts` | exact (role + minimal createSlice) |
| `src/Store/Models/Wizard.ts` (new) | model | transform (state shape) | `src/Store/Models/SmartPlannerTemplate.ts` | exact |
| `src/Store/Store.ts` (modify) | config (combineReducers) | request-response (registration) | self — existing `personalReducer` entries | exact (same file, add one line) |
| `src/Store/Selectors.ts` (modify) | selector | request-response (read path) | `src/Store/Selectors.ts` (`selectSmartPlannerTemplates`, `createSelector` family) | exact |
| `src/Store/Reducers/WizardReducer.test.ts` (new) | test | event-driven (reducer assertions) | `src/Store/Reducers/CookingSessionReducer.test.ts` | exact |
| `src/Modules/DishSuggester/Helpers/DishScorer.test.ts` (new) | test | transform (golden/characterization) | `CookingSessionReducer.test.ts` (Jest harness) + `DishScorer.ts` (subject) | role-match (no existing golden test) |

**Test runner (confirmed):** `react-scripts test` (CRA + Jest, preset `react-app/jest`). `@testing-library/jest-dom` available. No new harness needed (D-08). Tests are plain `.test.ts` co-located beside the file under test.

---

## Pattern Assignments

### `src/Store/Models/Wizard.ts` (model, transform)

**Analog:** `src/Store/Models/SmartPlannerTemplate.ts`

The model file holds the `WizardState` interface plus the answer/status/step-key types. Mirror the analog's split: a payload/entity type + a `*State` interface. Compose `HouseholdPreferenceProfile` rather than duplicate it (D-01).

**Analog shape** (`SmartPlannerTemplate.ts` lines 9-19):
```typescript
export type SmartPlannerTemplate = {
    id: string;
    name: string;
    createdAt: string;
    mealSlotDishRanges: SmartPlannerMealSlotDishRanges;
    mealSlotTagRequirements: SmartPlannerMealSlotTagRequirements;
}

export interface SmartPlannerTemplateState {
    templates: SmartPlannerTemplate[];
}
```

**Compose, don't duplicate, the profile** — import the type (it lives in `AppContextReducer.ts`, NOT the Models folder; match the import path `DishScorer.ts` uses, line 11):
```typescript
import type { HouseholdPreferenceProfile } from "@store/Reducers/AppContextReducer";
```

**`HouseholdPreferenceProfile` fields the wizard answer maps onto** (`AppContextReducer.ts` lines 46-63 — reference for D-01; the wizard collects a subset):
```typescript
export type HouseholdPreferenceProfile = {
    servingCount: number;       // wizard "servings" step
    maxCookMinutes: number;     // wizard "time" step
    maxExtraCost?: number;
    preferredTags: string[];    // wizard preference step
    avoidedTags: string[];
    // ...favoriteDishIds, avoidedDishIds, favoriteIngredientIds, avoidedIngredientIds,
    //    allergenIngredientIds, hardExcludedIngredientIds, nutritionGoalId,
    //    memberIds, memberNames, notes, mealSlotTimes
}
```

**Suggester signatures the answer model must feed** (from `DishScorer.ts`):
- `score(dishes, selectedIngredientIds: string[], allDishes)` (line 275) — wizard supplies `selectedIngredientIds: string[]`.
- `scoreCookNow(dishes, inventory, allDishes, allIngredients, profile: HouseholdPreferenceProfile, ...)` (lines 311-318) — wizard supplies a derivable `HouseholdPreferenceProfile` subset.

**Model guidance for the planner (D-01, D-03, D-04):**
- Typed known fields: `selectedIngredientIds: string[]`, plus the `HouseholdPreferenceProfile`-relevant choices (`servingCount`, `maxCookMinutes`, `preferredTags`, `avoidedTags`). Express these as a `Partial<HouseholdPreferenceProfile>`-shaped sub-object or named fields, NOT a copy of the full type.
- Extensible bag: a typed-but-open structure (e.g. `extras?: Record<string, unknown>`) so Phase 4 adds step answers without a slice migration.
- Step key: a **string union** with known values seeded, kept open (e.g. `type WizardStepKey = 'ingredients' | 'servings' | 'time' | 'preferences' | 'result' | (string & {})`). Never a numeric index (D-03).
- Status enum: `'idle' | 'in_progress' | 'completed'` (D-04).

---

### `src/Store/Reducers/WizardReducer.ts` (reducer, event-driven)

**Analog:** `src/Store/Reducers/SmartPlannerTemplateReducer.ts` (the cleanest minimal `createSlice` exemplar).

**Imports + initial state pattern** (analog lines 1-9) — note model imported via `@store/Models/*` alias:
```typescript
import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { SmartPlannerTemplate, SmartPlannerTemplateState } from '@store/Models/SmartPlannerTemplate';

const initialState: SmartPlannerTemplateState = {
    templates: [],
};
```
For the wizard: import `WizardState` (+ answer/step-key types) from `@store/Models/Wizard`; initial state seeds `status: 'idle'`, the first step key, and empty answers.

**createSlice + named reducers + Immer mutation** (analog lines 25-50) — Immer in-place mutation is the house style:
```typescript
export const smartPlannerTemplateSlice = createSlice({
    name: 'smartPlannerTemplate',
    initialState,
    reducers: {
        addSmartPlannerTemplate: (state, action: PayloadAction<SmartPlannerTemplate>) => {
            const next = normalizeTemplate(action.payload);
            if (!next) return;
            state.templates = [next, ...state.templates.filter(t => t.id !== next.id)].slice(0, MAX_TEMPLATES);
        },
        // ...
    },
});
```

**Renamed action-creator exports + default reducer export** (analog lines 52-58) — REPLICATE EXACTLY (this is the `import reducer, { actionCreator }` contract the tests and Store.ts rely on):
```typescript
export const {
    addSmartPlannerTemplate,
    updateSmartPlannerTemplate,
    removeSmartPlannerTemplate,
} = smartPlannerTemplateSlice.actions;

export default smartPlannerTemplateSlice.reducer;
```

**Optional normalize-on-write helper** (analog lines 11-23) — the analog defends every write with a `normalize*` guard that returns `null`/safe defaults on bad input (matches `strict: false`, guard-manually convention). Apply the same defensive style to the commit reducer if the planner adds one.

**Wizard-specific reducers the planner defines (D-04, D-05):**
- `commitWizardAnswer` — merge a per-step answer into `state.answers` (per-step commit; this is the WIZ-06 durability point — each commit lands in the persisted slice).
- `advanceWizardStep` / `goBackWizardStep` — set `state.currentStep` to a string key; set `status: 'in_progress'`.
- `resumeWizard` — no-op-on-mount semantics: do NOT reset; the persisted `status`/`currentStep` already drive resume (D-04). May exist only to mark `in_progress` if needed.
- `restartWizard` — clear answers, reset to first step, set status (`idle`→ first commit, or `in_progress`); terminal `completed` only exits via this (D-04).
- `completeWizard` — set `status: 'completed'`.

---

### `src/Store/Store.ts` (config — single-line registration)

**Analog:** the existing `personalReducer` block (self, lines 23-31). No new persist root, no new persist config (D-05).

**Import (add beside line 13):**
```typescript
import WizardReducer from "./Reducers/WizardReducer";
```

**Register inside `personalReducer` combineReducers (lines 23-31) — add ONE key:**
```typescript
const personalReducer = combineReducers({
    appContext: AppContextReducer,
    inventory: InventoryReducer,
    shoppingList: ShoppingListReducer,
    scheduledMeal: ScheduledMealReducer,
    cookingSession: CookingSessionReducer,
    householdHealth: HouseholdHealthReducer,
    smartPlannerTemplate: SmartPlannerTemplateReducer,
    wizard: WizardReducer,            // ← the only Store.ts edit
});
```
**Leave untouched:** `personalPersistConfig` (lines 38-41) and the `persistReducer(personalPersistConfig, personalReducer)` line — the whole `personal` root is already persisted to IndexedDB, so registration alone makes wizard durable (D-05).

---

### `src/Store/Selectors.ts` (selector — defensive-default read path, FND-03)

**Analog:** `selectSmartPlannerTemplates` (line 54) — the canonical "tolerate older blobs" pattern, plus the `createSelector` family for derived reads.

**Defensive optional-chaining default** (line 53-54) — THE pattern for D-06 (existing users' `personal` blob has no `wizard` key):
```typescript
// `?? []` tolerates devices whose persisted personal blob predates the smartPlannerTemplate slice.
export const selectSmartPlannerTemplates = (state: RootState) =>
    state.personal.smartPlannerTemplate?.templates ?? [];
```
Wizard selectors MUST use `state.personal.wizard?.<field> ?? <safe default>` — never `state.personal.wizard.field` (would throw on old blobs). Mirror the explanatory comment.

**Other defensive defaults in file for reference** (lines 49-51, 60-65): `?? {}` for record-shaped slices, `?? []` for arrays.

**`createSelector` for derived reads** (lines 16-19, 113-116) — use for "is resumable" and any computed read:
```typescript
import { createSelector } from "reselect";

export const selectHouseholdPreferenceProfile = createSelector(
    [selectAppContext, selectSelectedHouseholdMembers],
    (appContext, selectedMembers) => buildHouseholdPreferenceProfile(appContext.householdPreferenceProfile, selectedMembers)
);
```

**Base raw-access selector style** (line 52) — `selectAppContext = (state) => state.personal.appContext`. Add a base `selectWizard` returning the slice (with `?? defaultWizardState`), then build the family off it.

**Wizard selector family the planner adds (D-06, FND-03 — sole read path):**
- `selectWizardStep` → `state.personal.wizard?.currentStep ?? <first-step-key>`
- `selectWizardAnswers` → `state.personal.wizard?.answers ?? {}`
- `selectWizardStatus` → `state.personal.wizard?.status ?? 'idle'`
- `selectIsWizardResumable` → `createSelector([selectWizardStatus], status => status === 'in_progress')`

Place under the `// ── Personal ──` section (after line 54, beside `selectSmartPlannerTemplates`).

---

### `src/Store/Reducers/WizardReducer.test.ts` (test, event-driven)

**Analog:** `src/Store/Reducers/CookingSessionReducer.test.ts` (the co-located reducer-test pattern, D-08).

**Import + describe/it structure** (analog lines 5-8) — `import reducer, { actionCreator }` + `import type { State }`, then a `describe` per slice with behavioral `it` blocks:
```typescript
import reducer, { clearCookingHistory } from './CookingSessionReducer';
import type { CookingSessionState } from './CookingSessionReducer';

describe('CookingSessionReducer', () => {
    it('keeps durable feedback and cook-time data when clearing cooking history', () => {
        const initialState: CookingSessionState = { /* explicit literal */ };
        const nextState = reducer(initialState, clearCookingHistory());
        expect(nextState.sessions).toHaveLength(1);
        expect(nextState.sessions[0].id).toBe('active-session');
        // ...
    });
});
```

**Key conventions to replicate:**
- Drive the reducer directly: `reducer(initialState, actionCreator(payload))` — no store, no mocks of redux-persist.
- Build `initialState` as an explicit typed literal in each test (the analog inlines the whole state object).
- Assert with `toHaveLength` / `toBe` / `toEqual` against concrete expected values.
- `jest.mock('nanoid', ...)` only if the reducer uses `nanoid` (analog lines 1-3) — wizard likely does NOT need this unless it generates IDs.

**Wizard test cases (from CONTEXT in-scope list + D-05 invariant):**
- commit → answer present in slice state (the persistence-shape invariant: assert the committed answer is in the state redux-persist would serialize — do NOT mock IndexedDB, per Specifics).
- advance / back → `currentStep` is the expected string key; `status === 'in_progress'`.
- resume → in-progress state is preserved unchanged on a no-op resume (does not reset).
- restart → answers cleared, step reset, status per D-04.
- defensive: reducer handles missing/partial answer payloads safely.

---

### `src/Modules/DishSuggester/Helpers/DishScorer.test.ts` (test, characterization/golden)

**Analog (harness):** `CookingSessionReducer.test.ts` (same Jest `describe`/`it`/`expect` shape). **Subject:** `DishScorer.ts` (read; do NOT modify — D-07).

**The 5 methods to pin and their EXACT signatures** (from `DishScorer.ts`):
```typescript
DishScorer.score(dishes: Dishes[], selectedIngredientIds: string[], allDishes: Dishes[]): ScoredDish[]                                    // line 275
DishScorer.scoreWithInventory(dishes, inventory: Record<string, IngredientInventory>, allDishes, allIngredients: Ingredient[], inventoryConfig?): ScoredDish[]   // line 306
DishScorer.scoreCookNow(dishes, inventory, allDishes, allIngredients, profile: HouseholdPreferenceProfile, inventoryConfig?, nutritionGoal?): ScoredDish[]        // line 311
DishScorer.group(scored: ScoredDish[]): ScoredDishGroup[]                                                                                  // line 375
DishScorer.groupCookNow(scored: ScoredDish[]): ScoredDishGroup[]                                                                           // line 395
```

**Determinism (D-07) — the sorts to rely on for stable golden output:**
- `score` sorts by `score` desc, then `missingIngredientIds.length` asc (lines 300-303).
- `scoreWithInventory` sorts by `compareInventoryPriority` (urgent first, then days-left, then score, then missing-count — lines 103-117, 308).
- `scoreCookNow` sorts by `cookNowScore` desc then `compareInventoryPriority`, capped `.slice(0, 60)` (lines 367-372).
- `group` buckets by score thresholds `>=1 / >=0.5 / else`, drops empty groups (lines 375-393).
- `groupCookNow` buckets by missing-count/score, sorts each group by `cookNowScore ?? score` desc, drops empty (lines 395-414).

**Imports the fixtures need** (mirror `DishScorer.ts` imports, lines 1-11): `Dishes`, `DishesIngredientAmount` from `@store/Models/Dishes`; `Ingredient`, `IngredientInventory` from `@store/Models/Ingredient`; `HouseholdPreferenceProfile` from `@store/Reducers/AppContextReducer`. Use `DEFAULT_HOUSEHOLD_PREFERENCE_PROFILE` (`AppContextReducer.ts` line 118) as a fixture base for `scoreCookNow`.

**Characterization approach (D-07, Claude's discretion on format):**
- Build small deterministic fixtures: a handful of `Dishes`, `Ingredient`, and an `inventory` record map. Keep `isAccompaniment` set sensibly — scorer filters `isAccompaniment === true` out (lines 141, 283).
- Capture CURRENT output as the baseline. `toMatchSnapshot()` is acceptable given deterministic sorts; explicit `toEqual(<committed expected>)` is more readable for the grouped/score outputs. Pick one and be consistent.
- If any current output looks surprising, PIN IT AS-IS and leave a code comment noting it — correcting scoring is out of scope (Specifics, D-07).
- `scoreWithInventory`/`scoreCookNow` return `[]` when inventory is empty (line 134) — include a non-empty inventory fixture to exercise real paths.

---

## Shared Patterns

### Defensive-default selector (D-06 — applies to ALL wizard selectors)
**Source:** `src/Store/Selectors.ts` line 53-54
```typescript
// `?? []` tolerates devices whose persisted personal blob predates the smartPlannerTemplate slice.
export const selectSmartPlannerTemplates = (state: RootState) =>
    state.personal.smartPlannerTemplate?.templates ?? [];
```
**Apply to:** every `selectWizard*`. Optional-chain `state.personal.wizard?.…` and default missing slice/fields (`?? 'idle'`, `?? {}`, `?? <first-step-key>`). Reads go ONLY through `Selectors.ts` (FND-03) — no component touches `state.personal.wizard.*`.

### Renamed action exports + default reducer (slice contract)
**Source:** `src/Store/Reducers/SmartPlannerTemplateReducer.ts` lines 52-58
**Apply to:** `WizardReducer.ts` — destructure `slice.actions` into named exports, `export default slice.reducer`. This is what `Store.ts` imports as `WizardReducer` and what the test imports as `reducer, { commitWizardAnswer, ... }`.

### combineReducers registration (no new persist root — D-05)
**Source:** `src/Store/Store.ts` lines 23-31
**Apply to:** add `wizard: WizardReducer` to `personalReducer` only. Persistence is automatic.

### Reducer-test harness (direct reducer invocation, no store/IndexedDB mock)
**Source:** `src/Store/Reducers/CookingSessionReducer.test.ts` lines 5-86
**Apply to:** `WizardReducer.test.ts` — `reducer(initialState, action())` + explicit typed `initialState` literal + `expect(...).toEqual/toBe/toHaveLength`.

### Immer in-place mutation in reducers
**Source:** `SmartPlannerTemplateReducer.ts` lines 29-48 (`state.templates = ...`, `state.templates[index] = next`)
**Apply to:** wizard reducers — mutate `state.answers` / `state.currentStep` / `state.status` directly; createSlice wraps Immer.

### Defensive normalize-on-write guard (optional, matches `strict: false`)
**Source:** `SmartPlannerTemplateReducer.ts` lines 11-23 (returns `null` on bad input, reducer early-returns)
**Apply to:** commit reducer if payload validation is warranted.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| (none) | — | — | Every new file has a strong codebase analog. The only partial gap is the golden-test FORMAT (no existing characterization/snapshot test in repo), but the Jest harness, imports, and subject signatures are all confirmed — format is Claude's discretion per D-07. |

## Metadata

**Analog search scope:** `src/Store/Reducers/`, `src/Store/Models/`, `src/Store/Selectors.ts`, `src/Store/Store.ts`, `src/Modules/DishSuggester/Helpers/`
**Files scanned:** 7 (CONTEXT.md + 6 analogs/subjects)
**Test runner confirmed:** `react-scripts test` (CRA/Jest, `react-app/jest` preset) via package.json
**Pattern extraction date:** 2026-06-15
