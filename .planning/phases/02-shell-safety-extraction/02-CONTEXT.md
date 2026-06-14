# Phase 2: Shell Safety & Extraction - Context

**Gathered:** 2026-06-14
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase makes the app shell **crash-contained and decomposed**, separating "pure move, verified identical" from any behavior change. It delivers four things:

1. A **top-level error boundary** so an uncaught render error shows a recovery UI instead of white-screening the whole app.
2. **Extraction** of the bottom-tab navigator, cooking pill, sidebar drawer, and data-backup out of the 1366-line `src/Routing/MasterPage.tsx` into `src/Routing/Shell/`, with pill, nav, drawer, search, and backup behaving **identically** to before.
3. A **route reachability inventory** listing every pre-refactor route and its entry path, ready to gate later nav changes (Phase 4).
4. A **`@components/Sheet`** bottom-drawer wrapper available for pickers and confirmations (consumed in Phase 5; built here).

**In scope:**
- Error boundary component + mount at the top level (around `RootRouter`)
- Mechanical file-per-component extraction from `MasterPage.tsx` → `src/Routing/Shell/`
- Playwright e2e before/after characterization of the shell pieces
- A static route reachability inventory document
- The `@components/Sheet` wrapper (component + API only)

**Explicitly NOT in scope (later phases):**
- Reworking nav information architecture, hero entry, or the bottom-nav center action → Phase 4 (NAV-*)
- Migrating existing pickers/confirmations onto `Sheet` → Phase 5 (MOB-03)
- Splitting the internals of `SidebarDrawer` (backup center, admin publish, inventory config) into separate components → not this phase (move intact)
- Fixing the "reload-as-recovery after sync" mechanism or the baked-token/PIN security concerns → out of this phase
- Copy migration of shell strings to `AppCopy` → Phase 5 (COPY-03)

This phase is a **safety net + decomposition**, not a behavior change. Success = error boundary catches a crash and offers recovery, shell pieces live in their own files and behave identically (proven by e2e), the route inventory exists, and `Sheet` is available.

</domain>

<decisions>
## Implementation Decisions

### Error Boundary
- **D-01:** Mount **one top-level error boundary around `RootRouter`** (in `src/App.tsx`, wrapping `<RootRouter />` inside the existing provider stack — `ConfigProvider` → `MessageProvider` → `ModalProvider` → `Provider` → `PersistGate` → `AppInitializer`). This satisfies FND-01 ("prevent a shell crash from white-screening the whole app"): a crash in shell chrome (header, nav, pill, drawer) is explicitly in scope and a route-level boundary would not catch it. Place the boundary so the fallback still renders within `ConfigProvider` (antd theme/locale available) — i.e. inside `ConfigProvider`, around `RootRouter` (or as close to it as the provider order allows).
- **D-02:** The fallback UI offers a **Reload button** (`window.location.reload()`) as the recovery affordance, with friendly Vietnamese copy. This matches the app's existing reload-as-recovery idiom (already used after Gist sync / SW update / admin lock-unlock per CONCERNS.md). No need for granular in-place reset state in this phase.
- **D-03:** A React error boundary must be a **class component** (no hook equivalent for `getDerivedStateFromError` / `componentDidCatch`) — this is the one place a class component is idiomatic and required. Catch is render-only (React error boundaries do not catch event-handler or async errors); that's acceptable for the white-screen-prevention goal.

### Extraction Granularity
- **D-04:** **File-per-component move.** Extract each existing top-level shell piece into its own file under `src/Routing/Shell/`: `BottomTabNavigator`, `CookingPill`, `SidebarDrawer`, and the data-backup surface. `MasterPage.tsx` becomes a thin composition root that imports them.
- **D-05:** **Move components intact — do NOT refactor their internals this phase.** Specifically, `SidebarDrawer` (~500 lines, bundling primary nav + the "Dữ liệu & sao lưu" backup-center modal + admin publish + inventory config + PIN modal) moves as a single unit. Splitting its internals is deliberately deferred to keep the "pure move, verified identical" guarantee clean and the diff reviewable. The planner may co-locate the shared style constants / small helpers (e.g. `headerVisual` maps, `sidebarNavButtonStyle`, `useDeferredDrawerTools`) alongside the components that use them, but no logic changes.
- **D-06:** Resolve the existing **`DataBackup` export** (currently exported from `MasterPage.tsx` but apparently no longer rendered by `MasterPage`; uses a hardcoded `raw.githubusercontent.com/quantran-epi/my-recipes` URL). The planner must grep for its callers first: if used elsewhere, move it intact preserving the export; if genuinely dead, note it in the inventory but do not silently delete as part of a "pure move" (flag for a follow-up). Extraction must not change `MasterPage`'s rendered output.

