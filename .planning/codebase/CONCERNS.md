# Codebase Concerns

**Analysis Date:** 2026-06-14

## Tech Debt

**Oversized screen/widget files:**
- Issue: Many feature files exceed 800 lines, mixing data fetching, business logic, state, and JSX in a single component. They are hard to navigate, test, and review.
- Files:
  - `src/Modules/ScheduledMeal/Screens/SmartMealPlanner.screen.tsx` (1997 lines)
  - `src/Modules/ShoppingList/Screens/ShoppingListDetail.widget.tsx` (1546 lines)
  - `src/Modules/ScheduledMeal/Helpers/SmartPlannerEngine.ts` (1391 lines)
  - `src/Routing/MasterPage.tsx` (1366 lines)
  - `src/Modules/DishSuggester/Screens/DishSuggester.screen.tsx` (1280 lines)
  - `src/Modules/Home/Screens/DashboardAnalytics.screen.tsx` (1153 lines)
  - 4 more files over 800 lines
- Impact: High cognitive load, merge conflicts, slow iteration, difficult to unit test logic embedded in render.
- Fix approach: Extract pure logic into Helpers, extract sub-components, move data shaping into selectors (`src/Store/Selectors.ts`) or custom hooks.

**Dual date libraries (`moment` + `dayjs`):**
- Issue: Both `moment` (~30 references) and `dayjs` (~13 references) are bundled and used. `moment` is in maintenance mode and large.
- Files: `package.json` declares both; usages spread across modules and `src/Common/Helpers/DateHelper.ts`.
- Impact: Larger bundle (notable for a PWA), inconsistent date handling, two mental models.
- Fix approach: Standardize on `dayjs`, migrate remaining `moment` call sites, remove `moment` from `package.json`.

**Loose TypeScript configuration:**
- Issue: `strict: false` and `target: "es5"` in `tsconfig.json`. Strict null checks and other safety flags are off; ES5 target produces heavier output and blocks modern runtime assumptions.
- Files: `tsconfig.json`
- Impact: Type holes (null/undefined bugs not caught at compile time), larger transpiled bundle.
- Fix approach: Incrementally enable `strict` (start with `strictNullChecks`), raise `target` to a modern baseline (es2017+) since the app targets evergreen browsers.

**Frequent `any` casts and lint escapes:**
- Issue: 69 `any`/`as any` casts and several `eslint-disable` comments. Concentrated around inventory/unit handling and legacy data shapes.
- Files: `src/Common/Helpers/InventoryHelper.ts:66`, `src/Common/Helpers/IngredientUnitHelper.ts:140`, `src/Modules/DishSuggester/Screens/DishSuggester.screen.tsx` (multiple), `src/Modules/Dishes/Screens/CookingSession.widget.tsx:263,276`, `src/Modules/Dishes/Screens/FinishCooking.widget.tsx:110`
- Impact: Type safety is bypassed exactly where legacy/migrated data flows, the riskiest area.
- Fix approach: Introduce explicit legacy-shape types and migration helpers instead of `as any`; remove casts once models are unified.

**`react-hooks/exhaustive-deps` disabled in effects:**
- Issue: Several effects silence the dependency lint rule, risking stale closures.
- Files: `src/Routing/PageActionsContext.tsx:41`, `src/Modules/ScheduledMeal/Screens/ScheduledMealCooking.widget.tsx:193`, `src/Modules/DishSuggester/Screens/DishSuggester.screen.tsx:152`, `src/Modules/Dishes/Screens/CookingSession.widget.tsx:140`
- Impact: Potential stale state/missed updates that are hard to reproduce.
- Fix approach: Audit each effect; memoize callbacks or restructure so deps can be honest.

## Known Bugs

**Reload-as-recovery after sync:**
- Symptoms: After Gist sync/restore the app triggers a full page reload rather than re-hydrating state in place.
- Files: `src/Hooks/useGistBackup.ts:514`, `src/Hooks/useGistBackup.ts:642`, `src/Routing/MasterPage.tsx:389`, `src/serviceWorkerRegistration.ts:119`
- Trigger: Completing a restore/import or applying a service-worker update.
- Workaround: Reload works but drops in-memory UI state, in-progress forms, and scroll position; uses arbitrary `setTimeout` delays (1500ms/900ms) that can race on slow devices.

## Security Considerations

**`.env` is committed to the repository:**
- Risk: `.env` is tracked in git (only `.env.*.local` variants are gitignored). Anything placed in it ships in history.
- Files: `.env` (tracked), `.gitignore:19-22`
- Current mitigation: None at the file level.
- Recommendations: Remove `.env` from tracking (`git rm --cached .env`), add `.env` to `.gitignore`, rotate any value that was ever committed, document required vars in a non-secret `.env.example`.

**Build-time secrets baked into the client bundle:**
- Risk: A GitHub token and an admin PIN are injected at build time and shipped to every browser. `create-react-app` inlines `REACT_APP_*` values into the static JS, so they are fully recoverable by any user.
- Files: `src/Hooks/useSharedPublish.ts:44` (`BUILD_GITHUB_TOKEN` from `REACT_APP_GH_TOKEN`), `src/Hooks/useAdminMode.ts:15` (`ADMIN_PIN` from `REACT_APP_ADMIN_PIN`)
- Current mitigation: A trivial XOR-with-static-key + base64 routine (`_dt`, key `"myrecipes"`) "obfuscates" the values. This is reversible by anyone and provides no real protection.
- Recommendations: Never ship a GitHub token or PIN to the client. Move privileged writes (Gist publishing) behind a server/serverless function or scoped per-user tokens entered at runtime. Treat the admin PIN as a UX gate only, not a security control, and assume the baked token is already compromised, rotate it.

