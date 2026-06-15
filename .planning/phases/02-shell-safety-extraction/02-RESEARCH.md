# Phase 2: Shell Safety & Extraction - Research

**Researched:** 2026-06-14
**Domain:** React app-shell decomposition, error boundary, portal overlay system (existing codebase)
**Confidence:** HIGH (all findings verified by reading the actual source; no external packages introduced)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Error Boundary**
- **D-01:** Mount **one top-level error boundary around `RootRouter`** (in `src/App.tsx`, wrapping `<RootRouter />` inside the existing provider stack — `ConfigProvider` → `MessageProvider` → `ModalProvider` → `Provider` → `PersistGate` → `AppInitializer`). Satisfies FND-01: a crash in shell chrome (header, nav, pill, drawer) is in scope; a route-level boundary would not catch it. Place the boundary so the fallback still renders within `ConfigProvider` (antd theme/locale available) — i.e. inside `ConfigProvider`, around `RootRouter` (or as close to it as the provider order allows).
- **D-02:** Fallback UI offers a **Reload button** (`window.location.reload()`) with friendly Vietnamese copy. Matches the app's existing reload-as-recovery idiom. No granular in-place reset this phase.
- **D-03:** The error boundary must be a **class component** (`getDerivedStateFromError` / `componentDidCatch`). Catch is render-only (does not catch event-handler/async errors) — acceptable for white-screen prevention.

**Extraction Granularity**
- **D-04:** **File-per-component move.** Extract each top-level shell piece into its own file under `src/Routing/Shell/`: `BottomTabNavigator`, `CookingPill`, `SidebarDrawer`, and the data-backup surface. `MasterPage.tsx` becomes a thin composition root.
- **D-05:** **Move components intact — do NOT refactor internals this phase.** `SidebarDrawer` (~500 lines, bundling primary nav + "Dữ liệu & sao lưu" backup-center modal + admin publish + inventory config + PIN modal) moves as a single unit. May co-locate shared style constants / small helpers (`headerVisual` maps, `sidebarNavButtonStyle`, `useDeferredDrawerTools`) alongside the components that use them, but no logic changes.
- **D-06:** Resolve the existing **`DataBackup` export**. Grep for callers first: if used elsewhere, move intact preserving the export; if dead, note in inventory but do not silently delete (flag for follow-up). Extraction must not change `MasterPage`'s rendered output.

**"Verified Identical" Proof**
- **D-07:** Prove behavioral identity via **Playwright e2e before/after**. Confirm baseline green BEFORE extraction, re-run AFTER and require the same specs pass unchanged. Reuse existing specs (navigation, dashboard, dish suggester, shopping list, global search); add focused specs only where a shell interaction (drawer open/close, pill states, bottom-nav active states, search open) is not already exercised.
- **D-08:** Preserve all **`data-testid` hooks** during the move (`sidebar-drawer-button`, `sidebar-drawer`, `bottom-tab-*`, `active-cooking-floating-button`, `global-search-button`, `page-actions-button`, `sidebar-nav-*`, etc.). These are the e2e contract; renaming breaks the "identical" claim.

**Sheet Wrapper (`@components/Sheet`)**
- **D-09:** Build `@components/Sheet` by **extending the existing `FastOverlay` portal system** (a bottom-placement variant alongside `FastDrawerShell` / `FastModalShell`), NOT antd `Drawer placement="bottom"`. **Conscious divergence from REQUIREMENTS wording** ("over antd `Drawer placement=\"bottom\"`") — recorded as an intentional decision, not a deviation to fix. The wrapper presents a Sheet-shaped API regardless of the underlying implementation.
- **D-10:** **Wrapper only, no migration this phase.** Ship `Sheet` + barrel (`@components/Sheet`) with its public API; do not migrate any existing picker/confirmation. First real consumers arrive in Phase 5 (MOB-03). Include at least a minimal mount/open smoke proof.

### Claude's Discretion
- Exact filenames / sub-folder layout under `src/Routing/Shell/`; whether `MasterPage.tsx` moves into `Shell/` or stays in `Routing/` as the composition root.
- Error-boundary filename/location (`src/Components/ErrorBoundary/` vs `src/Routing/`), visual design, exact Vietnamese fallback copy (seed via `AppCopy` if a namespace fits; otherwise inline and defer to Phase 5).
- Route reachability inventory format/filename, as long as it lists every pre-refactor route + entry path and gates Phase 4.
- The `Sheet` API surface (prop names, height/snap behavior) — design to cover Phase 5's picker + confirmation needs.
- Whether to add new shell-specific e2e specs or extend existing ones to close coverage gaps before extraction.

### Deferred Ideas (OUT OF SCOPE)
- Splitting `SidebarDrawer` internals (backup center, admin publish, inventory config, PIN) into discrete components — follow-up, not this phase.
- Migrating existing pickers/confirmations onto `@components/Sheet` — Phase 5 (MOB-03).
- Fixing "reload-as-recovery after sync" to rehydrate in place — CONCERNS.md, out of scope.
- Security hardening of baked GitHub token / admin PIN / plaintext PAT storage — CONCERNS.md, not this phase.
- Removing/replacing the hardcoded `raw.githubusercontent.com/quantran-epi/my-recipes` URL in `DataBackup` — flag during D-06 grep; address separately.
- Shell copy migration to `AppCopy` — Phase 5 (COPY-03).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FND-01 | A top-level error boundary prevents a shell crash from white-screening the whole app | No error boundary exists anywhere in `src/` (verified by grep for `getDerivedStateFromError`/`componentDidCatch`/`ErrorBoundary` — zero hits). React 18.2 confirmed; class-component boundary is the only mechanism. Mount point fully mapped in `src/App.tsx` (D-01). |
| FND-02 | Shell pieces (bottom-tab navigator, cooking pill, data backup) extracted from `MasterPage.tsx`, behavior verified identical | Full extraction inventory below: every top-level component, its imports, contexts, hooks, selectors, `data-testid` hooks, and shared style helpers mapped. Playwright baseline exists but has a stale-spec hazard (see Pitfall 1). |
| MOB-03 (Sheet build only) | `@components/Sheet` bottom-sheet wrapper available | `FastOverlay` portal system fully documented (API, z-index stacking, scroll-lock, escape-close, reduced-motion). `Sheet` is a bottom-placement sibling to `FastDrawerShell`/`FastModalShell` (D-09). Migration of consumers is Phase 5. |
</phase_requirements>

