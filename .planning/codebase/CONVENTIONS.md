# Coding Conventions

**Analysis Date:** 2026-06-14

## Naming Patterns

**Files:**
- Components and screens use PascalCase with a role suffix: `DishesList.screen.tsx`, `DishesAdd.widget.tsx`, `CookingTimerNotifier.tsx`
  - `.screen.tsx` — routed top-level screen
  - `.widget.tsx` — composed sub-view rendered inside a screen
  - `.tsx` (no suffix) — leaf component or provider (e.g. `src/Components/Modal/ModalProvider.tsx`)
- Redux slices use PascalCase + `Reducer.ts`: `src/Store/Reducers/DishesReducer.ts`
- Models use PascalCase singular/domain names: `src/Store/Models/Ingredient.ts`
- Helpers use PascalCase + `Helper.ts`/`Helpers.ts`: `src/Common/Helpers/DishDurationHelper.ts`, `DateHelper.ts`
- Hooks use camelCase with `use` prefix: `src/Hooks/useToggle.ts`, `useScheduledCalculation.ts`
- Component directories are PascalCase: `src/Components/Button/`, `src/Modules/Dishes/`

**Functions:**
- camelCase for free functions and arrow helpers: `capitalizeFirstCharacter`, `finalizeRunningSegment`, `adjustDishFeedbackTally`
- React components are PascalCase function declarations: `function App() { ... }` (`src/App.tsx`)
- Helper modules export a single PascalCase object whose methods are camelCase, e.g. `DateHelpers.calculateDaysBetween` (`src/Common/Helpers/DateHelper.ts`)

**Variables:**
- camelCase for locals and props: `linkElement`, `nextState`, `elapsedSeconds`
- SCREAMING_SNAKE_CASE for module-level constants: `COOK_TIME_EMA_ALPHA`, `FEEDBACK_VALUES`, `INGREDIENT_UNITS`, `SYNC_CHECK_INTERVAL_MS`
- Redux selectors use `select` prefix: `selectDishes`, `selectIngredientsById` (`src/Store/Selectors.ts`)

**Types:**
- PascalCase for all types/interfaces: `CookingSessionState`, `StartCookingParams`, `IngredientUnit`
- Action-param object types use a `Params` suffix: `StartCookingParams`, `FinishCookingParams`, `DishesIngredientAddParams`
- Union string-literal types are preferred over enums: `type DishStatusFilter = "all" | "ready" | "needs_update" | ...`
- Both `type` and `interface` are used; `interface` tends to be used for slice state (`CookingSessionState`, `DishesState`), `type` for everything else

## Code Style

**Formatting:**
- No Prettier or formatter config detected. Style is enforced by convention only.
- Indentation is inconsistent across the tree: store/reducers/helpers use 4 spaces (`CookingSessionReducer.ts`, `DateHelper.ts`); CRA-generated files and e2e tests use 2 spaces (`src/index.tsx`, `tests/e2e/*.spec.ts`). Match the file you are editing.
- Quote style is mixed (double quotes dominate in `src/`, single quotes in e2e tests). Match the surrounding file.
- Semicolons are used.

**Linting:**
- ESLint via CRA preset only. Configured inline in `package.json`:
  ```json
  "eslintConfig": { "extends": ["react-app", "react-app/jest"] }
  ```
- No standalone `.eslintrc*` file. No custom rules beyond the CRA defaults.

**TypeScript:**
- `tsconfig.json` runs with `"strict": false` and `target: "es5"`. `any` appears in some helper signatures (`DateHelpers.calculateDaysBetween(from: any, to: any)`). Strict-null checks are not enforced by the compiler, so guard manually.
- Type checking is enabled during builds via `craco.config.js` (`typescript.enableTypeChecking: true`).

## Import Organization

**Order observed** (e.g. `src/Modules/Dishes/Screens/DishesList.screen.tsx`):
1. Third-party / antd icon and library imports
2. Path-aliased internal imports (`@components/*`, `@store/*`, `@hooks`, `@common/*`, `@routing/*`)
3. React itself (often mid-list, not strictly first)
4. Relative imports for sibling widgets/assets (`./DishesAdd.widget`, `../../../../assets/icons/...`)

Order is not strictly enforced; group by origin and keep it readable.

**Path Aliases** (defined in both `tsconfig.json` and `craco.config.js` — keep them in sync):
- `@components/*` → `src/Components/*`
- `@modules/*` → `src/Modules/*`
- `@routing/*` → `src/Routing/*`
- `@store/*` → `src/Store/*`
- `@common/*` → `src/Common/*`
- `@hooks` → `src/Hooks/index.ts` (single barrel entry, no trailing `/*`)