### "Verified Identical" Proof
- **D-07:** Prove behavioral identity via **Playwright e2e before/after**. Capture/confirm e2e coverage of the shell interactions BEFORE extraction (baseline green), then re-run AFTER extraction and require the same specs pass unchanged. Existing specs already cover navigation, dashboard, dish suggester, shopping list, global search (per TESTING.md / CONCERNS.md) — reuse those; add focused specs only where a shell interaction (drawer open/close, pill states, bottom-nav active states, search open) is not already exercised.
- **D-08:** Preserve all **`data-testid` hooks** during the move (`sidebar-drawer-button`, `sidebar-drawer`, `bottom-tab-*`, `active-cooking-floating-button`, `global-search-button`, `page-actions-button`, the `sidebar-nav-*` ids, etc.). These are the contract the e2e proof relies on; renaming them would break the "identical" claim.

### Sheet Wrapper (`@components/Sheet`)
- **D-09:** Build `@components/Sheet` by **extending the existing `FastOverlay` portal system** (a bottom-placement variant alongside `FastDrawerShell` / `FastModalShell`), NOT antd `Drawer placement="bottom"`. Rationale: the shell already standardizes on `FastOverlay` (shared z-index stacking via `allocateOverlayStackToken`, body-scroll-lock, escape-to-close, `prefers-reduced-motion` handling, eager render for perf). A raw antd Drawer would introduce a second overlay system with separate stacking/motion behavior. **This is a conscious divergence from the literal roadmap/REQUIREMENTS wording** ("over antd `Drawer placement=\"bottom\"`") — recorded here so the planner and Phase 5 treat it as an intentional decision, not a deviation to "fix". The wrapper presents a Sheet-shaped API (bottom sheet semantics) regardless of the underlying implementation.
- **D-10:** **Wrapper only, no migration this phase.** Ship the `Sheet` component + barrel (`@components/Sheet`) with its public API; do not migrate any existing picker/confirmation onto it. First real consumers arrive in Phase 5 (MOB-03). Include at least a minimal usage/smoke proof that it mounts and opens.