## Summary

This is a **decomposition + safety-net** phase against a real, already-mapped codebase — not a greenfield build. No new external packages are required; everything is built from in-repo primitives (React 18.2 class component for the boundary, the existing `FastOverlay` portal system for `Sheet`). The work is intentionally split into "pure move, verified identical" (extraction) and a small amount of genuinely new code (error boundary, `Sheet` wrapper, route inventory doc).

`src/Routing/MasterPage.tsx` is a single 1366-line file defining six top-level units: `MasterPage` (composition root + header), `PageActionsMenu`, `SidebarDrawer` (~500 lines, the largest), `CookingPill`, `BottomTabNavigator`, and `DataBackup`. The extraction is mechanical: each moves to its own file under `src/Routing/Shell/`, and `MasterPage` collapses to a composition root rendering Header + `Outlet` + the extracted pieces. `DataBackup` is **confirmed dead** — `export const DataBackup` is the only occurrence of the symbol in the entire source tree (grep returned exactly one line, the definition). Per D-06 it must be moved/preserved-or-flagged, not silently deleted.

The single highest-risk finding: the existing Playwright spec `tests/e2e/app-shell-navigation.spec.ts` asserts on label text that **does not match the current `MasterPage.tsx` source** (e.g. it expects the drawer primary nav to contain "Kế hoạch chi phí" but the source renders "Tính chi phí"; it expects the drawer *tools* region to contain "Đồng bộ dữ liệu mới" / "Sao lưu cá nhân" / "Lịch sử nấu ăn", but those strings live either in a click-to-open modal or in the nav group, not in the tools region). This means **the D-07 baseline is probably not green as-is**. A before/after identity proof is meaningless if the "before" is already red. The planner must reconcile/repair the baseline to green *before* extraction begins — this is Wave 0 work.

**Primary recommendation:** Sequence as (1) repair/confirm green e2e baseline for shell interactions, (2) add the error boundary around `RootRouter` in `App.tsx`, (3) mechanically extract each component into `src/Routing/Shell/` preserving every `data-testid` verbatim, re-running the same green specs after each move, (4) build `@components/Sheet` on `FastOverlay` with a smoke test, (5) write the route reachability inventory doc. Treat the extraction diff as a move, not a rewrite.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Error boundary (crash containment) | Browser / Client (React render tree) | — | React error boundaries are a client-render concept; must wrap `RootRouter` inside `ConfigProvider` so the fallback has antd theme/locale (D-01). |
| Bottom-tab navigator | Browser / Client | — | Pure client nav chrome reading `useLocation` + `AppShellNavigationContext`. |
| Cooking pill | Browser / Client | Store (read-only) | Floating UI driven by `selectCookingSessions` / `selectDishesById`; no writes. |
| Sidebar drawer (nav + backup center + admin) | Browser / Client | Store + external GitHub | Renders nav and hosts the data/backup/admin surface; writes inventory config to store, talks to GitHub via `useSharedPublish`/`useSharedDataSync` hooks (logic unchanged this phase). |
| Route reachability inventory | Build-time doc artifact | — | Static markdown derived from `RootRouter.tsx` + `RootRoutes.ts`; no runtime tier. |
| `@components/Sheet` wrapper | Browser / Client (portal) | — | Portal-rendered overlay via `createPortal(..., document.body)`, extends `FastOverlay`. |

## Standard Stack

No new packages are introduced this phase. The "stack" is the in-repo primitives the work builds on.

