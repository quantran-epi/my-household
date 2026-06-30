---
phase: 09-ios-visual-baseline-safe-area-shell
plan: 01
subsystem: theme
tags: [tokens, ios, safe-area, build-config, foundation]
dependency_graph:
  requires: []
  provides:
    - "iosTokens (src/Theme/iosTokens.ts) — typed `as const` token object"
    - "safeAreaInset (src/Theme/safeArea.ts) — bottom(base)/top(base) calc helpers"
    - "@theme alias barrel (src/Theme/index.ts)"
  affects:
    - "Plan 09-02 (reads iosTokens + safeAreaInset)"
    - "Plan 09-03 (reads iosTokens + safeAreaInset)"
tech_stack:
  added: []
  patterns:
    - "Single-file barrel alias registered in all three build configs (mirrors @hooks)"
    - "`as const` token object for type-safe inline-style consumption"
key_files:
  created:
    - src/Theme/iosTokens.ts
    - src/Theme/safeArea.ts
    - src/Theme/index.ts
    - src/Theme/iosTokens.test.ts
  modified:
    - tsconfig.json
    - craco.config.js
    - package.json
decisions:
  - "safeAreaInset is a function-shape helper (bottom(base)/top(base)) so callers pass a numeric base, per CONTEXT discretion"
  - "@theme registered as single-file barrel (mirrors @hooks), not a wildcard alias, since the barrel is one file"
  - "Zero runtime dependencies added — all tokens are compile-time constants"
metrics:
  duration: "~12m"
  completed: 2026-06-30
---

# Phase 9 Plan 01: iOS Visual Baseline & Safe-Area Tokens Summary

Centralized the duplicated Phase 7/8 visual literals into a single typed `iosTokens` constants module plus a `safeAreaInset` calc-string helper, exposed via an `@theme` barrel alias registered in tsconfig, craco, and jest. This is the Wave 1 foundation that Plans 02 and 03 read from.

## What Was Built

- **`src/Theme/iosTokens.ts`** — `export const iosTokens = { ... } as const` with eight lightweight categories: `spacing`, `radius`, `type`, `color`, `surface`, `motion`, `touchTarget`, `layout`. Every value is promoted verbatim from a shipped literal (App.tsx ConfigProvider, SheetTrigger base style, BottomTabNavigator dock/container, FastOverlay sheet gradient, Content app-body gradient). No normalization (Pitfall 4) and `as const` is mandatory under `strict: false` + `target: es5` (Pitfall 6).
- **`src/Theme/safeArea.ts`** — `safeAreaInset.bottom(base)` / `.top(base)` returning the `calc(${base}px + env(safe-area-inset-*))` shape. `bottom(8)` string-equals the working `BottomTabNavigator.tsx:37` reference (D-07).
- **`src/Theme/index.ts`** — barrel re-exporting `iosTokens` and `safeAreaInset`, mirroring `src/Components/Sheet/index.ts`.
- **`src/Theme/iosTokens.test.ts`** — 15 value-pinning assertions guarding every consumed token plus the `safeAreaInset` string equality.
- **`@theme` alias** registered in all three locations (Pitfall 5 — missing any one breaks type-check, dev/build, or tests respectively): tsconfig `paths`, craco `resolve.alias`, package.json jest `moduleNameMapper`.

## Tasks Completed

| Task | Name | Commit |
| ---- | ---- | ------ |
| 1 | Create iosTokens module + safeArea helper + barrel | 645b5aa |
| 2 | Author token-shape + exact-value test | 874d476 |
| 3 | Register @theme alias in all three configs | be5bb4c |

## Verification

- `CI=true npx react-scripts test src/Theme/iosTokens.test.ts --watchAll=false` — 15/15 passed.
- Node alias assertion — printed "OK all three".
- `npx tsc --noEmit` — 0 errors, none referencing `@theme` or `src/Theme/*`.

## Deviations from Plan

None - plan executed exactly as written.

Note: the plan's `<read_first>` referenced `09-PATTERNS.md` for the "Verbatim source literals to promote" table; that file does not exist in the phase directory. The authoritative values were sourced directly from `09-UI-SPEC.md` (Spacing/Radius/Typography/Color/Surface/Touch-Target tables) and confirmed against the live source literals in App.tsx, SheetTrigger.tsx, BottomTabNavigator.tsx, FastOverlay.tsx, and Content.tsx. No value ambiguity resulted.

## Threat Flags

None — this plan adds only compile-time TS constants and build-config aliases. No auth, network, storage, input-handling, or crypto surface touched (matches plan threat_model: T-09-01 and T-09-SC both accepted, zero new dependencies).
