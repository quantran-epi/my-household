# Phase 2: Shell Safety & Extraction - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-14
**Phase:** 2-Shell Safety & Extraction
**Areas discussed:** Error boundary UX & placement, Extraction granularity, "Verified identical" proof, Sheet wrapper: base & API

---

## Error boundary placement

| Option | Description | Selected |
|--------|-------------|----------|
| Top-level around RootRouter | Wrap the whole router so a shell-chrome crash (header/nav/pill) is caught too, not just route content | ✓ |
| Route-content only | Wrap only the `<Outlet />` content; shell chrome stays outside the boundary | |
| Per-screen boundaries | Multiple boundaries scoped to individual screens | |

**User's choice:** Top-level around RootRouter
**Notes:** FND-01 says "prevent a shell crash from white-screening the whole app" — a shell-chrome crash is explicitly in scope, so the boundary must sit above the shell, not just around route content. Mounts in `src/App.tsx` (or wrapping `RootRouter`), outside `MasterPage`.

---

## Error-boundary fallback recovery

| Option | Description | Selected |
|--------|-------------|----------|
| Reload button | Fallback UI offers a "reload the app" affordance (`window.location.reload()`) | ✓ |
| Auto-reload | Automatically reload on crash with no user action | |
| Reset-in-place | Attempt to reset boundary state without a full reload | |

**User's choice:** Reload button
**Notes:** Reload is already the app's established recovery idiom (post-sync / SW-update reloads in `useGistBackup.ts`, `MasterPage.tsx`, `serviceWorkerRegistration.ts`). A user-triggered reload button is consistent with that, avoids auto-reload crash loops, and keeps the fallback simple.

---

## Decomposition granularity

| Option | Description | Selected |
|--------|-------------|----------|
| File-per-component move | Move existing components (`BottomTabNavigator`, `CookingPill`, `SidebarDrawer`, `DataBackup`) into `src/Routing/Shell/` files as-is, no internal refactor | ✓ |
| Deep decompose SidebarDrawer | Also split the ~500-line `SidebarDrawer` (nav + backup center + admin publish + inventory config + PIN) into sub-components | |
| Logic + view split | Extract hooks/logic from view during the move | |

**User's choice:** File-per-component move
**Notes:** Keeps this phase a "pure move, verified identical." `SidebarDrawer` moves intact despite its size — deeper decomposition is behavior-risky and belongs to a later phase if needed. Honors the roadmap's "separate pure move from behavior change" discipline.

---

## "Verified identical" proof

| Option | Description | Selected |
|--------|-------------|----------|
| Playwright e2e before/after | Capture/extend e2e specs covering pill, nav, drawer, search, backup; run green before and after the move | ✓ |
| Manual checklist | Hand-verify each surface against a written checklist | |
| Snapshot/unit tests | Component snapshot or render tests | |

**User's choice:** Playwright e2e before/after
**Notes:** e2e harness already exists (`tests/e2e/*.spec.ts`) and covers nav/search. Existing `data-testid`s on shell surfaces (`bottom-tab-*`, `sidebar-drawer*`, `active-cooking-floating-button`, `global-search-button`) make this tractable. Coverage gap: backup center and cooking-pill flows are not yet e2e-covered (CONCERNS.md) — specs to be added before the move so "before" is a real baseline.

---

## Sheet wrapper base & API

| Option | Description | Selected |
|--------|-------------|----------|
| Extend FastOverlay | Build `@components/Sheet` on the existing hand-rolled `FastDrawerShell` portal system | ✓ |
| antd Drawer placement="bottom" | Build literally on antd `Drawer` as the roadmap text states | |

**User's choice:** Extend FastOverlay
**Notes:** Diverges from the literal roadmap/requirements wording (FND-02 success criterion 4 and MOB-03 say antd `Drawer placement="bottom"`). Chosen for shell consistency: the shell already standardizes on `FastOverlay` for shared z-index stacking and reduced-motion handling; introducing antd Drawer alongside it would create two overlay systems. Recorded explicitly so Phase 5 does NOT treat this as a deviation to "fix."

| Option | Description | Selected |
|--------|-------------|----------|
| Wrapper only, no migration | Ship the `Sheet` wrapper this phase; do not migrate existing pickers/confirmations to it | ✓ |
| Wrapper + migrate shell usages | Also convert current modals/drawers to `Sheet` now | |

**User's choice:** Wrapper only, no migration
**Notes:** Keeps phase scope to "the wrapper is available." Actual bottom-sheet adoption for pickers/confirmations is Phase 5 (MOB-03).

## Claude's Discretion

- Exact file names/structure under `src/Routing/Shell/` (one file per extracted component vs. an `index.ts` barrel).
- Error boundary component location and naming (`src/Components/ErrorBoundary/` vs. inline in `App.tsx`), fallback copy wording (authored via `AppCopy` where practical).
- The precise `Sheet` prop surface, as long as it wraps a bottom-placement overlay and reuses `FastOverlay` plumbing.
- Whether the unused exported `DataBackup` component is moved with the others or left/cleaned — implementer's call during the move.

## Deferred Ideas

- Deep decomposition of `SidebarDrawer` (nav vs. backup-center vs. admin publish vs. inventory config) — future refactor, not this phase.
- Migrating existing pickers/confirmations to the bottom-sheet pattern — Phase 5 (MOB-03).
- Replacing reload-as-recovery with in-place rehydration — known concern (CONCERNS.md), out of scope here.
