<!-- refreshed: 2026-06-14 -->
# Architecture

**Analysis Date:** 2026-06-14

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                     React App (PWA)                          │
│                  `src/index.tsx` → `src/App.tsx`             │
├──────────────────┬──────────────────┬───────────────────────┤
│  Feature Modules │   UI Components   │       Hooks           │
│  `src/Modules`   │  `src/Components` │    `src/Hooks`        │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Routing + App Shell                         │
│  `src/Routing/RootRouter.tsx`, `src/Routing/MasterPage.tsx`  │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│              Redux Toolkit Store (split state)               │
│  `src/Store/Store.ts` → shared + personal reducers           │
│  Selectors: `src/Store/Selectors.ts`                         │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Persistence + External Sync                                 │
│  IndexedDB via redux-persist (`src/Common/Storage`)          │
│  GitHub (shared publish) + GitHub Gist (personal backup)     │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| App root | Wires providers (Ant Design config, message, modal, Redux, persist gate, initializer, router) | `src/App.tsx` |
| Store | Combines shared + personal reducers, applies redux-persist to IndexedDB | `src/Store/Store.ts` |
| Selectors | Typed read access to split state; memoized derived data via reselect | `src/Store/Selectors.ts` |
| RootRouter | Declares all routes, nests module routers under `MasterPage` | `src/Routing/RootRouter.tsx` |
| MasterPage | App shell: header, bottom tab nav, sidebar drawer, cooking pill, global search | `src/Routing/MasterPage.tsx` |
| AppInitializer | Runs startup side-effects (storage health check, background personal sync) | `src/Components/AppInitializer/AppInitializer.tsx` |
| Feature module | Self-contained vertical slice (Screens, Routing, Helpers) per domain | `src/Modules/<Domain>` |
| Shared UI kit | Ant Design wrappers exposed via barrel files | `src/Components/<Name>` |

## Pattern Overview

**Overall:** Feature-module (vertical slice) client-side SPA with a centralized Redux state and offline-first persistence.

**Key Characteristics:**
- Local-first PWA: all data lives in IndexedDB; no application backend server. External services (GitHub, GitHub Gist) are used only for sync/backup.
- Split global state: `shared` (admin-published ingredients/dishes/config) vs `personal` (per-device meals, inventory, sessions, templates).
- Module isolation by domain (`Dishes`, `Ingredient`, `ShoppingList`, `ScheduledMeal`, `DishSuggester`, `Home`) each owning its own Screens and Routing.
- Path aliases (`@components`, `@modules`, `@store`, `@common`, `@hooks`, `@routing`) decouple imports from relative paths.
- UI built on Ant Design 5, wrapped by a local component layer so feature code imports from `@components/*` rather than `antd` directly.

## Layers

**UI Components Layer:**
- Purpose: Reusable presentational + form primitives wrapping Ant Design
- Location: `src/Components`
- Contains: Layout primitives (`Box`, `Stack`, `Content`, `Header`), form controls (`Form/*`, `SmartForm`), overlays (`Modal`, `FastOverlay`, `Popover`), feedback (`Message`, `Alert`, `Result`)
- Depends on: `antd`, React
- Used by: Feature modules, routing shell

**Feature Modules Layer:**
- Purpose: Domain features as vertical slices
- Location: `src/Modules`
- Contains: `Screens/` (route screens `.screen.tsx` and embedded `.widget.tsx`), `Routing/` (route config + nested router), `Helpers/` (domain logic), `Components/` (module-local components)
- Depends on: `@components`, `@store`, `@common`, `@hooks`
- Used by: `RootRouter`

**Routing / Shell Layer:**
- Purpose: Route declaration, navigation chrome, page-level context
- Location: `src/Routing`
- Contains: `RootRouter.tsx`, `RootRoutes.ts`, `MasterPage.tsx`, `PageActionsContext.tsx`, `AppShellNavigationContext.tsx`
- Depends on: `react-router-dom`, modules, components
- Used by: `App.tsx`

**State Layer:**
- Purpose: Centralized application state + derived reads
- Location: `src/Store`
- Contains: `Store.ts`, `Selectors.ts`, `Reducers/*` (RTK slices), `Models/*` (domain type definitions)
- Depends on: `@reduxjs/toolkit`, `redux-persist`, `reselect`
- Used by: All UI layers via `useSelector`/`useDispatch`