### Claude's Discretion
- Exact filenames and any sub-folder layout under `src/Routing/Shell/` (e.g. `Shell/BottomTabNavigator.tsx` vs `Shell/BottomTabNavigator/`), and whether `MasterPage.tsx` itself moves into `Shell/` or stays in `Routing/` as the composition root.
- The error-boundary component's filename/location (`src/Components/ErrorBoundary/` vs `src/Routing/`), its visual design, and the exact Vietnamese fallback copy (seed via `AppCopy` if a natural namespace fits; otherwise inline and defer to Phase 5).
- The route reachability inventory's exact format and filename (e.g. a markdown table under the phase dir or `docs/`), as long as it lists every pre-refactor route + entry path and is usable to gate Phase 4 nav changes.
- The `Sheet` API surface (prop names, height/snap behavior) — design it to cover Phase 5's picker + confirmation needs.
- Whether to add new shell-specific e2e specs or extend existing ones to close coverage gaps before extraction.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` — FND-01 (top-level error boundary), FND-02 (extract shell pieces, behavior verified identical), MOB-03 (Sheet over antd `Drawer placement="bottom"` — note D-09 divergence). NAV-* and MOB-* other than the Sheet build are Phase 4/5, NOT this phase.
- `.planning/ROADMAP.md` §"Phase 2: Shell Safety & Extraction" — goal + 4 success criteria (error boundary, extraction to `src/Routing/Shell/`, reachability inventory, `@components/Sheet`).

### Codebase maps (this milestone)
- `.planning/codebase/CONCERNS.md` — "No React error boundary" gap (FND-01 origin), "Oversized screen/widget files" (`MasterPage.tsx` 1366 lines), "Reload-as-recovery after sync" known bug (informs error-boundary recovery idiom; not fixed here).
- `.planning/codebase/STRUCTURE.md` §"Where to Add New Code" — `src/Routing/` for shell chrome, `src/Components/<Name>/` + barrel for shared UI (`@components/Sheet`), path aliases.
- `.planning/codebase/CONVENTIONS.md` — file naming (`.screen`/`.widget`/leaf), single-object exports, `strict: false` (guard manually), antd v5 + Vietnamese copy, match surrounding indentation/quote style.
- `.planning/codebase/TESTING.md` — Playwright e2e setup + existing specs (the before/after proof basis for D-07).

### Key source files (the extraction targets / integration points)
- `src/Routing/MasterPage.tsx` — the 1366-line shell: `MasterPage`, `PageActionsMenu`, `SidebarDrawer`, `CookingPill`, `BottomTabNavigator`, `DataBackup`. Source of all extractions.
- `src/App.tsx` — provider stack; error-boundary mount point (D-01).
- `src/Routing/RootRouter.tsx`, `src/Routing/RootRoutes.ts` — route tree + route table; basis for the reachability inventory.
- `src/Components/FastOverlay/FastOverlay.tsx` — existing portal overlay system (`FastDrawerShell`, `FastModalShell`, shared z-index/scroll-lock/escape/reduced-motion); the base for `@components/Sheet` (D-09).
- `src/Routing/AppShellNavigationContext.tsx`, `src/Routing/PageActionsContext.tsx` — shell nav + page-actions contexts the extracted pieces depend on.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `FastOverlay` (`@components/FastOverlay`): portal-based overlay with z-index stacking, body-scroll-lock, escape-close, reduced-motion. Already exposes `FastDrawerShell` (used by `SidebarDrawer`) and `FastModalShell`. `Sheet` extends this with a bottom-placement variant (D-09).
- Existing Playwright e2e specs (navigation, dashboard, dish suggester, shopping list, global search) — the baseline for the before/after identity proof (D-07).
- Existing `data-testid` hooks throughout the shell — the e2e contract to preserve verbatim (D-08).

### Established Patterns
- Shell chrome lives in `src/Routing/`; the proposed `src/Routing/Shell/` sub-dir follows that grouping.
- Shared UI components live in `src/Components/<Name>/` with an `index.ts` barrel, imported via `@components/<Name>` — the `Sheet` layout.
- React error boundaries require a class component (`getDerivedStateFromError`/`componentDidCatch`) — the rest of the app is function components; this is the documented exception.

### Integration Points
- Error boundary wraps `<RootRouter />` in `src/App.tsx`, inside `ConfigProvider` so the fallback has antd theme/locale.
- Extracted `Shell/*` components re-import from `MasterPage`'s current dependencies: `AppShellNavigationContext`, `PageActionsContext`, `@store/Selectors`, `@hooks`, module screens (`DishSuggesterScreen`, `GlobalSearchScreen`, `CookingSessionWidget`, `ScheduledMealToolkitWidget`), and `RootRoutes`.
- `MasterPage.tsx` collapses to a composition root rendering Header + `Outlet` + extracted `<BottomTabNavigator/>`, `<CookingPill/>`, search overlay, and the drawer.

</code_context>

<specifics>
## Specific Ideas

- Roadmap's framing repeated as a hard guardrail: **"separate pure move, verified identical, from any behavior change."** The extraction PR/diff should read as a move, not a rewrite.
- The `SidebarDrawer`'s embedded "Dữ liệu & sao lưu" backup-center modal is the in-shell data-backup surface FND-02 refers to (distinct from the standalone `DataBackup` export — see D-06).
- Fallback copy register should match the app's warm Vietnamese voice ("nhà mình" / "nhé"), consistent with the Phase 1 `AppCopy` tone references.

</specifics>

<deferred>
## Deferred Ideas

- Splitting `SidebarDrawer` internals (backup center, admin publish, inventory config, PIN) into discrete components — possible follow-up; not this phase (D-05 moves it intact).
- Migrating existing pickers/confirmations onto `@components/Sheet` — Phase 5 (MOB-03).
- Fixing "reload-as-recovery after sync" to rehydrate in place instead of full reload — tracked in CONCERNS.md; out of scope here.
- Security hardening of baked GitHub token / admin PIN and plaintext PAT storage — CONCERNS.md; not this phase.
- Removing/replacing the hardcoded `raw.githubusercontent.com/quantran-epi/my-recipes` import URL in `DataBackup` — flag during D-06 grep; address separately.
- Shell copy migration to `AppCopy` — Phase 5 (COPY-03).

</deferred>

---

*Phase: 2-Shell Safety & Extraction*
*Context gathered: 2026-06-14*
