# Phase 9: iOS Visual Baseline & Safe-Area Shell - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-30
**Phase:** 9-iOS Visual Baseline & Safe-Area Shell
**Areas discussed:** Token baseline format & location, Safe-area shell strategy, ≥44px thumb-zone enforcement

> **Mode note:** User invoked `/gsd:discuss-phase 9` with the instruction "just do what you recommended, don't need to ask me." All gray areas were auto-decided by Claude from scouted codebase evidence rather than interactive selection. The tables below record the options Claude weighed and the call made.

---

## Token baseline format & location

| Option | Description | Selected |
|--------|-------------|----------|
| Typed TS constants module | Plain TS object of values/CSS fragments, consumed by inline-style call sites; core scalars fed into AntD ConfigProvider | ✓ |
| CSS custom properties (`:root` variables) | A `--token` CSS-variable layer in a global stylesheet | |
| CSS Modules / styled tokens | New styling system parallel to the existing inline-style approach | |

**Claude's call:** Typed TS constants module (single source of truth; core scalars also flow into `App.tsx` ConfigProvider).
**Notes:** Codebase styles via inline `React.CSSProperties` everywhere (FastOverlay, BottomTabNavigator, Content, SheetPicker) — no CSS modules exist. A TS object is directly consumable with zero new tooling; a CSS-var layer would be a second source of truth nothing currently reads. Promote Phase 7/8 magic numbers into named tokens rather than inventing a new visual language.

---

## Safe-area shell strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Token-driven `dvh` + `env()` insets across shell | Replace hardcoded height math in Content.tsx, fix CookingPill inset, single safe-area convention routed through all sticky chrome | ✓ |
| Per-file `env()` patches | Add insets ad-hoc where clipping is observed, keep existing magic numbers | |
| Wrapper safe-area container only | One outer padding wrapper, leave inner fixed elements as-is | |

**Claude's call:** Token-driven `dvh` + `env(safe-area-inset-*)` across the shell, with a single safe-area helper/convention.
**Notes:** `viewport-fit=cover` already shipped in Phase 7. Gaps found: `Content.tsx` uses hardcoded `HEADER_HEIGHT=76`/`BOTTOM_NAV_HEIGHT=80` + mixed `vh`/`dvh`; `CookingPill.tsx` is `bottom:76` with NO inset (rides into home indicator). `BottomTabNavigator.tsx:37` already does it right — use as the reference implementation.

---

## ≥44px thumb-zone enforcement

| Option | Description | Selected |
|--------|-------------|----------|
| Verification + token-application pass on Phase 7-9 layer | Pin 44px as a token, apply to SheetPicker trigger/row + nav buttons, assert via test; defer feature screens to Phases 10-11 | ✓ |
| App-wide retro-sweep of all tap targets now | Audit and resize every control across all feature screens in this phase | |
| Defer entirely to conversion phases | No 44px work until Phases 10-11 | |

**Claude's call:** Verification + token-application pass scoped to the shared picker layer + shell chrome built/owned in Phases 7-9.
**Notes:** Phase 8 already built rows "to the ≥44px bar pending Phase 9." This phase tokenizes the bar (`touchTarget.min = 44`), applies it, and adds an assertion. A full app-wide sweep would be scope creep into the Phase 10/11 conversion work, where per-screen tap targets are audited as those screens convert.

## Claude's Discretion

- Exact token *values* (spacing/radius/type ramps, comfortable row height above 44px, named-token vocabulary) — anchor to iOS HIG and Phase 7/8 shipped values; UI-SPEC will lock the concrete ramp.
- Module/alias naming (`src/Theme/` vs `src/Tokens/`, `@theme` vs `@tokens`).
- Whether the safe-area helper is a function vs string constants.
- Whether `App.css`/`ErrorBoundary` `100vh` get upgraded to `dvh`+inset (low-risk consistency).

## Deferred Ideas

- Per-screen iOS visual polish (Home, wizard, shopping, scheduled-meal, dishes, ingredient) — Phases 10-11 conversions.
- App-wide tap-target retro-sweep of feature-screen controls — audited per-screen during conversion (Phases 10-11).
- Full iOS system-aesthetic reskin (system fonts, segmented controls, inset-grouped tables) — out of v1.1.
- Haptics & spring-motion transitions — deferred milestone (MOTION-01/02).
