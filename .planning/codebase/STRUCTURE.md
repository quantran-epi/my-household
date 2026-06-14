# Codebase Structure

**Analysis Date:** 2026-06-14

## Directory Layout

```
my-household/  (package name: my-recipes)
├── src/                    # Application source
│   ├── index.tsx           # Bootstrap entry point
│   ├── App.tsx             # Provider composition root
│   ├── service-worker.ts   # PWA service worker (Workbox)
│   ├── Components/         # Reusable UI kit (antd wrappers)
│   ├── Modules/            # Feature modules (vertical slices)
│   ├── Routing/            # Router, app shell, route table
│   ├── Store/              # Redux store, reducers, models, selectors
│   ├── Hooks/              # Shared React hooks (barrel: index.ts)
│   └── Common/             # Helpers, storage, constants, types
├── public/                 # Static HTML/manifest/icons
├── assets/                 # App icons (imported by shell)
├── tests/e2e/              # Playwright end-to-end tests
├── docs/                   # Built app output + deployment target (GitHub Pages)
├── build/                  # CRA/craco build output (generated)
├── craco.config.js         # Webpack overrides + path aliases + Less theming
├── tsconfig.json           # TS config + path aliases
├── playwright.config.ts    # E2E config
├── package.json            # Scripts + dependencies
└── AGENTS.md               # Deployment note for agents
```

## Directory Purposes

**`src/Components`:**
- Purpose: Reusable UI primitives wrapping Ant Design
- Contains: One folder per component with implementation `.tsx` + barrel `index.ts`
- Key files: `SmartForm/SmartForm.tsx`, `Layout/Stack`, `Layout/Box`, `Modal/ModalProvider`, `Message`, `Button`, `Form/*`, `AppInitializer/AppInitializer.tsx`

**`src/Modules`:**
- Purpose: Domain features, each a self-contained slice
- Contains: `Screens/`, optional `Routing/`, `Helpers/`, `Components/`
- Key files: `Dishes/`, `Ingredient/`, `ShoppingList/`, `ScheduledMeal/`, `DishSuggester/`, `Home/`

**`src/Routing`:**
- Purpose: Route declaration and app shell chrome
- Contains: `RootRouter.tsx`, `RootRoutes.ts`, `MasterPage.tsx`, `PageActionsContext.tsx`, `AppShellNavigationContext.tsx`
- Key files: `RootRouter.tsx` (route tree), `MasterPage.tsx` (shell)

**`src/Store`:**
- Purpose: Centralized state
- Contains: `Store.ts`, `Selectors.ts`, `Reducers/` (RTK slices), `Models/` (domain types)
- Key files: `Store.ts`, `Selectors.ts`, `Reducers/DishesReducer.ts`, `Models/Ingredient.ts`

**`src/Common`:**
- Purpose: Cross-cutting infrastructure and domain helpers
- Contains: `Storage/`, `Helpers/`, `Constants/`, `Types/`
- Key files: `Storage/AppStorage.ts`, `Helpers/RouteHelper.ts`, `Helpers/ObjectProperty.ts`

**`src/Hooks`:**
- Purpose: Shared reusable hooks
- Contains: Individual `useX.ts` files re-exported through `index.ts`
- Key files: `index.ts` (barrel), `useToggle.ts`, `useAdminMode.ts`, `useGistBackup.ts`, `useSharedDataSync.ts`

**`docs`:**
- Purpose: GitHub Pages deployment target (built app is copied here per `AGENTS.md`)
- Contains: `static/`, built assets, `specs/`, `sync/`
- Generated: Partly (built output); Committed: Yes

## Key File Locations

**Entry Points:**
- `src/index.tsx`: React bootstrap + service worker registration
- `src/App.tsx`: Provider stack and theme/locale config

**Configuration:**
- `craco.config.js`: Webpack aliases (`@components`, `@routing`, `@modules`, `@store`, `@common`, `@hooks`), Less theme vars, ModuleScopePlugin removal
- `tsconfig.json`: Matching TS path aliases, `strict: false`, target es5
- `playwright.config.ts`: E2E runner config
- `.env`: Environment configuration present (contents not read)

**Core Logic:**
- `src/Store/Store.ts`: Store assembly and persistence
- `src/Store/Selectors.ts`: All state reads
- `src/Routing/RootRouter.tsx`: Route tree
- `src/Common/Storage/AppStorage.ts`: IndexedDB adapter

**Testing:**
- `tests/e2e/`: Playwright specs and fixtures
- `src/**/*.test.ts(x)`: Co-located unit tests (e.g. `src/Store/Reducers/CookingSessionReducer.test.ts`, `src/App.test.tsx`)

## Naming Conventions

**Files:**
- UI components: PascalCase matching folder name with barrel `index.ts` (e.g. `Card/Card.tsx` + `Card/index.ts`)
- Route screens: `<Name>.screen.tsx` (full-route pages)
- Embedded widgets: `<Name>.widget.tsx` (composed inside screens)
- Modals: `<Name>.modal.tsx`
- Reducers: `<Domain>Reducer.ts`; Models: `<Domain>.ts`
- Route config: `<Domain>RouteConfig.ts`; Router: `<Domain>Router.tsx`
- Helpers: `<Purpose>Helper.ts` / `<Purpose>Helpers.ts`
- Hooks: `useXxx.ts`

**Directories:**
- PascalCase top-level source dirs (`Components`, `Modules`, `Store`, `Common`, `Hooks`, `Routing`)
- Module sub-dirs: `Screens`, `Routing`, `Helpers`, `Components`

## Where to Add New Code

**New Feature (new domain):**
- Create `src/Modules/<Domain>/` with `Screens/`, `Routing/<Domain>RouteConfig.ts`, `Routing/<Domain>Router.tsx`
- Register route config under `AuthorizedRoutes` in `src/Routing/RootRoutes.ts`
- Wire the screens/router into `src/Routing/RootRouter.tsx`
- Add nav entries in the sidebar groups / bottom tabs in `src/Routing/MasterPage.tsx`

**New screen in an existing module:**
- Add `<Name>.screen.tsx` (or `.widget.tsx`) under `src/Modules/<Domain>/Screens/`
- Add a route entry in that module's `*RouteConfig.ts` and `RootRouter.tsx`

**New state slice:**
- Add `src/Store/Reducers/<Domain>Reducer.ts` (RTK `createSlice`)
- Add types under `src/Store/Models/<Domain>.ts`
- Register the reducer in the `shared` or `personal` combine in `src/Store/Store.ts`
- Expose reads through new selectors in `src/Store/Selectors.ts`

**New Component (shared UI):**
- Add `src/Components/<Name>/<Name>.tsx` + `src/Components/<Name>/index.ts` barrel
- Import via `@components/<Name>`

**Utilities / domain logic:**
- Cross-cutting helpers: `src/Common/Helpers/<Purpose>Helper.ts`
- Module-specific logic: `src/Modules/<Domain>/Helpers/`

**Hooks:**
- Add `src/Hooks/useXxx.ts` and re-export from `src/Hooks/index.ts`

## Special Directories

**`docs`:**
- Purpose: GitHub Pages deployment target (build output copied here)
- Generated: Partly; Committed: Yes

**`build`:**
- Purpose: craco/CRA production build output
- Generated: Yes; Committed: No (build artifact)

**`assets/icons`:**
- Purpose: PNG icons imported directly by the app shell (`MasterPage.tsx`)
- Generated: No; Committed: Yes

**`node_modules`:**
- Purpose: Dependencies (yarn, lockfile `yarn.lock`)
- Generated: Yes; Committed: No

---

*Structure analysis: 2026-06-14*