**Common / Infrastructure Layer:**
- Purpose: Cross-cutting helpers, storage adapter, constants, shared types
- Location: `src/Common`
- Contains: `Storage/AppStorage.ts` (localforage/IndexedDB adapter), `Helpers/*` (domain + utility helpers), `Constants/*`, `Types/*`
- Depends on: `localforage`, `lodash`, `dayjs`/`moment`
- Used by: All layers

## Data Flow

### Primary Request Path (user action → state → persistence)

1. User interacts with a screen/widget under `src/Modules/.../Screens` (e.g. `DishesAdd.widget.tsx`)
2. Component dispatches an RTK action creator exported from a reducer (`src/Store/Reducers/DishesReducer.ts`)
3. Slice reducer mutates draft state immutably via Immer (`DishesSlice` in `DishesReducer.ts:27`)
4. `redux-persist` serializes the affected root (`shared` or `personal`) and writes it to IndexedDB via the localforage adapter (`src/Common/Storage/AppStorage.ts:12`)
5. Subscribed components re-render through memoized selectors (`src/Store/Selectors.ts`)

### Navigation Flow

1. `BrowserRouter` with basename `/my-recipes` declares routes (`src/Routing/RootRouter.tsx:41`)
2. Route paths are produced by route-config factories using `RouteHelpers.CreateRoute` (`src/Common/Helpers/RouteHelper.ts:8`)
3. Module sub-routers render `<Outlet />` inside a layout container (`src/Modules/Ingredient/Routing/IngredientRouter.tsx`)
4. `MasterPage` provides shell chrome and `AppShellNavigationContext` for navigation-with-feedback (`src/Routing/MasterPage.tsx:219`)

### Shared/Personal Sync Flow

1. Admin publishes shared data (ingredients, dishes, config) to GitHub via `useSharedPublish` (`src/Hooks/useSharedPublish.ts`)
2. Other devices detect/pull updates via `useSharedDataSync` and the `SharedSyncModal` (`src/Components/AppInitializer/SharedSyncModal`)
3. Personal data backs up to a GitHub Gist via `useGistBackup`; `AppInitializer` triggers background personal sync on idle (`src/Components/AppInitializer/AppInitializer.tsx:62`)

**State Management:**
- Redux Toolkit slices (`createSlice`) per domain, combined into two persisted roots (`shared`, `personal`) in `src/Store/Store.ts`.
- Reads always go through `src/Store/Selectors.ts` (never raw `state.shared.*` access).
- `serializableCheck` is disabled in middleware config (`src/Store/Store.ts:51`).

## Key Abstractions

**Redux Slice + typed action creators:**
- Purpose: Encapsulate per-domain state transitions
- Examples: `src/Store/Reducers/DishesReducer.ts`, `IngredientReducer.ts`, `ScheduledMealReducer.ts`, `CookingSessionReducer.ts`
- Pattern: `createSlice` with renamed exported action creators (e.g. `add: addDishes`)

**Route config factory:**
- Purpose: Centralize URL construction with type-safe params and query strings
- Examples: `src/Common/Helpers/RouteHelper.ts`, `src/Routing/RootRoutes.ts`, `src/Modules/*/Routing/*RouteConfig.ts`
- Pattern: `RouteHelpers.CreateRoutes(root, factory)` returning `{ Root, ...subroutes }`

**SmartForm:**
- Purpose: Typed form abstraction over Ant Design forms with item definitions
- Examples: `src/Components/SmartForm/SmartForm.tsx`, `useSmartForm.ts`, `SmartForm.types.ts`
- Pattern: `useSmartForm({ defaultValues, onSubmit, itemDefinitions })` with `ObjectPropertyHelper.nameof` for type-safe field names

**Storage adapter:**
- Purpose: Single IndexedDB instance backing both redux-persist and ad-hoc string/JSON storage
- Examples: `src/Common/Storage/AppStorage.ts`
- Pattern: localforage instance + `reduxPersistIndexedDbStorage` getItem/setItem/removeItem

**Memoized selectors:**
- Purpose: Derived/indexed data (e.g. `Map` by id) without recomputation
- Examples: `selectDishesById`, `selectIngredientsById`, `selectHouseholdHealthState` in `src/Store/Selectors.ts`
- Pattern: `createSelector` from `reselect`

