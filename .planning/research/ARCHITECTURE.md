# Architecture Research

**Domain:** UI/UX refactor — guided meal-planning wizard, app-wide Vietnamese copy module, and mobile-first interaction patterns layered onto an existing React 18 + RTK + Ant Design 5 local-first PWA
**Researched:** 2026-06-14
**Confidence:** HIGH

> **Integration note, not a rewrite.** This milestone reframes existing capability. The "what to cook" logic already lives in `DishSuggester.screen.tsx` (a 4-mode, 2-step antd `Modal` that reads everything through selectors and ends in `startCooking`). The wizard wraps and re-sequences those primitives into a guided journey that ends in `addScheduledMeal`. Every recommendation below plugs into the existing feature-module + split-Redux (`shared`/`personal`) + selectors-only architecture. No new domain, no new persisted root, no new state shape for dishes/inventory/meals.

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│  ENTRY POINTS (reframed, not removed)                                  │
│  ┌──────────────────┐   ┌────────────────────┐   ┌─────────────────┐  │
│  │ Home Dashboard    │   │ Bottom nav center  │   │ Existing        │  │
│  │ hero CTA          │   │ "Nấu gì?"          │   │ DishSuggester   │  │
│  │ "Hôm nay ăn gì?"  │   │ (MasterPage)       │   │ entry points    │  │
│  └────────┬─────────┘   └─────────┬──────────┘   └────────┬────────┘  │
│           └────────────────┬──────┴───────────────────────┘            │
├────────────────────────────┼──────────────────────────────────────────┤
│  WIZARD FEATURE (new — src/Modules/MealPlanWizard)                     │
│  ┌─────────────────────────▼───────────────────────────────────────┐  │
│  │  MealPlanWizard.screen.tsx   (container / orchestrator)          │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────────────┐ │  │
│  │  │ WhoStep│ │TimeStep│ │Fridge  │ │Result  │ │ ActionStep     │ │  │
│  │  │.widget │ │.widget │ │Step    │ │Step    │ │ (→ schedule)   │ │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────────────┘ │  │
│  └──────┬─────────────────────────────────────────────┬───────────┘  │
├─────────┼───── reads (selectors only) ─────────────────┼──────────────┤
│  STATE LAYER (src/Store)                       writes (dispatch)       │
│  ┌──────────────────────────┐         ┌────────────────────────────┐  │
│  │ shared root              │         │ personal root              │  │
│  │  dishes, ingredient,     │         │  scheduledMeal  ← addMeal  │  │
│  │  config (read-only here) │         │  appContext (members,prefs)│  │
│  └──────────────────────────┘         │  inventory (read)          │  │
│                                        │  mealPlanWizard ← NEW slice│  │
│                                        │  shoppingList ← optional   │  │
│                                        └────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────────┤
│  CROSS-CUTTING                                                          │
│  ┌──────────────────────────┐   ┌──────────────────────────────────┐  │
│  │ AppCopy (new strings mod) │   │ Shell pieces extracted from      │  │
│  │ src/Common/Copy/*         │   │ MasterPage: BottomTabNavigator,  │  │
│  │ typed `as const`          │   │ CookingPill, Sheet wrapper       │  │
│  └──────────────────────────┘   └──────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `MealPlanWizard.screen.tsx` | Orchestrates step order, renders the current step, drives the antd `Steps` indicator, owns next/back/skip, runs the final scoring + dispatch | Route screen under `src/Modules/MealPlanWizard/Screens`; reads `current`/answers from the wizard slice, reads domain data via selectors |
| Step widgets (`WhoStep`, `TimeStep`, `FridgeStep`, `ResultStep`, `ActionStep`) | One question per screen; each is a thin presentational view over existing selectors + one answer-dispatch | `.widget.tsx` files; props in, dispatch out; no direct `state.*` access |
| `MealPlanWizardReducer.ts` | Holds transient wizard state (step index, per-step answers, last-session defaults) so a half-finished flow survives reload | RTK `createSlice` in the **personal** persisted root |
| `AppCopy` strings module | Single source of truth for user-facing Vietnamese copy (labels, prompts, empty states, toasts) | Typed `const ... as const` object(s) under `src/Common/Copy`; mirrors the existing `COMMON_MESSAGE` precedent |
| `Sheet` wrapper (`@components/Sheet`) | App-standard mobile bottom-sheet for pickers/confirmations inside steps | Thin wrapper over antd `Drawer placement="bottom"`, themed by `ConfigProvider` |
| Extracted shell pieces (`BottomTabNavigator`, `CookingPill`, `DataBackup`) | Mobile chrome split out of the 1300-line `MasterPage.tsx` so journey/responsive work is safe to do | Own files under `src/Routing` (or a `src/Routing/Shell` folder), each consuming existing contexts/selectors |
| `DishScorer` (existing) | Scoring/grouping of dishes by ingredients/inventory | Reused as-is from `src/Modules/DishSuggester/Helpers/DishScorer.ts` |

## Recommended Project Structure

```
src/
├── Modules/
│   ├── MealPlanWizard/                          # NEW feature module (vertical slice)
│   │   ├── Screens/
│   │   │   ├── MealPlanWizard.screen.tsx        # container/orchestrator (routed)
│   │   │   ├── WhoStep.widget.tsx               # "Ai ăn?" — household members/portions
│   │   │   ├── TimeStep.widget.tsx              # "Nấu nhanh hay nấu kỹ?" (duration)
│   │   │   ├── FridgeStep.widget.tsx            # "Trong bếp có gì?" (inventory filter)
│   │   │   ├── ResultStep.widget.tsx            # suggested dish(es) + one-line "why"
│   │   │   └── ActionStep.widget.tsx            # "Thêm vào bữa hôm nay" → schedule
│   │   ├── Routing/
│   │   │   ├── MealPlanWizardRouteConfig.ts     # CreateRoutes('/meal-plan', ...)
│   │   │   └── MealPlanWizardRouter.tsx         # nested <Outlet/> under MasterPage
│   │   └── Helpers/
│   │       └── MealPlanWizardHelper.ts          # answers → ScheduledMeal assembly
│   ├── DishSuggester/                           # EXISTING — reuse DishScorer + pieces
│   └── Home/Screens/Dashboard.screen.tsx        # add hero CTA launching the wizard
├── Store/
│   ├── Reducers/MealPlanWizardReducer.ts        # NEW slice (personal root)
│   ├── Selectors.ts                             # ADD wizard selectors here
│   └── Store.ts                                 # register reducer under personalReducer
├── Components/
│   └── Sheet/                                   # NEW @components/Sheet (Drawer bottom)
│       ├── Sheet.tsx
│       └── index.ts
├── Common/
│   └── Copy/                                    # NEW app-wide strings module
│       ├── AppCopy.ts                           # typed `as const`, namespaced
│       └── index.ts
└── Routing/
    ├── MasterPage.tsx                           # SLIM DOWN: delegate to extracted pieces
    └── Shell/                                   # NEW home for extracted chrome
        ├── BottomTabNavigator.tsx
        ├── CookingPill.tsx
        └── DataBackup.tsx
```

### Structure Rationale

- **`src/Modules/MealPlanWizard/`:** The wizard is a journey over existing data, but it is a distinct screen flow with its own route, steps, and orchestration. Per `STRUCTURE.md`, a new user-facing flow with its own routes is a module (vertical slice with `Screens/`, `Routing/`, `Helpers/`). Putting it in its own module keeps `DishSuggester` (the existing power-user modal) intact and reachable, satisfying the "no capability loss" constraint.
- **`MealPlanWizardReducer.ts` in the personal root:** Wizard answers are per-device, not admin-published — same reasoning that puts `scheduledMeal`, `inventory`, and `appContext` in `personal`. Registering it there means redux-persist resume-after-reload comes for free, which is the offline-first win for a PWA.
- **`src/Common/Copy/`:** Copy is cross-cutting (touches every module + the shell), so it belongs in `Common`, next to `Constants/CommonMessage.ts` which is the existing precedent for a centralized Vietnamese string object. A single home makes the app-wide audit a one-folder review.
- **`src/Components/Sheet/`:** Follows the "wrap antd, never import it raw in features" convention — feature code imports `@components/Sheet`, not `antd` `Drawer`.
- **`src/Routing/Shell/`:** Gives the extracted `MasterPage` pieces a clear home without inventing a top-level dir; keeps them inside the Routing/shell layer they belong to.

## Architectural Patterns

### Pattern 1: Wizard slice in the personal root (resume-safe orchestration)

**What:** A dedicated RTK slice holds `currentStep` and an `answers` object (member ids, max minutes, on-hand ingredient ids, selected dish ids). The container reads it via selectors; steps dispatch answer actions. Because it lives in the `personal` persisted root, an interrupted flow resumes after reload.
**When to use:** This is the recommended default — the PWA goal explicitly values not losing progress on interruption.
**Trade-offs:** Slightly more wiring than local `useState`, but matches the established `createSlice` + selector convention exactly and is migration-safe (selectors already default missing slices with `?? {}`, and `serializableCheck` is off).

**Example:**
```typescript
// src/Store/Reducers/MealPlanWizardReducer.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface MealPlanWizardState {
    currentStep: number;
    memberIds: string[];        // mirrors selected household members
    maxMinutes?: number;        // TimeStep answer (skippable)
    onHandIngredientIds: string[];
    selectedDishIds: string[];
    lastAnswers?: Partial<MealPlanWizardState>;  // remembered defaults
}

const initialState: MealPlanWizardState = {
    currentStep: 0, memberIds: [], onHandIngredientIds: [], selectedDishIds: [],
};

export const mealPlanWizardSlice = createSlice({
    name: 'mealPlanWizard',
    initialState,
    reducers: {
        goToStep: (s, a: PayloadAction<number>) => { s.currentStep = a.payload; },
        setMaxMinutes: (s, a: PayloadAction<number | undefined>) => { s.maxMinutes = a.payload; },
        toggleDish: (s, a: PayloadAction<string>) => {
            s.selectedDishIds = s.selectedDishIds.includes(a.payload)
                ? s.selectedDishIds.filter(id => id !== a.payload)
                : [...s.selectedDishIds, a.payload];
        },
        resetWizard: () => initialState,
    },
});
export const { goToStep, setMaxMinutes, toggleDish, resetWizard } = mealPlanWizardSlice.actions;
export default mealPlanWizardSlice.reducer;
```

### Pattern 2: Steps read through selectors, never raw state (selectors-only contract)

**What:** Each step pulls domain data from the same selectors `DishSuggester` already uses, and scores with the same `DishScorer` helper. No step reads `state.shared.*` / `state.personal.*` directly.
**When to use:** Always — `Selectors.ts` mandates this in its header; it preserves memoization and tolerates older persisted blobs.
**Trade-offs:** None meaningful; it is the house style. New derived needs get a new memoized selector, not inline access.

**Example:**
```typescript
// FridgeStep reads exactly what DishSuggester's "inventory" mode reads:
const dishes        = useSelector(selectDishes);
const inventory     = useSelector(selectInventory);
const allIngredients= useSelector(selectIngredients);
const invConfig     = useSelector(selectInventoryHealthConfig);
// same scoring path as today:
const scored = DishScorer.scoreWithInventory(dishes, inventory as any, dishes, allIngredients, invConfig);
```

### Pattern 3: Typed `as const` copy module with derived key union

**What:** A namespaced constant object typed `as const`, plus a derived key type, so a missing/typo'd key fails at build (`enableTypeChecking: true` is already on). Mirrors `COMMON_MESSAGE`.
**When to use:** For the app-wide Vietnamese copy pass and all new wizard strings.
**Trade-offs:** No runtime cost, fully greppable, no i18n provider/async loading (multi-locale is out of scope). The only discipline required is routing user-facing strings through the module instead of inlining them in JSX.

**Example:**
```typescript
// src/Common/Copy/AppCopy.ts
export const AppCopy = {
    mealWizard: {
        heroCta: "Hôm nay ăn gì?",
        whoTitle: "Nhà mình mấy người ăn?",
        timeTitle: "Nấu nhanh hay nấu kỹ?",
        anyChoice: "Tùy bạn",
        addToToday: "Thêm vào bữa hôm nay",
        doneToast: "Đã thêm vào bữa hôm nay",
    },
    empty: {
        noDishes: "Chưa có món nào — thêm món đầu tiên nhé",
    },
} as const;

type Leaves<T> = T extends string ? T : { [K in keyof T]: Leaves<T[K]> }[keyof T];
export type AppCopyValue = Leaves<typeof AppCopy>;
```

## Data Flow

### Request Flow (the hero journey)

```
[Tap "Hôm nay ăn gì?" on Home / bottom nav]
    ↓ navigate(MealPlanWizardRoutes.Start())
[MealPlanWizard.screen]  ── reads ──> selectors (dishes, inventory, members, prefs)
    ↓ render current step (reads wizard slice: currentStep, answers)
[Step widget]  ── dispatch ──> wizard slice answer action (goToStep/toggleDish/...)
    ↓ on Result step
[DishScorer.score / scoreWithInventory]  (existing helper, pure)
    ↓ on Action step ("Thêm vào bữa hôm nay")
dispatch(addScheduledMeal(meal))            → personal/scheduledMeal
dispatch(rememberScheduledMealName(name))   → personal/appContext
    ↓ (optional bridges)
dispatch(setSelectedHouseholdMemberIds(...))→ personal/appContext  (WhoStep)
<ShoppingListAddWidget .../>                → personal/shoppingList (missing ingredients)
dispatch(startCooking(...))                 → personal/cookingSession (cook now)
    ↓
[Confirmation: message.success(AppCopy.mealWizard.doneToast) + reset wizard]
```

### State Management

```
[personal root]  ←──────────────────────────────────────┐
   mealPlanWizard (currentStep, answers, lastAnswers)     │ dispatch
        ↑ useSelector (memoized)                          │
   [MealPlanWizard.screen + steps]  ── answer actions ────┘
        ↑ read-only
[shared root: dishes/ingredient/config]  (never written by the wizard)
```

### Key Data Flows

1. **Reads (all via `Selectors.ts`):** `selectDishes`, `selectDishesById`, `selectIngredients`, `selectIngredientsById`, `selectInventory`, `selectInventoryHealthConfig`, `selectHouseholdMembers`, `selectSelectedHouseholdMemberIds`, `selectHouseholdPreferenceProfile`, `selectNutritionGoals`. These are the exact selectors `DishSuggester.screen.tsx` already consumes — the wizard adds no new read surface to the store, only new memoized selectors for its own slice (`selectMealPlanWizard`, `selectMealPlanWizardStep`).
2. **Primary write (success metric):** `addScheduledMeal(meal: ScheduledMeal)` into `personal/scheduledMeal`, paired with `rememberScheduledMealName`. The `ScheduledMeal` shape (`{ id, name, plannedDate, meals: {breakfast|lunch|dinner: string[]}, memberIds?, dishServings?, createdDate }`) is assembled in `MealPlanWizardHelper` from wizard answers + `nanoid()`. Reuse `ScheduledMealAddWidget`'s assembly logic as the reference.
3. **Member context write:** `WhoStep` writes through `setSelectedHouseholdMemberIds` (personal/appContext) — the same action `DishSuggester` uses — so the chosen "who's eating" set is shared with cooking/suggestion flows rather than duplicated.
4. **Optional bridges (P2):** missing-ingredient → `ShoppingListAddWidget` (reused component), and "cook now" → `startCooking` (existing CookingSession action). Both already wired in `DishSuggester`; the wizard reuses the same components/actions.
5. **Resume flow:** wizard slice persists with the `personal` root via redux-persist/IndexedDB; reopening the route rehydrates `currentStep` + answers automatically.

## Scaling Considerations

> Single-household, local-first, no backend — "scale" here means data volume per device and UI responsiveness, not concurrent users.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Typical household (tens of dishes) | No change. `DishScorer` over the full catalog is instant. Render one step per screen. |
| Large catalog (hundreds of dishes) | Keep scoring inside `useScheduledCalculation` (the existing deferred-calc hook `DishSuggester` uses) so the main thread stays responsive; show the `PendingCalculationBox` pattern while computing. |
| Many persisted slices / old blobs | Already handled: selectors default missing slices (`?? {}`/`?? []`); the new wizard slice is additive and migration-safe. |

### Scaling Priorities

1. **First bottleneck — main-thread scoring jank on the Result step:** reuse `useScheduledCalculation` exactly as `DishSuggester` does (`enabled` gated by step) rather than computing synchronously on render.
2. **Second bottleneck — `MasterPage.tsx` re-render cost:** the 1300-line shell re-rendering on every nav/state change is a latent mobile-perf risk; extracting `BottomTabNavigator`/`CookingPill` into memoized components reduces shell churn during the journey.

## Anti-Patterns

### Anti-Pattern 1: Forking DishSuggester logic into the wizard

**What people do:** Copy the scoring/inventory/duration logic out of `DishSuggester.screen.tsx` into new wizard steps.
**Why it's wrong:** Creates two divergent copies of the "what to cook" brain; bug fixes and tuning drift apart. Violates the "reframe, don't duplicate" intent.
**Do this instead:** Import and reuse `DishScorer`, `useScheduledCalculation`, `IngredientPickerWidget`, `DishSuggestionList`, and `ShoppingListAddWidget`. The wizard owns *sequencing and copy*, not scoring.

### Anti-Pattern 2: A second persisted root or local-only wizard state when resume is wanted

**What people do:** Hold wizard answers in `useState`/Context, or invent a new persist root.
**Why it's wrong:** Local state loses progress on reload (breaks the offline-first goal); a new root complicates the `shared`/`personal` contract that sync/backup depend on.
**Do this instead:** Add one slice to the existing `personal` root. (If a flow is *intentionally* ephemeral, `useReducer` is fine — but the meal wizard is the resume-worthy case.)

### Anti-Pattern 3: Inlining Vietnamese strings in JSX during the copy pass

**What people do:** Edit literals scattered across screens.
**Why it's wrong:** The cross-cutting audit can't verify coverage; English/jargon leftovers hide in components; terminology drifts ("Bữa hôm nay" vs "Bữa ăn").
**Do this instead:** Route user-facing strings through `AppCopy`. Migrate incrementally per module, but write all *new* wizard copy through the module from day one to avoid rework.

### Anti-Pattern 4: Doing mobile/journey work inside the monolithic MasterPage

**What people do:** Add wizard launch, bottom-sheet, and responsive tweaks directly into the 1300-line `MasterPage.tsx`.
**Why it's wrong:** The file already mixes shell, drawer, data-backup, cooking pill, and bottom nav; piling on makes it harder to test and riskier to change (flagged in codebase CONCERNS).
**Do this instead:** Extract `BottomTabNavigator`, `CookingPill`, `DataBackup` first, then do mobile tuning in the slimmed pieces.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| None new | — | The wizard touches no external service. It reads `shared` (admin-published dishes/ingredients) and writes `personal` only. Existing GitHub publish / Gist backup are unaffected because no persisted-root keys change. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| MealPlanWizard ↔ Store | selectors (read) / dispatch (write) | Reads via `Selectors.ts`; primary write `addScheduledMeal`. Never raw `state.*`. |
| MealPlanWizard ↔ DishSuggester | direct helper/component import | Reuse `DishScorer`, `useScheduledCalculation`, `IngredientPickerWidget`, `DishSuggestionList`. |
| MealPlanWizard ↔ ScheduledMeal | dispatch `addScheduledMeal` + reuse `ScheduledMealAddWidget` assembly | The journey's success metric. Mirror the `nanoid()` + `meals` shape from `ScheduledMealAdd.widget.tsx`. |
| MealPlanWizard ↔ ShoppingList | reuse `ShoppingListAddWidget` | Optional "thiếu nguyên liệu → đi chợ" bridge (P2). |
| MealPlanWizard ↔ AppContext | dispatch `setSelectedHouseholdMemberIds` | WhoStep shares the "who's eating" set with other flows. |
| Wizard launch ↔ Shell/Home | `navigate(MealPlanWizardRoutes.Start())` | Hero CTA on `Dashboard.screen.tsx`; bottom-nav "Nấu gì?" can point at the wizard or keep launching the existing modal — decide per UX. |
| Steps ↔ Sheet/Copy | `@components/Sheet`, `AppCopy` | Pickers go in a bottom sheet; all labels via the copy module. |

## Suggested Build Order

Dependency-ordered so each phase de-risks the next. Copy and shell work come before wizard UI so the wizard is built in the new voice on a clean shell.

1. **Copy module foundation (`AppCopy`).** Cross-cutting and zero-dependency. Establish `src/Common/Copy/AppCopy.ts` (typed `as const` + key union) seeded with wizard + empty-state namespaces. Front-loading this means every later screen/step is written through the module — no double work. The broad app-wide migration can roll out incrementally afterward.
2. **Shell extraction from `MasterPage.tsx`.** Pull `BottomTabNavigator`, `CookingPill`, and `DataBackup` into `src/Routing/Shell/`, and add the `@components/Sheet` wrapper (antd `Drawer placement="bottom"`). This makes mobile/journey work safe and is independent of the wizard. Verify navigation, cooking pill, and backup still behave after extraction.
3. **Wizard state slice (`MealPlanWizardReducer`) + selectors.** Register under `personalReducer` in `Store.ts`; add `selectMealPlanWizard*` to `Selectors.ts`. Pure state work, testable in isolation (follow the `CookingSessionReducer.test.ts` precedent). No UI yet.
4. **Wizard UI (`MealPlanWizard.screen` + steps).** Build the container and the P1 steps (Result + Action minimum: skip everything → suggestion → `addScheduledMeal`). Reuse `DishScorer`/`useScheduledCalculation`/`DishSuggestionList`. Wire route config + `RootRouter` + `RootRoutes`. This is the milestone's core success metric (reach a scheduled meal).
5. **Hero entry point on Home.** Add the "Hôm nay ăn gì?" CTA to `Dashboard.screen.tsx` and decide the bottom-nav center behavior. Without a discoverable launch, the journey is invisible.
6. **Mobile tuning + app-wide copy rollout.** Bump `ConfigProvider` tokens (`controlHeightLG`, `fontSize`) for ~44px touch targets, apply `size="large"` in the wizard, move pickers into `Sheet`. In parallel, complete the cross-cutting Vietnamese copy pass across remaining modules + nav through `AppCopy`.

> P2 enhancements (WhoStep portions, FridgeStep filter, inline add-to-shopping, remembered defaults, "why this dish") slot in after step 4/5 once the base flow is stable, reusing the same selectors/components.

## Sources

- Existing codebase (read this run): `src/Modules/DishSuggester/Screens/DishSuggester.screen.tsx` (4-mode 2-step modal, `startCooking` ending, selector reads), `src/Store/Store.ts` (split `shared`/`personal` roots), `src/Store/Reducers/ScheduledMealReducer.ts` + `Models/ScheduledMeal.ts` (`addScheduledMeal`, meal shape), `src/Store/Reducers/AppContextReducer.ts` (`setSelectedHouseholdMemberIds`, household prefs/members), `src/Modules/ScheduledMeal/Screens/ScheduledMealAdd.widget.tsx` (write path + `nanoid` assembly), `src/Common/Constants/CommonMessage.ts` (copy-object precedent), `src/Routing/MasterPage.tsx` (1300-line shell, bottom-nav "Nấu gì?"), `src/Routing/RootRoutes.ts` + route configs. — HIGH
- `.planning/codebase/ARCHITECTURE.md`, `STRUCTURE.md`, `CONVENTIONS.md` — feature-module + selectors-only + `@components` wrapper conventions, MasterPage oversize concern. — HIGH
- `.planning/research/STACK.md`, `FEATURES.md` (this milestone) — fixed stack, antd `Steps`/`Drawer`/`Segmented` primitives, wizard step anatomy, MVP priorities. — HIGH
- `.planning/PROJECT.md` — milestone goal, constraints (no rewrite, no capability loss, preserve persist roots), out-of-scope (multi-locale, backend). — HIGH

---
*Architecture research for: UI/UX refactor — guided wizard + Vietnamese copy + mobile-first on React 18 / antd 5 / RTK (subsequent milestone, brownfield integration)*
*Researched: 2026-06-14*