**Personal-access tokens stored in plaintext IndexedDB:**
- Risk: User-entered GitHub PATs are persisted unencrypted in IndexedDB and sent as `Authorization: Bearer` headers.
- Files: `src/Hooks/useGistBackup.ts` (`GIST_TOKEN_KEY` storage at ~:431, fetch calls using the token throughout), `src/Common/Storage/AppStorage.ts`
- Current mitigation: Token validated against `api.github.com/user` before use.
- Recommendations: Document that the PWA requires a token, recommend least-privilege (gist-scope-only) tokens, consider clearing the token on lock, and surface the storage location to the user.

## Performance Bottlenecks

**Heavy logic inside render in large screens:**
- Problem: Scoring/planning and inventory aggregation run inside large render components rather than memoized selectors.
- Files: `src/Modules/DishSuggester/Screens/DishSuggester.screen.tsx` (repeated `InventoryHelper.totalAmount(... as any)` calls in render), `src/Modules/ScheduledMeal/Helpers/SmartPlannerEngine.ts`, `src/Modules/Home/Screens/DashboardAnalytics.screen.tsx`
- Cause: Recomputation on every render and per-row work without memoization.
- Improvement path: Push aggregation into `reselect` selectors (`reselect` is already a dependency), memoize per-row computations, and lean on `react-window` virtualization consistently.

**Large initial bundle:**
- Problem: `moment` + `dayjs` + `antd` + `recharts` + full workbox suite shipped together; ES5 target inflates output.
- Files: `package.json`, `tsconfig.json`
- Cause: Dual date libs, no aggressive code-splitting noted across modules.
- Improvement path: Drop `moment`, raise transpile target, lazy-load chart-heavy screens (`recharts`) and infrequently used modules via route-level `React.lazy`.

## Fragile Areas

**Legacy data-shape handling in inventory/units:**
- Files: `src/Common/Helpers/InventoryHelper.ts`, `src/Common/Helpers/IngredientUnitHelper.ts`, `src/Modules/ShoppingList/Screens/ShoppingListDetail.widget.tsx:261`
- Why fragile: Reads `(inv as any).amount` fallbacks to support old persisted shapes; persisted IndexedDB data from older app versions can break silently if shapes drift further.
- Safe modification: Add a versioned migration step in redux-persist rehydration and replace `as any` legacy reads with typed migration helpers before changing models.
- Test coverage: No unit tests cover these helpers.

**Shared-data sync / publish pipeline:**
- Files: `src/Hooks/useSharedPublish.ts`, `src/Hooks/useGistBackup.ts`, `src/Hooks/useSharedDataSync.ts`, `src/Components/AppInitializer/SharedSyncModal.tsx`
- Why fragile: Network + manifest hashing + conflict resolution + reload, coordinated across hooks with manual timing; failures depend on online state and GitHub API responses.
- Safe modification: Cover manifest diff/merge logic with unit tests before changing, avoid timing-based reload coordination.
- Test coverage: No unit tests; only e2e specs exist and none target sync.

## Error Handling Gaps

**No React error boundary:**
- Issue: No `ErrorBoundary` / `componentDidCatch` / `getDerivedStateFromError` anywhere in `src/`.
- Files: searched `src/` — none found.
- Impact: Any uncaught render error blanks the whole app for the user with no recovery UI.
- Fix approach: Add a top-level error boundary in `src/App.tsx` / `src/Routing/MasterPage.tsx` with a fallback and reload affordance.

**Inconsistent error surfacing:**
- Issue: Catch blocks (~51) mix silent swallowing (`getStorageJson`/`parsePersistRoot` return fallback on parse failure) with `message.warning` user prompts; no central logging.
- Files: `src/Common/Storage/AppStorage.ts` (silent catch on JSON parse), `src/Hooks/useGistBackup.ts` (user-facing messages)
- Impact: Storage corruption is silently masked, hard to diagnose data-loss reports.
- Fix approach: Standardize on a logging/notification helper, distinguish recoverable fallbacks from errors worth surfacing.

## Test Coverage Gaps

**Almost no unit tests:**
- What's not tested: Only 2 unit tests exist (`src/App.test.tsx`, `src/Store/Reducers/CookingSessionReducer.test.ts`) against ~284 source files. Reducers, helpers (scoring, nutrition, inventory, pricing), and hooks are untested.
- Files: `src/Store/Reducers/*` (only CookingSession tested), `src/Common/Helpers/*` (none tested), `src/Modules/**/Helpers/*` (none tested)
- Risk: Core business logic (meal planning, dish scoring, cost/nutrition estimates, inventory math) can regress unnoticed.
- Priority: High

**E2E coverage is feature-shallow:**
- What's not tested: e2e specs cover navigation, dashboard, dish suggester, shopping list, global search, and performance, but not the sync/backup pipeline or cooking-session flows.
- Files: `tests/e2e/*.spec.ts`
- Risk: The most security- and data-sensitive flow (Gist sync/publish) has no automated coverage.
- Priority: Medium

## Operational Concerns

**Manual deploy that commits build output into the repo:**
- Problem: Deployment copies `build/` into `docs/` and commits it (`docs/static/*` already tracked). Build artifacts live in source control and are hand-synced.
- Files: `AGENTS.md` (deploy summary), `docs/deployment.md`, `docs/static/*`
- Impact: Repo bloat, stale-artifact risk, error-prone manual steps (`git add ./docs/*`), build/source drift.
- Fix approach: Move to an automated CI deploy (e.g., GitHub Pages action) that builds from source and publishes, instead of committing generated files.

---

*Concerns audit: 2026-06-14*