Prefer aliases over deep relative paths for cross-module imports; relative paths are used only for same-folder siblings.

## Error Handling

- No global error-handling abstraction. Reducers guard against bad input by early-returning rather than throwing: `if (!dishId || !memberId) return;` (`CookingSessionReducer.ts`).
- Defensive parsing for timestamps: `if (!Number.isFinite(startedMs)) { ...; return; }` before using parsed dates.
- Nullish coalescing and lazy initialization are the dominant guard idioms: `state.dishFeedback ?? (state.dishFeedback = {})`, `feedback ?? {}`.
- Values are clamped rather than rejected: `Math.max(0, tally[feedback] + amount)`.
- Type guards validate untrusted unions: `isMemberFeedback(value): value is CookingSessionMemberFeedback`.

## Logging

**Framework:** None. No logger dependency.
- `reportWebVitals` exists (`src/reportWebVitals.ts`) but is invoked with no callback in `src/index.tsx`, so metrics are not logged by default.
- Avoid leaving `console.*` calls in committed code unless intentional.

## Comments

**When to Comment:**
- Comments explain *why*, especially for non-obvious math and state mechanics. Example: `// Weight on the newest sample. Higher = adapts faster...` above `COOK_TIME_EMA_ALPHA` (`CookingSessionReducer.ts`).
- Multi-line block comments document tricky helper behavior and edge cases (e.g. the `finalizeRunningSegment` segment-folding explanation).
- Inline trailing comments annotate fields: `cookTimeStats?: Record<...>; // durable per-dish learned times, keyed by dishId`.

**JSDoc/TSDoc:**
- Light, occasional use. File/section headers use `/** ... */` (`src/Store/Selectors.ts`). Field-level `/** ... */` appears on model properties (`Ingredient.ts` — `/** Legacy/default unit. ... */`). Not required on every export.

## Function Design

**Size:** Helpers are small and single-purpose (often one-line arrow functions). Reducer case logic is kept short; shared logic is extracted into module-level helpers (`finalizeRunningSegment`, `adjustDishFeedbackTally`).

**Parameters:** For 3+ related arguments, use a named `*Params` object type (`StartCookingParams`, `FinishCookingParams`) rather than positional args. Optional fields use `?`.

**Return Values:** Explicit return type annotations are common on helpers (`: number`, `: void`, `value is X`). Reducers mutate Immer draft state in place (Redux Toolkit) rather than returning new state, except where a fresh object is built and assigned.

## Module Design

**Exports:**
- Named exports are the default across helpers, hooks, reducers, and components.
- Default exports are reserved for Redux slice reducers (`export default ...Reducer`), the `App` component, and route configs (`export default DishesRoutes`).
- Helpers commonly export one named object grouping related functions (`export const DateHelpers = { ... }`).

**Barrel Files:**
- `src/Hooks/index.ts` re-exports every hook via `export * from './useX'`; consumers import from `@hooks`.
- Component folders use `index.ts` barrels (e.g. `src/Components/Button/index.ts` → `export * from './Button'; export * from './ActionButton';`).

## State Management

- Redux Toolkit with `createSlice` for all domain state (`src/Store/Reducers/*`). State is split into two persisted roots: `shared` (admin-published: ingredients, dishes, config) and `personal` (per-device: inventory, shopping list, schedule, cooking sessions). See `src/Store/Store.ts`.
- Persistence uses `redux-persist` backed by IndexedDB via `reduxPersistIndexedDbStorage` (`src/Common/Storage/AppStorage.ts`). `serializableCheck` is disabled in middleware.
- Always read state through typed selectors in `src/Store/Selectors.ts` — never access `state.shared.*` / `state.personal.*` directly (enforced by the file's own header comment). Derived data uses `reselect`'s `createSelector`.
- Local component state uses hooks; reusable stateful logic is factored into custom hooks (`useToggle`, `useScheduledCalculation`) that return memoized objects (`useMemo`/`useCallback`).

## UI Conventions

- antd v5 is the component library, themed via `ConfigProvider` token overrides in `src/App.tsx` (primary `#7436dc`).
- Locale is Vietnamese throughout: `dayjs.locale('vi')`, `moment.locale('vi')`, antd `viVN`. User-facing strings are Vietnamese; write new copy in Vietnamese.
- Both `moment` and `dayjs` are present; `DateHelper.ts` uses `moment`. Match the date library already used in the file you touch.

---

*Convention analysis: 2026-06-14*
