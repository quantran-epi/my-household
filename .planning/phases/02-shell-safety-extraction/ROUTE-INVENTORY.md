# Route Reachability Inventory

**Derived:** 2026-06-15 (Phase 2, plan 02-05)
**Sources:** `src/Routing/RootRouter.tsx`, `src/Routing/RootRoutes.ts`, the four sub-router route configs, `src/Routing/Shell/SidebarDrawer.tsx` (`sidebarNavGroups`), `src/Routing/Shell/BottomTabNavigator.tsx`.

This document enumerates **every** route the app registers today and records how a
user reaches it (its **entry path**). It is the **reachability baseline gate for
Phase 4 nav changes** (NAV-02 / NAV-03): every pre-refactor route listed here must
remain reachable — directly or within ~3 taps / via global search — after any nav
rework. A route losing its only entry path in Phase 4 is a regression to flag against
this inventory.

## Entry-path legend

| Marker | Meaning |
|--------|---------|
| `sidebar-nav-{key}` | Item in the SidebarDrawer primary nav (`sidebarNavGroups`), reachable by opening the drawer (`sidebar-drawer-button`) |
| `sidebar-tool` | Button in the SidebarDrawer tools region (not a `sidebarNavGroups` item) |
| `bottom-tab-{key}` | Bottom-tab dock button (`BottomTabNavigator`) |
| `header` | Header control in the MasterPage chrome (e.g. `global-search-button`) |
| `programmatic` | Reached only via in-screen navigation, redirect, or query params — **no direct nav entry** |
| `test-only` | Registered for e2e only; not linked from any user-facing nav |

## Routes OUTSIDE the MasterPage layout (lazy, top-level)

| Route path | Screen | Entry path | Notes |
|------------|--------|------------|-------|
| `/guide/welcome` | `UserGuideWelcomeScreen` (lazy) | programmatic (redirect) | MasterPage redirects here on first load when `isUserGuideWelcomeComplete()` is false. No nav button. |
| `/guide/tour` | `UserGuideTourScreen` (lazy) | programmatic | Reached from within the User Guide flow; no direct nav entry. |

## Routes UNDER the `Root()` layout route (`<PageActionsProvider><MasterPage/></PageActionsProvider>`)