## Entry Points

**Application bootstrap:**
- Location: `src/index.tsx`
- Triggers: Browser load of the SPA
- Responsibilities: Mounts `<App />` into `#root`, registers service worker, reports web vitals

**App composition root:**
- Location: `src/App.tsx`
- Triggers: Rendered by `index.tsx`
- Responsibilities: Provider stack (ConfigProvider → MessageProvider → ModalProvider → Redux Provider → PersistGate → AppInitializer → RootRouter), Vietnamese locale, theme tokens

**Service worker:**
- Location: `src/service-worker.ts`, registered via `src/serviceWorkerRegistration.ts`
- Triggers: Registered in `index.tsx`
- Responsibilities: PWA offline caching (Workbox)

## Architectural Constraints

- **Threading:** Single-threaded browser main thread. Background-style work is deferred via `requestIdleCallback`/`requestAnimationFrame`/`setTimeout` (e.g. `AppInitializer.tsx:62`, `useDeferredDrawerTools` in `MasterPage.tsx:184`).
- **Global state:** Single Redux store singleton (`src/Store/Store.ts`). Persisted IndexedDB roots keyed `persist:shared` and `persist:personal`.
- **No backend:** There is no first-party API server. All persistence is local IndexedDB; remote operations target GitHub raw content and Gist APIs only.
- **Serialization disabled:** RTK `serializableCheck` is off, so non-serializable values can leak into state if not careful (`Store.ts:51`).
- **Schema tolerance:** Selectors defensively default missing slices (`?? []`, `?? {}`) to tolerate older persisted blobs predating newer slices (`Selectors.ts:54`).

## Anti-Patterns

### Direct raw state access

**What happens:** Reading `state.shared.*` / `state.personal.*` directly inside components.
**Why it's wrong:** Bypasses the normalization and memoization layer, and couples components to the split-store shape which has migration shims.
**Do this instead:** Import a selector from `src/Store/Selectors.ts` (file header explicitly mandates this).

### Importing antd directly in feature code

**What happens:** A screen imports primitives straight from `antd` instead of the local wrapper.
**Why it's wrong:** The app standardizes on wrapped components in `src/Components` for consistent theming/behavior; mixed usage fragments styling.
**Do this instead:** Import from `@components/*` (e.g. `@components/Button`, `@components/Layout/Stack`). Note `MasterPage.tsx` still imports some `antd` primitives directly (`Flex`, `Layout`, `Divider`, `Dropdown`) — treat that as legacy, not the target.

### Oversized shell component

**What happens:** `src/Routing/MasterPage.tsx` exceeds 1300 lines, holding shell, drawer, data-backup, cooking pill, and bottom nav.
**Why it's wrong:** Hard to test and modify safely; many concerns in one file.
**Do this instead:** Extract self-contained pieces (`CookingPill`, `BottomTabNavigator`, `DataBackup`) into their own files under `src/Routing` or a shell module.

## Error Handling

**Strategy:** Local try/catch around async I/O (storage, network sync) with user-facing Ant Design `message` toasts in Vietnamese; silent `.catch(() => {})` for non-critical background tasks.

**Patterns:**
- Network/import operations wrap fetch in try/catch and surface `message.error("... " + ex?.message)` (`MasterPage.tsx:400`, `:1301`)
- Storage parse helpers swallow errors and return fallbacks (`getStorageJson`, `parsePersistRoot` in `AppStorage.ts`)
- Static route fallbacks exist (`RootRoutes.StaticRoutes`: Error, NotFound, Unauthorized) though no global error boundary component was observed

## Cross-Cutting Concerns

**Logging:** No structured logging framework; `reportWebVitals` is wired but not forwarded to an endpoint. Background failures are silently swallowed.
**Validation:** Form-level validation through `SmartForm`/Ant Design; config normalization helpers (`normalizeInventoryHealthConfig`, `normalizeSharedConfig`, `normalizeHouseholdMembers`) sanitize persisted/synced data.
**Authentication:** No user auth. An "admin mode" is a client-side PIN gate (`useAdminMode`) controlling write access to shared data; GitHub tokens for publish/backup are stored per-device in browser storage.

---

*Architecture analysis: 2026-06-14*