### Core
| Library / Primitive | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react` | ^18.2.0 [VERIFIED: package.json] | Class component for error boundary; function components elsewhere | Already the app framework; class boundary is the only API for `getDerivedStateFromError`/`componentDidCatch`. |
| `react-dom` | ^18.2.0 [VERIFIED: package.json] | `createPortal` (used by `FastOverlay`, will be used by `Sheet`) | Already the rendering layer. |
| `react-router-dom` | ^6.22.3 [VERIFIED: package.json] | `BrowserRouter`/`Routes`/`Route`/`Outlet`/`useLocation`/`useNavigate` | The route tree and shell nav depend on it; basis for the reachability inventory. |
| `antd` | ^5.16.1 [VERIFIED: package.json] | Existing UI kit (`Layout`, `Modal`, `Dropdown`, `Flex`, `Divider`, icons) | Themed via `ConfigProvider` in `App.tsx`; fallback UI should reuse antd so it inherits theme/locale. |
| `@playwright/test` | ^1.60.0 [VERIFIED: package.json] | e2e before/after identity proof (D-07) | Existing e2e runner; specs already cover shell flows. |

### Supporting (in-repo, reuse — do not reinvent)
| Primitive | Location | Purpose | When to Use |
|---------|----------|---------|-------------|
| `FastDrawerShell` / `FastModalShell` | `src/Components/FastOverlay/FastOverlay.tsx` | Portal overlay with z-index stacking, scroll-lock, escape-close, reduced-motion | Base for `@components/Sheet` (D-09). |
| `useToggle` | `src/Hooks/useToggle.ts` | `{ show, hide, toggle, value }` open/close state | Drive `Sheet` open state and shell toggles (already used everywhere). |
| `useAppShellNavigation` / `useAppShellNavigationController` | `src/Routing/AppShellNavigationContext.tsx` | `navigateWithFeedback`, route-feedback overlay state | Extracted nav/drawer components consume this context; controller stays in `MasterPage`. |
| `usePageActions` / `usePageActionsState` | `src/Routing/PageActionsContext.tsx` | Header ⋮ menu action registration | `PageActionsMenu` reads `usePageActionsState`; provider wraps `MasterPage` in `RootRouter`. |
| Selectors | `src/Store/Selectors.ts` (`@store/Selectors`) | `selectCurrentFeatureName`, `selectCookingSessions`, `selectDishesById`, `selectInventoryHealthConfig` | Read-only state access in extracted components — keep selector imports identical. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `FastOverlay`-based `Sheet` (D-09) | antd `Drawer placement="bottom"` | Rejected by D-09: introduces a second overlay system with separate z-index stacking and motion behavior, breaking the shell's unified `allocateOverlayStackToken` stacking. Locked. |
| Class error boundary (D-03) | `react-error-boundary` npm package | Adds a dependency for ~30 lines of code; D-03 locks a hand-rolled class component. The class boundary IS the idiomatic primitive here. |
| One top-level boundary (D-01) | Per-route boundaries | A route boundary cannot catch crashes in shell chrome (header/nav/pill/drawer) which render outside the `Outlet`. Locked. |

**Installation:** None. No `npm install` / `yarn add` required this phase.

**Package manager note:** repo uses **yarn** (`yarn.lock` present per STRUCTURE.md). `npm start` is used by the Playwright `webServer` command, but dependency management is yarn.

## Package Legitimacy Audit

**Not applicable — this phase installs zero external packages.** All work uses existing dependencies already in `package.json` (react, react-dom, react-router-dom, antd, @playwright/test) and in-repo primitives. No registry verification needed.

- Packages removed due to [SLOP] verdict: none
- Packages flagged as suspicious [SUS]: none

## Architecture Patterns

### System Architecture Diagram (target state after extraction)

```
                          src/App.tsx
   ConfigProvider (antd theme #7436dc + viVN locale)
        └─ MessageProvider
             └─ ModalProvider
                  └─ redux <Provider store>
                       └─ PersistGate (redux-persist / IndexedDB)
                            └─ AppInitializer
                                 └─ ★ ErrorBoundary (NEW, D-01)        ← catches render crash
                                      │   on crash → Fallback UI (Reload button, VN copy)
                                      └─ RootRouter  (@routing/RootRouter)
                                           └─ BrowserRouter basename="/my-recipes"
                                                └─ Routes
                                                     ├─ /guide/welcome  (lazy, OUTSIDE MasterPage)
                                                     ├─ /guide/tour      (lazy, OUTSIDE MasterPage)
                                                     └─ "/" → PageActionsProvider > MasterPage   ← layout route
                                                              │
                                            ┌─────────────────┴───────────────────────────┐
                                            │   MasterPage (thin composition root)         │
                                            │   AppShellNavigationProvider(controller)     │
                                            │   ┌──────────────────────────────────────┐  │
                                            │   │ <Header> SidebarDrawer btn | title |  │  │
                                            │   │          date | search btn | ⋮ menu   │  │
                                            │   ├──────────────────────────────────────┤  │
                                            │   │ <Content> offline banner + <Outlet/>  │  │ ← child routes render here
                                            │   ├──────────────────────────────────────┤  │
                                            │   │ <BottomTabNavigator/> (fixed)         │  │ ← Shell/
                                            │   │ <CookingPill/>        (fixed)         │  │ ← Shell/
                                            │   │ <GlobalSearchScreen/> (toggle)        │  │
                                            │   └──────────────────────────────────────┘  │
                                            └───────────────────────────────────────────────┘
                       Portals → document.body:  FastDrawerShell (SidebarDrawer), antd Modals,
                                                  route-feedback overlay, ★ Sheet (NEW)
```

Data flow for the primary "navigate via bottom tab" case: user taps a `bottom-tab-*` button → `BottomTabNavigator.onNavigate(href)` → `navigateWithFeedback` (from `AppShellNavigationContext`) → shows route-feedback overlay → `React.startTransition(navigate(href))` → child route renders in `<Outlet/>` → overlay clears after paint.

### Recommended Project Structure (Claude's discretion per CONTEXT; this is a suggested layout)
```
src/Routing/
├── MasterPage.tsx              # collapses to composition root (Header + Outlet + extracted pieces)
├── RootRouter.tsx              # unchanged (still imports MasterPage)
├── RootRoutes.ts               # unchanged
├── AppShellNavigationContext.tsx   # unchanged
├── PageActionsContext.tsx          # unchanged
└── Shell/
    ├── BottomTabNavigator.tsx  # + its _*Styles helpers (co-located, D-05)
    ├── CookingPill.tsx         # + its session-switcher / cooking modals
    ├── SidebarDrawer.tsx       # ~500 lines moved INTACT (D-05) incl. backup-center modal, admin, PIN
    ├── PageActionsMenu.tsx     # small; reads usePageActionsState
    ├── DataBackup.tsx          # dead export — move + preserve export OR flag (D-06)
    └── shellStyles.ts          # OPTIONAL: shared headerVisual maps / sidebarNavButtonStyle / useDeferredDrawerTools

src/Components/
├── ErrorBoundary/              # OR src/Routing/ — Claude's discretion (D-01/D-03)
│   ├── ErrorBoundary.tsx
│   └── index.ts                # barrel → import { ErrorBoundary } from "@components/ErrorBoundary"
└── Sheet/
    ├── Sheet.tsx               # bottom-placement variant on FastOverlay (D-09)
    └── index.ts                # barrel → "export * from './Sheet'"  (@components/Sheet)
```

### Pattern 1: Class Error Boundary (D-03)
**What:** A class component with `static getDerivedStateFromError` (sets a "has error" flag for render) and optional `componentDidCatch` (side-effect logging). Render returns the fallback when flagged, otherwise `this.props.children`.
**When to use:** Exactly one instance, around `RootRouter` (D-01).
**Example:**
```tsx
// Source: React 18 docs (react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
// Pattern only — exact copy/styling is Claude's discretion (D-01/D-02)
import React from "react";

type ErrorBoundaryState = { hasError: boolean };

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{ fallback?: React.ReactNode }>,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // App has no logger (CONVENTIONS.md). Keep side-effects minimal;
    // a guarded console.error is acceptable here, or omit entirely.
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <DefaultFallback />;
    }
    return this.props.children;
  }
}
```
Fallback offers `<Button onClick={() => window.location.reload()}>` with warm Vietnamese copy ("nhà mình"/"nhé" register per specifics). [CITED: react.dev error boundary docs] [VERIFIED: react ^18.2.0 in package.json]

### Pattern 2: Portal Overlay (basis for `Sheet`, D-09)
**What:** `createPortal(<backdrop><panel/></backdrop>, document.body)`, gated on `open`, with shared hooks: `useBodyScrollLock(open)`, `useEscapeClose(open && keyboard, onClose)`, and `useResolvedOverlayZIndex(open, zIndex, baseZIndex)`. Reduced-motion handled by the `.my-recipes-fast-overlay` class + a `@media (prefers-reduced-motion: reduce)` block.
**When to use:** `Sheet` should mirror `FastDrawerShell` but slide from the bottom (panel pinned to bottom, full-width, rounded top corners, `transform: translateY(...)` enter animation).
**Example (shape to follow — `FastDrawerShell` is the closest sibling):**
```tsx
// Source: src/Components/FastOverlay/FastOverlay.tsx (FastDrawerShell, lines 236-304)
export const Sheet: React.FunctionComponent<SheetProps> = ({
  open, title, onClose, children, height, zIndex,
  maskClosable = true, closable = true, keyboard = true, "data-testid": testId,
}) => {
  useBodyScrollLock(open);
  useEscapeClose(open && keyboard, onClose);
  const resolvedZIndex = useResolvedOverlayZIndex(open, zIndex, 1200); // pick a base ≥ drawer's 1150/modal's 1200
  if (!open) return null;
  return createPortal(
    <div className="my-recipes-fast-overlay" style={{ position: "fixed", inset: 0, zIndex: resolvedZIndex,
      display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(16,24,40,0.36)" }}
      onMouseDown={(e) => { if (maskClosable && e.target === e.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" data-testid={testId}
        style={{ width: "100%", maxWidth: 720, maxHeight: height ?? "min(85vh, 720px)",
          borderRadius: "18px 18px 0 0", background: "#fff", /* slide-up animation */ }}
        onMouseDown={(e) => e.stopPropagation()}>
        {/* header (title + close) + scrollable body */}
      </section>
    </div>, document.body);
};
```
**Note:** `useBodyScrollLock`, `useEscapeClose`, `useResolvedOverlayZIndex`, `allocateOverlayStackToken`, and the `overlayMotionStyles` `<style>` block are currently **module-private** in `FastOverlay.tsx` (not exported). To build `Sheet` in `src/Components/Sheet/` either (a) add `Sheet` *inside* `FastOverlay.tsx` and re-export it from the `FastOverlay` barrel, or (b) export the shared hooks/utilities so a sibling file can consume them. Option (a) keeps the stacking-token module state (`nextOverlayStackToken` / `activeOverlayStackTokens` are module-level singletons) shared correctly — **important**: if `Sheet` lives in a separate module that re-declares those, the shared z-index stack breaks. Recommend co-locating `Sheet` in `FastOverlay.tsx` (or a sibling that imports the singletons) and re-exporting under `@components/Sheet`. [VERIFIED: src/Components/FastOverlay/FastOverlay.tsx lines 47-105]

### Pattern 3: Deferred / eager render perf idioms (preserve verbatim)
- `useDeferredDrawerTools(open)` (MasterPage lines 184-211): double-`requestAnimationFrame` gate so the drawer's heavy "tools" section renders one frame after the drawer opens. Move with `SidebarDrawer`.
- `DeferredModalContent` (`@components/Modal`) wraps modal bodies and only renders children when `active`. Used by the backup-center, cooking, and DataBackup modals. Keep as-is.
- `<Image loading="eager">` in the drawer header. Keep.

### Anti-Patterns to Avoid
- **Renaming any `data-testid` during the move** (D-08): breaks the e2e identity proof. Move them byte-for-byte.
- **Refactoring `SidebarDrawer` internals** (D-05): the backup center, admin publish, inventory config, and PIN modal move as one block. No "while I'm here" cleanups.
- **Re-declaring overlay stacking-token singletons** in a new `Sheet` module: would fork the z-index stack (see Pattern 2 note).
- **Putting the error boundary outside `ConfigProvider`**: the fallback would lose antd theme/locale (D-01).
- **Changing the provider nesting order** in `App.tsx`: only insert the boundary around `RootRouter`; do not reorder `ConfigProvider`/`MessageProvider`/`ModalProvider`/`Provider`/`PersistGate`/`AppInitializer`.

## Extraction Inventory (the precise FND-02 map)

Source: `src/Routing/MasterPage.tsx` (1366 lines). All line numbers verified by reading the file.

### Top-level units and their boundaries
| Unit | Lines | Export? | data-testid hooks owned | Moves to |
|------|-------|---------|--------------------------|----------|
| `MasterPage` | 213-297 | `export const` | `global-search-button` (266), header chrome | Composition root (stays as `MasterPage`) |
| `PageActionsMenu` | 299-324 | local (not exported) | `page-actions-button` (319) | `Shell/PageActionsMenu.tsx` |
| `SidebarDrawer` | 326-824 | local | `sidebar-drawer-button` (526), `sidebar-drawer` (541), `sidebar-drawer-primary-nav` (545), `sidebar-drawer-tools` (567), `sidebar-nav-group-${key}` (548), `sidebar-nav-${item.key}` (554) | `Shell/SidebarDrawer.tsx` (INTACT, D-05) |
| `CookingPill` | 826-1017 | local | `active-cooking-floating-button` (869) | `Shell/CookingPill.tsx` |
| `BottomTabNavigator` | 1019-1275 | local | `bottom-tab-navigator` (1203), `bottom-tab-dishes` (1210), `bottom-tab-scheduled-meals` (1223), `bottom-tab-suggester` (1236), `bottom-tab-shopping-list` (1249), `bottom-tab-expense-planner` (1262) | `Shell/BottomTabNavigator.tsx` |
| `DataBackup` | 1277-1366 | `export const` | (none) | `Shell/DataBackup.tsx` — **dead, see D-06 finding below** |

### Shared module-level constants / helpers (lines 58-211) — co-locate with consumers (D-05)
| Symbol | Lines | Consumed by |
|--------|-------|-------------|
| `layoutStyles` | 58-60 | MasterPage |
| `drawerToolsPlaceholderStyle`, `sidebarNavListStyle`, `sidebarNavGroupStyle`, `sidebarNavSectionLabelStyle` | 62-89 | SidebarDrawer |
| `APP_CONFIRM_Z_INDEX` (=5200) | 91 | SidebarDrawer (publish confirm modal) |
| `headerActionButtonStyle` | 93-104 | MasterPage, PageActionsMenu, SidebarDrawer (button) |
| `HeaderVisual` type, `defaultHeaderVisual`, `headerVisualByFeatureName`, `getHeaderVisualByPath`, `getHeaderVisual`, `createHeaderBackground`, `getHeaderDateLabel` | 106-163 | MasterPage |
| `sidebarNavButtonStyle(active)` | 165-182 | SidebarDrawer |
| `useDeferredDrawerTools(open)` | 184-211 | SidebarDrawer |

If a shared `Shell/shellStyles.ts` is created, `headerActionButtonStyle` is the only constant used by 3 units (MasterPage, PageActionsMenu, SidebarDrawer) — a natural shared-module candidate. The header-visual helpers are MasterPage-only and can travel with it.

### Dependencies that must move with each unit (import contract)
- **MasterPage:** `selectCurrentFeatureName` (`@store/Selectors`); `useOnlineStatus`, `useToggle` (`@hooks`); `useLocation`/`useNavigate`/`Outlet` (react-router-dom); `useAppShellNavigationController` + `AppShellNavigationProvider` (`./AppShellNavigationContext`); `GlobalSearchScreen` (`@modules/Home/Screens/GlobalSearch.screen`); `isUserGuideWelcomeComplete` (`@modules/Home/Screens/UserGuideOnboardingStorage`); `RootRoutes`; antd `Layout`; `Header`/`Content`/`Stack` layout components; `Typography`, `Tooltip`, `Button`, `SearchOutlined`.
- **PageActionsMenu:** `usePageActionsState` (`./PageActionsContext`); antd `Dropdown`; `MoreOutlined`; `Button`; `headerActionButtonStyle`.
- **SidebarDrawer:** `useDispatch`/`useSelector`; `useAdminMode`, `useToggle`, `useSharedPublish`, `useSharedDataSync`, `SyncedVersions` (`@hooks`); `useMessage` (`@components/Message`); `useModal` (`@components/Modal/ModalProvider`); `Modal`, `DeferredModalContent`; `FastDrawerShell` (`@components/FastOverlay`); `SharedSyncModal` (`@components/AppInitializer/SharedSyncModal`); `GistBackupWidget` (`@components/GistBackupWidget`); `ScheduledMealToolkitWidget` (`@modules/ScheduledMeal/...`); `selectInventoryHealthConfig` (`@store/Selectors`); inventory models + `updateInventoryConfig` reducer (`@store/Models/*`, `@store/Reducers/SharedConfigReducer`); `NumberStepper`, `SmartForm`, `TextArea`, `Image`, `ActionButton`/`Button`, `Box`/`Space`/`Stack`/`Flex`/`Divider`; many `@ant-design/icons`; all 16 PNG asset imports (lines 34-50) — note these are `../../assets/...` relative paths and **must be re-pathed** to `../../../assets/...` when moved one level deeper into `Shell/`. `RootRoutes`; `useAppShellNavigation` (`./AppShellNavigationContext`); `useLocation`.
- **CookingPill:** `useSelector`; `selectCookingSessions`, `selectDishesById` (`@store/Selectors`); `Modal`, `DeferredModalContent`; `CookingSessionWidget` (`@modules/Dishes/Screens/CookingSession.widget`); `Typography`, `Space`, `Flex`; `FireOutlined`.
- **BottomTabNavigator:** `useLocation`; `useToggle` (`@hooks`); `useAppShellNavigation` (`./AppShellNavigationContext`); `RootRoutes`; `Image`, `Typography`; `DishSuggesterScreen` (`@modules/DishSuggester/Screens/DishSuggester.screen`); `DishesIcon`/`DietPlanIcon`/`SuggesterIcon`/`ShoppingListIcon`/`BudgetIcon` asset imports (**re-path** for new depth).
- **DataBackup:** `ObjectPropertyHelper` (`@common/Helpers/ObjectProperty`); `getStorageString`/`setStorageString` (`@common/Storage/AppStorage`); `useToggle`, `useMessage`; `Modal`, `DeferredModalContent`; `SmartForm`/`useSmartForm`, `TextArea`, `Box`/`Space`/`Stack`, `ActionButton`/`Button`; `CopyToClipboard` (`react-copy-to-clipboard`); icons. Contains the hardcoded `raw.githubusercontent.com/quantran-epi/my-recipes` URL (line 1306).

### CRITICAL re-path gotcha
The asset imports use `../../assets/icons/*.png` (relative, lines 34-50) because `MasterPage.tsx` is at `src/Routing/`. Moving a component into `src/Routing/Shell/` adds one directory level, so those relative paths become **`../../../assets/icons/*.png`**. Similarly `./AppShellNavigationContext`, `./PageActionsContext`, and `./RootRoutes` become `../`. Aliased imports (`@components`, `@store`, `@hooks`, `@modules`, `@common`) are unaffected. With `strict: false` and `target: es5`, TypeScript will not always catch a wrong relative path at edit time — rely on the craco build (`typescript.enableTypeChecking: true`) and the dev server to surface broken imports. [VERIFIED: src/Routing/MasterPage.tsx lines 34-56]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bottom-sheet overlay (scroll-lock, escape, z-index stack, reduced-motion) | A fresh overlay/portal | Extend `FastOverlay` (D-09) | The shell already standardizes stacking via module-singleton tokens; a second system forks z-index/motion behavior. |
| Open/close state for `Sheet` and shell toggles | `useState` + manual handlers | `useToggle` (`@hooks`) | Returns memoized `{show, hide, toggle, value}`; used app-wide. |
| Error-recovery affordance | A bespoke recovery state machine | `window.location.reload()` (D-02) | Matches the app's existing reload-as-recovery idiom; granular reset is explicitly out of scope. |
| Route table for the inventory | A new route registry | Read `RootRoutes.ts` + `RootRouter.tsx` | The route table already exists; the inventory is a derived doc, not new code. |
| Deferred heavy-section render | New lazy logic | Keep `useDeferredDrawerTools` + `DeferredModalContent` | Existing perf idioms; moving intact preserves identical timing behavior. |

**Key insight:** This phase has almost no genuinely new logic. The error boundary is ~30 lines of a well-known React pattern; `Sheet` is a third variant of an overlay you already own. The risk is in the *mechanical fidelity* of the move (paths, test ids, intact internals), not in inventing anything.

## Runtime State Inventory

This is a pure code-move + additive phase (no rename of persisted keys, env var names, or service identifiers). Each category checked explicitly:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | **None.** Extraction does not touch persisted keys. `redux-persist` roots `persist:shared` / `persist:personal` are written by reducers/Store, not by the moved shell components. `DataBackup` reads/writes `persist:personal` (lines 1293, 1330) but its *behavior and key string* are unchanged by a move. | None (code move only) |
| Live service config | **None.** No external service stores a string defined in these files. `useSharedPublish`/`useSharedDataSync` (GitHub sync) are hooks imported from `@hooks` and are not modified. | None |
| OS-registered state | **None.** This is a browser PWA; no OS task/service registrations reference shell symbols. | None |
| Secrets / env vars | **None renamed.** The GitHub publish token (`githubTokenSource: "build" \| "local"`) and admin PIN are handled inside `useSharedPublish`/`useAdminMode` (not in MasterPage). The build-time token env var name is unchanged. `DataBackup`'s hardcoded GitHub raw URL (line 1306) is a literal, not an env var — flagged for follow-up per Deferred Ideas, not changed here. | None (code rename only / none) |
| Build artifacts | **None.** No package rename, no `pyproject`/`egg-info`/binary. New files are compiled by craco like any other `src/` module. | None |

**Summary:** Nothing in any runtime-state category requires a data migration. The only "state" risk is purely compile-time: relative import paths and asset paths after the one-level directory move (see CRITICAL re-path gotcha above).

## Common Pitfalls

### Pitfall 1: The e2e baseline is likely already RED (HIGHEST RISK)
**What goes wrong:** D-07 requires a green "before" baseline so the "after" proves identity. But `tests/e2e/app-shell-navigation.spec.ts` asserts strings that do not appear in the current `MasterPage.tsx`:
- Line 17: expects drawer primary nav to contain **"Kế hoạch chi phí"** — source renders the expense-planner nav item as **"Tính chi phí"** (MasterPage line 502). Mismatch.
- Lines 22-25: expects the **`sidebar-drawer-tools`** region to contain "Đồng bộ dữ liệu mới", "Sao lưu cá nhân", "Lịch sử nấu ăn". In the source, "Lịch sử nấu ăn" is a *primary-nav* item (line 498, not in tools); "Sao lưu cá nhân" and the sync button ("Đồng bộ mới", line 672) live inside the **backup-center Modal that only opens after clicking "Dữ liệu & sao lưu"** (line 573) — they are not in the always-rendered tools region.

**Why it happens:** The spec appears to predate a shell relabel/reorganization; it was not updated when `MasterPage` changed. (It is also possible the spec targets a not-yet-merged design — either way it does not match `main`.)
**How to avoid:** **Wave 0 must run the existing shell specs and establish the real green baseline first.** Either repair the stale assertions to match current source (preferred — this is "describe what is", not a behavior change) or replace them with correct shell-interaction specs, BEFORE any extraction. Do not begin the move until the chosen baseline specs are green. After extraction, the SAME specs must pass unchanged.
**Warning signs:** `yarn test:e2e` reporting failures in `app-shell-navigation.spec.ts` on a clean checkout, before you've touched anything. [VERIFIED: cross-read of tests/e2e/app-shell-navigation.spec.ts vs src/Routing/MasterPage.tsx]

### Pitfall 2: Broken relative imports after the one-level move
**What goes wrong:** Components moved from `src/Routing/` to `src/Routing/Shell/` keep `../../assets/...` and `./AppShellNavigationContext` paths, which now resolve wrong.
**Why it happens:** One extra directory level; `strict:false` + `es5` target means TS may not flag every break at edit time.
**How to avoid:** Re-path every relative import: assets `../../` → `../../../`; sibling Routing modules `./` → `../`. Run the craco build (`yarn build`) and dev server (`npm start`) after each extraction; both do real type-checking (`typescript.enableTypeChecking: true`). [VERIFIED: MasterPage import lines 34-56]

### Pitfall 3: Forking the overlay z-index stack when building `Sheet`
**What goes wrong:** `Sheet` placed in a new module re-declares `nextOverlayStackToken` / `activeOverlayStackTokens`, so its stacking is computed independently of `FastDrawerShell`/`FastModalShell` — overlapping overlays render at wrong depths.
**Why it happens:** Those singletons are module-private in `FastOverlay.tsx` (lines 47-48) and not exported.
**How to avoid:** Define `Sheet` inside `FastOverlay.tsx` (re-export via the barrel) OR export the shared hooks/singletons and import them. Do not copy-paste the stacking logic. [VERIFIED: FastOverlay.tsx lines 47-105]

### Pitfall 4: Error boundary mounted outside `ConfigProvider`
**What goes wrong:** A fallback rendered above `ConfigProvider` loses antd theme tokens (primary `#7436dc`) and `viVN` locale, so the recovery UI looks unstyled/English.
**How to avoid:** Mount the boundary *inside* `ConfigProvider`, wrapping `RootRouter` (D-01). The existing order in `App.tsx` is `ConfigProvider > MessageProvider > ModalProvider > Provider > PersistGate > AppInitializer > RootRouter` — the boundary goes just outside `<RootRouter/>` (innermost) or around `AppInitializer`, but must stay inside `ConfigProvider`. [VERIFIED: src/App.tsx lines 19-54]

### Pitfall 5: Error boundary will not catch what users might expect
**What goes wrong:** Stakeholders assume the boundary catches all errors. React error boundaries only catch errors thrown during **render / lifecycle / constructor** of descendants — NOT event handlers, async callbacks, timers, or SSR (D-03 acknowledges this).
**How to avoid:** Frame the success criterion precisely (a *thrown render error* shows recovery UI). The e2e proof for FND-01 should trigger a render-phase throw (e.g. a test-only route/component that throws during render), not a click-handler throw. [CITED: react.dev error boundary docs]

### Pitfall 6: Playwright `reuseExistingServer: true` masks a stale build
**What goes wrong:** `playwright.config.ts` sets `reuseExistingServer: true`; if a dev server from before the extraction is still running, e2e may test stale code.
**How to avoid:** Restart the dev server (or kill port 3010) before the "after" e2e run. Note `FAST_REFRESH=false` is set in `start`, so a full reload is needed to pick up changes. [VERIFIED: playwright.config.ts + package.json start script]

## Code Examples

See Pattern 1 (error boundary) and Pattern 2 (`Sheet` on `FastOverlay`) above — both are grounded in actual repo source (`src/Components/FastOverlay/FastOverlay.tsx`) and React 18 docs. No additional external examples are needed since no new libraries are introduced.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Class lifecycle for everything | Function components + hooks; class reserved for error boundaries only | React 16.8+ (hooks) | D-03 correctly identifies the boundary as the one idiomatic class. |
| `componentDidCatch` for render-state | `static getDerivedStateFromError` sets render state; `componentDidCatch` for side-effects only | React 16.6+ | Use both; `getDerivedStateFromError` drives the fallback render. |
| antd `Drawer`/`Modal` for all overlays | In-repo `FastOverlay` portal system (perf: eager render, shared stacking) | (in-repo decision, pre-this-milestone) | `Sheet` extends `FastOverlay`, not antd (D-09). |

**Deprecated/outdated:** None relevant. The `src/App.test.tsx` smoke test asserts on `/learn react/i` (CRA default) and is noted as stale in TESTING.md — not this phase's concern, but do not rely on it as a shell test.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The stale `app-shell-navigation.spec.ts` assertions reflect the spec lagging behind `main` (not a separate intended design) | Pitfall 1 | If the spec encodes a desired future design, "repairing to match source" would be wrong — planner should confirm with user whether to fix spec-to-source or source-to-spec. Recommend running the spec on a clean checkout to observe actual pass/fail before deciding. |
| A2 | Co-locating `Sheet` in `FastOverlay.tsx` (vs exporting the singletons) is acceptable given Claude's discretion over `Sheet`'s layout | Pattern 2 / Pitfall 3 | Low — both options preserve the shared stack; this is a structural preference, not a correctness issue. |
| A3 | `DataBackup` is genuinely dead (safe to flag rather than wire up) | D-06 finding | Low — grep across `src/` returned exactly one match (the definition). If a dynamic/string-based import existed it would not show, but none is plausible for a named React export. |

## Open Questions (RESOLVED)

1. **Is the `app-shell-navigation.spec.ts` mismatch a stale spec or an intended target design?**
   - **RESOLVED — fix spec-to-source per the phase's "verified identical" contract; baseline observed first in 02-01 Task 1.** The extraction proves behavioral identity against current source, so source is the source of truth. 02-01 Task 1 runs the spec on a clean checkout to observe the real pass/fail baseline, then repairs the stale assertions to match source before any extraction begins.
   - What we know: The spec's expected strings ("Kế hoạch chi phí", tools-region backup labels) do not match current `MasterPage.tsx` source.
   - What's unclear: Whether the spec was written against a previous shell version, or against a design that was never implemented.
   - Recommendation: Wave 0 runs `yarn test:e2e tests/e2e/app-shell-navigation.spec.ts` on the clean checkout to observe actual failures, then the planner adds a `checkpoint:human-verify` (or reconciliation task) to decide fix-spec-to-source vs source-to-spec before extraction. Default assumption: fix spec to match source (extraction is "verified identical", so source is the source of truth).

2. **`DataBackup` disposition (D-06).**
   - **RESOLVED — keep + flag per locked decision D-06 (implemented in 02-05 Task 2).** Move `DataBackup` into `Shell/DataBackup.tsx` preserving the export, add a code comment flagging it as currently-unused with a hardcoded GitHub raw URL, and note it in ROUTE-INVENTORY.md; do NOT delete this phase.
   - What we know: Dead export, hardcoded GitHub raw URL, only self-reference in the tree.
   - What's unclear: Whether the owner wants it kept (move + preserve export, flag URL for follow-up) or removed.
   - Recommendation: Per D-06, move it to `Shell/DataBackup.tsx` preserving the export and add a code comment + inventory note flagging it as unused with a hardcoded URL; do NOT delete in this phase. A `checkpoint:human-verify` to confirm "keep vs delete" is appropriate.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node + yarn | build / dev server | ✓ (repo uses yarn.lock) | — | — |
| React / react-dom | error boundary, portal | ✓ | ^18.2.0 | — |
| antd | fallback UI, shell | ✓ | ^5.16.1 | — |
| @playwright/test | e2e identity proof | ✓ | ^1.60.0 | — |
| Chromium (Playwright browser) | e2e run | Assumed installed (specs exist + run) | — | `npx playwright install chromium` if missing |
| Dev server on port 3010 | Playwright `webServer` | Started on demand via `npm start` | — | set `E2E_PORT` |

**Missing dependencies with no fallback:** none identified.
**Missing dependencies with fallback:** Chromium browser binary — if `yarn test:e2e` errors with a missing-browser message, run `npx playwright install chromium`.

## Validation Architecture

`nyquist_validation` is `true` in config — section included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (CRA `react-scripts test`) for unit; Playwright `@playwright/test` ^1.60.0 for e2e |
| Config file | `playwright.config.ts` (e2e); no standalone jest config (CRA built-in) |
| Quick run command | `yarn test:e2e tests/e2e/app-shell-navigation.spec.ts` (single shell spec) |
| Full suite command | `yarn test:e2e` (all e2e) + `CI=true yarn test --watchAll=false` (unit) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FND-01 | A thrown render error shows recovery UI (Reload), not white screen | e2e | `yarn test:e2e tests/e2e/error-boundary.spec.ts` | ❌ Wave 0 (new spec; needs a test-only component/route that throws in render) |
| FND-02 | Drawer open shows primary nav + tools; nav items navigate | e2e | `yarn test:e2e tests/e2e/app-shell-navigation.spec.ts` | ✅ exists — but **stale/likely red** (Pitfall 1); repair in Wave 0 |
| FND-02 | Bottom-tab active states + navigation | e2e | `yarn test:e2e tests/e2e/app-shell-navigation.spec.ts` (extend) | ⚠️ partial — `bottom-tab-*` exercised via dish-suggester spec; add explicit active-state assertions |
| FND-02 | Cooking pill appears with active session, opens cooking modal | e2e | `yarn test:e2e tests/e2e/cooking-pill.spec.ts` | ❌ Wave 0 (needs seed with a `status:"cooking"` session; `active-cooking-floating-button` not currently asserted) |
| FND-02 | Global search opens from header button | e2e | `yarn test:e2e tests/e2e/global-search.spec.ts` | ✅ exists (covers `global-search-button`) |
| FND-02 | Dish suggester opens from center bottom-tab | e2e | `yarn test:e2e tests/e2e/dish-suggester.spec.ts` | ✅ exists |
| MOB-03 | `@components/Sheet` mounts and opens | e2e or unit | `yarn test:e2e tests/e2e/sheet-smoke.spec.ts` | ❌ Wave 0 (D-10 smoke proof; needs a temporary test harness mounting Sheet) |

### Sampling Rate
- **Per task commit:** `yarn test:e2e tests/e2e/app-shell-navigation.spec.ts` (the moved-component being touched) + `yarn build` for type-check.
- **Per wave merge:** `yarn test:e2e` (full e2e suite — the identity proof).
- **Phase gate:** Full e2e suite green AND `yarn build` clean before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] Repair/confirm `tests/e2e/app-shell-navigation.spec.ts` to a real green baseline (Pitfall 1) — covers FND-02
- [ ] `tests/e2e/error-boundary.spec.ts` + a test-only render-throw trigger — covers FND-01
- [ ] `tests/e2e/cooking-pill.spec.ts` (+ seed a `cooking` session in `fixtures/testData.ts`) — covers FND-02 pill
- [ ] Bottom-tab active-state assertions (extend app-shell-navigation spec) — covers FND-02 nav
- [ ] `tests/e2e/sheet-smoke.spec.ts` (+ a temporary mount harness) — covers MOB-03 D-10
- [ ] No new framework install needed (Playwright + Jest already present)

## Security Domain

`security_enforcement: true`, ASVS level 1, `security_block_on: high`. This is a pure-move + additive phase that introduces **no new attack surface** (no new endpoints, no new auth, no new network calls — the `Sheet` wrapper and error boundary are client UI; the GitHub token / PIN logic moves untouched).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Admin PIN logic (`useAdminMode`) is moved intact, not modified this phase. |
| V3 Session Management | no | Unchanged. |
| V4 Access Control | no | Unchanged (admin-gated sections move as-is). |
| V5 Input Validation | minimal | `DataBackup` import textarea parses base64/JSON (lines 1285-1299) — moved verbatim, validation logic unchanged. No new inputs added. |
| V6 Cryptography | no | No crypto introduced; do not hand-roll any. |
| V7 Error Handling & Logging | yes (light) | New error boundary should NOT leak stack traces / sensitive data into the user-facing fallback. Keep fallback copy generic ("đã có lỗi… tải lại nhé"); avoid rendering `error.message` to users. App has no logger (CONVENTIONS.md) — a guarded `console.error` in `componentDidCatch` is acceptable; do not log tokens/PII. |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Error fallback leaks internal error details | Information Disclosure | Render a generic VN message + Reload button; do not surface `error.message`/stack to the UI (D-02). |
| Moved `DataBackup` re-exposes a hardcoded GitHub raw URL (line 1306) | Tampering / Supply chain (untrusted fetch → `setStorageString`) | **Pre-existing, out of scope per Deferred Ideas.** Do not change behavior, but flag in the inventory; the import path trusts remote content and overwrites `persist:personal`. Recommend the planner record this as a tracked CONCERN, not fix it here. |
| Plaintext GitHub PAT + baked token (CONCERNS.md) | Information Disclosure | Pre-existing, explicitly out of scope this phase. Move logic untouched. |

**Net security posture:** No `high` findings introduced by this phase's own changes. The one new component with any security relevance is the error boundary (V7) — mitigation is "generic fallback, no sensitive logging." Pre-existing concerns (baked token, plaintext PAT, untrusted backup-import URL) are carried forward unchanged and flagged, per the locked Deferred Ideas.

## Sources

### Primary (HIGH confidence)
- `src/Routing/MasterPage.tsx` (full read, 1366 lines) — extraction inventory, test ids, shared helpers, dead `DataBackup`
- `src/App.tsx` (full read) — provider nesting order for D-01 boundary mount
- `src/Components/FastOverlay/FastOverlay.tsx` (full read) — `FastDrawerShell`/`FastModalShell` API, stacking singletons, scroll-lock/escape/reduced-motion hooks
- `src/Routing/RootRouter.tsx` + `src/Routing/RootRoutes.ts` (full read) + 4 module RouteConfig files — full route tree for reachability inventory
- `src/Routing/AppShellNavigationContext.tsx` + `PageActionsContext.tsx` (full read) — context APIs the extracted pieces consume
- `tests/e2e/app-shell-navigation.spec.ts`, `dish-suggester.spec.ts`, `global-search.spec.ts` (full read) — baseline coverage + the stale-spec finding
- `playwright.config.ts`, `package.json` (read) — run commands, versions, `reuseExistingServer`
- `.planning/codebase/{STRUCTURE,CONVENTIONS,TESTING}.md` — conventions, aliases, test framework
- grep: `getDerivedStateFromError|componentDidCatch|ErrorBoundary` → zero hits (no boundary exists); `DataBackup` → one hit (definition only, confirming dead)

### Secondary (MEDIUM confidence)
- react.dev error boundary documentation [CITED] — class-component pattern, render-only catch semantics (training knowledge consistent with React 18.2 behavior; not re-fetched this session)

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions read directly from package.json; no new packages.
- Architecture / extraction inventory: HIGH — every component, line range, test id, and import read from source.
- Pitfalls: HIGH — the stale-spec finding is verified by cross-reading the spec against source; re-path and z-index findings verified against actual file locations and module-private singletons.
- Error boundary pattern: MEDIUM-HIGH — standard React pattern (docs cited, not re-fetched), verified compatible with react ^18.2.0.

**Research date:** 2026-06-14
**Valid until:** 2026-07-14 (stable in-repo codebase; no fast-moving external deps). Re-validate the e2e baseline finding (Pitfall 1) immediately at planning time by running the spec, since it gates the whole phase.