| Route path | Screen | Entry path(s) | Notes |
|------------|--------|---------------|-------|
| `/` (index) | `DashboardScreen` | `sidebar-nav-dashboard` | Home dashboard. |
| `/analytics` | `DashboardAnalyticsScreen` | `sidebar-nav-analytics` | |
| `/cooking-history` | `CookingHistoryScreen` | `sidebar-nav-cookingHistory` | |
| `/dish-suggester` | `DishSuggesterPageScreen` | `sidebar-nav-dishSuggester` | The `bottom-tab-suggester` button opens an in-place `DishSuggesterScreen` modal/widget, NOT this route. |
| `/household` | `HouseholdProfilesScreen` | `sidebar-nav-household` | |
| `/smart-meal-planner` | `SmartMealPlannerScreen` | **programmatic** | No nav item; reached programmatically (e.g. from planning flows, optional `date` query param). Flag for Phase 4 reachability. |
| `/nutrition-goals` | `NutritionGoalsScreen` | `sidebar-nav-nutritionGoals` | Also supports calculator query params (programmatic deep-link). |
| `/guide` | `UserGuideScreen` | `sidebar-tool` ("Hướng dẫn sử dụng") | Drawer tools button, not a `sidebarNavGroups` item. |
| `/templates` | `TemplatesScreen` | `sidebar-nav-templates` | |
| `/sync-backup-health` | `SyncBackupHealthScreen` | `sidebar-tool` ("Sức khỏe dữ liệu"), backup-center modal "Xem sức khỏe" | Drawer tools button + backup-center modal link; not a `sidebarNavGroups` item. |
| `/expense-planner` | `DishExpensePlannerScreen` | `sidebar-nav-expensePlanner`, `bottom-tab-expense-planner` | Also supports `dish`/`dishes`/`servings` query params (programmatic deep-link). |
| `/ingredient/list` | `IngredientListScreen` | `sidebar-nav-ingredients` | Sub-router: `IngredientRouter`. |
| `/ingredient/detail` | `IngredientDetailScreen` | **programmatic** | Reached from the ingredient list (`ingredient` query param). No direct nav entry. |
| `/dishes/list` | `DishesListScreen` | `sidebar-nav-dishes`, `bottom-tab-dishes` | Sub-router: `DishesRouter`. |
| `/dishes/manage-ingredient` | `DishesDetailScreen` | **programmatic** | Reached from the dishes list (`dishes` query param). No direct nav entry. |
| `/shoppingList/list` | `ShoppingListScreen` | `sidebar-nav-shoppingList`, `bottom-tab-shopping-list` | Sub-router: `ShoppingListRouter`. |
| `/shoppingList/detail` | `ShoppingListDetailScreen` | **programmatic** | Reached from the shopping-list list (`shoppingList` query param). No direct nav entry. |
| `/scheduledMeal/list` | `ScheduledMealListScreen` | `sidebar-nav-meals`, `bottom-tab-scheduled-meals` | Sub-router: `ScheduledMealRouter`. |
| `/scheduledMeal/feedback-history` | `MemberDishFeedbackHistoryScreen` | `sidebar-nav-dishFeedback` | |
| `/scheduledMeal/leftovers` | `LeftoverManagementScreen` | `sidebar-nav-leftovers` | |
| `/scheduledMeal/prep-tasks` | `PrepTasksScreen` | `sidebar-nav-prepTasks` | |
| `/scheduledMeal/dish-count-templates` | `SmartPlannerTemplatesScreen` | **programmatic** | No nav item; reached from within the scheduled-meal flow. Flag for Phase 4 reachability. |
| `/__crash-test` | `CrashTestScreen` | **test-only** | See note below. |

## Bottom-tab dock summary

The `BottomTabNavigator` exposes five entries: `bottom-tab-dishes` (`/dishes/list`),
`bottom-tab-scheduled-meals` (`/scheduledMeal/list`), `bottom-tab-suggester` (opens the
in-place `DishSuggesterScreen` widget — not a route navigation), `bottom-tab-shopping-list`
(`/shoppingList/list`), and `bottom-tab-expense-planner` (`/expense-planner`).

## Routes with NO direct nav entry (programmatic-only)

These have no bottom-tab, sidebar-nav, or header entry and depend on in-screen
navigation, redirects, or query-param deep-links. Phase 4 must preserve their
~3-tap / search reachability (NAV-02 / NAV-03):

- `/guide/welcome` (first-run redirect), `/guide/tour`
- `/smart-meal-planner`
- `/ingredient/detail`, `/dishes/manage-ingredient`, `/shoppingList/detail`
- `/scheduledMeal/dish-count-templates`

## Notes

### Dead export: `DataBackup` (D-06)
`src/Routing/Shell/DataBackup.tsx` exports `DataBackup`, which has **no in-app caller**
(confirmed: the only reference is its own definition). It is **not wired to any route**
and never rendered. It was preserved (not deleted) during the Phase 2 extraction and is
flagged for a separate follow-up — it contains a **hardcoded GitHub raw URL**
(`raw.githubusercontent.com/quantran-epi/my-recipes/.../docs/data.txt`) that overwrites
the `persist:personal` storage root (threat **T-02-DB**, accepted/deferred this phase).
Do not treat it as a reachable route.

### Test-only crash route: `/__crash-test` (T-02-CT)
`RootRoutes.StaticRoutes.CrashTest` (`/__crash-test`) renders `CrashTestScreen`, which
throws during render so the e2e suite can prove the top-level ErrorBoundary recovery UI
(FND-01). It is registered inside the MasterPage layout tree to prove shell containment
but is **not linked from any user-facing nav** — it is test-only and not user-reachable
(threat **T-02-CT**). Exclude it from Phase 4 user-nav reachability requirements.
