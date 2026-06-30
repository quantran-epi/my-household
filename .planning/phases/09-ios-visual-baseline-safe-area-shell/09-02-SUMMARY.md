---
phase: 09-ios-visual-baseline-safe-area-shell
plan: 02
subsystem: sheet-picker
tags: [tokens, ios, touch-target, antd-config, sheet, verification]
dependency_graph:
  requires:
    - "iosTokens (src/Theme/iosTokens.ts) — from Plan 09-01"
    - "@theme alias barrel (src/Theme/index.ts) — from Plan 09-01"
  provides:
    - "App.tsx ConfigProvider theme.token fed from iosTokens (D-04)"
    - "FastOverlay sheet/drawer chrome reads iosTokens.surface/radius/motion (D-02)"
    - "SheetTrigger + SheetSelect rows read iosTokens.touchTarget.min/radius/type/color"
    - "44px touch-target bar pinned in jsdom (SheetTrigger.test) + WebKit e2e (sheet-picker.spec)"
  affects:
    - "Plan 09-03 (shares the token module + safe-area shell work)"
tech_stack:
  added: []
  patterns:
    - "AntD ConfigProvider scalar slots fed from the single @theme token module (no CSS-variable layer, D-01)"
    - "Promote-what-exists: literals swapped to token reads with values held identical (no normalization, Pitfall 4)"
    - "Touch-target bar asserted as both a jsdom style read (44px) and a real WebKit boundingBox height (>=44)"
key_files:
  created: []
  modified:
    - src/App.tsx
    - src/Components/FastOverlay/FastOverlay.tsx
    - src/Components/SheetPicker/shared/SheetTrigger.tsx
    - src/Components/SheetPicker/SheetSelect/SheetSelect.tsx
    - src/Components/SheetPicker/shared/SheetTrigger.test.tsx
    - tests/e2e/sheet-picker.spec.ts
decisions:
  - "App.tsx borderRadius added as iosTokens.radius.md (10) per D-04 discretion (RESEARCH A2/Open-Q2) to align AntD inputs/popups with the trigger/control family"
  - "SheetTrigger/SheetSelect control type triple (fontSize/fontWeight/lineHeight) spread from iosTokens.type.control rather than set field-by-field — single source, value-identical"
  - "PURPLE/BORDER_IDLE/ERROR consts in SheetTrigger retained as named aliases but now initialized from iosTokens.color.* (minimal diff, preserves the focus/error-ring logic that references them)"
metrics:
  duration: "~10m"
  completed: 2026-06-30
---

# Phase 9 Plan 02: Wire Token Module into ConfigProvider & Sheet-Picker Layer Summary

Wired the Wave 1 `@theme` token module into the AntD `ConfigProvider` (D-04) and the Phase 7/8 sheet + sheet-picker chrome (D-02), and pinned the already-met 44px thumb-zone bar as a token across the picker trigger and sheet rows with jsdom + WebKit/iPhone assertions (IOS-01, IOS-03). This is a promotion + verification pass — no new components and no new visual language; every promoted value stays byte-identical to its shipped literal.

## What Was Built

- **`src/App.tsx`** — imports `iosTokens` from `@theme`; the `ConfigProvider` `theme.token` block now reads `colorPrimary`, `colorPrimaryHover`, `colorPrimaryActive`, `colorLink` (→ `color.primary`), `colorBorderSecondary` (→ `color.borderIdle`), `fontFamily` (→ `type.fontFamily`), and `fontSize` (→ `type.body.fontSize`, 18) from tokens, plus a new `borderRadius: iosTokens.radius.md` (10, D-04 discretion). `locale={viVN}`, `zIndexPopupBase: 4000`, and the entire per-component `zIndexPopup: 4200` block are untouched (Phase 11 owns that cleanup). No CSS-variable layer (D-01).
- **`src/Components/FastOverlay/FastOverlay.tsx`** — `overlayMotionEase` reads `iosTokens.motion.ease`; the sheet (line ~587) and drawer (line ~331) gradients read `iosTokens.surface.sheetGradient`; the sheet `18px 18px 0 0` and drawer `0 18px 18px 0` radii are built from `iosTokens.radius.xl` template strings; `closeButtonStyle.borderRadius` reads `iosTokens.radius.md` (10). The `<style>` blocks and reduced-motion clamp are preserved verbatim.
- **`src/Components/SheetPicker/shared/SheetTrigger.tsx`** — `minHeight` reads `iosTokens.touchTarget.min` (44, IOS-03), `borderRadius` reads `iosTokens.radius.sm` (6), the control type triple is spread from `iosTokens.type.control`, and `PURPLE`/`BORDER_IDLE`/`ERROR` are initialized from `iosTokens.color.*`. `padding: '0 11px'` kept verbatim (AntD-input parity exception).
- **`src/Components/SheetPicker/SheetSelect/SheetSelect.tsx`** — `rowBaseStyle.minHeight` reads `iosTokens.touchTarget.min`, the control type triple spread from `iosTokens.type.control`. `padding: '11px 16px'` kept verbatim. (The `PURPLE`/`MUTED`/`CLEAR_LABEL` row-state consts are local label/highlight colors outside the plan's promotion scope and were left as-is.)
- **`src/Components/SheetPicker/shared/SheetTrigger.test.tsx`** — two new assertions: `btn.style.minHeight === '44px'` and `btn.style.borderRadius === '6px'`, both read from the live token (mirrors the SheetActionMenu min-height idiom).
- **`tests/e2e/sheet-picker.spec.ts`** — new `mobile-safari` test that opens the SheetSelect picker and asserts the trigger and a sheet option row each render with `boundingBox().height >= 44` on a real WebKit/iPhone 13 descriptor (D-08/D-09 scope: shared picker layer only).

## Tasks Completed

| Task | Name | Commit |
| ---- | ---- | ------ |
| 1 | Feed AntD ConfigProvider scalars from @theme (D-04) | 0cd9118 |
| 2 | Promote sheet-picker + FastOverlay literals to tokens; pin the 44px bar (IOS-01/IOS-03) | e2baee1 |
| 3 | Extend mobile-safari e2e to assert >=44px rendered touch targets (IOS-03) | bf25772 |

## Verification

- `CI=true npx react-scripts test src/App --watchAll=false` — App suite passed (1/1). The `act(...)` console warnings are pre-existing noise from `useGistBackup` (unrelated to this change).
- `CI=true npx react-scripts test src/Components/SheetPicker src/Components/FastOverlay --watchAll=false` — 11 suites / 91 tests passed, including the two new SheetTrigger token assertions.
- `npx tsc --noEmit` — no type errors in any modified file (`App.tsx`, `FastOverlay.tsx`, `SheetTrigger.tsx`, `SheetSelect.tsx`) and none in `sheet-picker.spec.ts`.
- `npx playwright test tests/e2e/sheet-picker.spec.ts --project=mobile-safari --list` — all 4 tests (incl. the new IOS-03 touch-target test) discovered and type-check clean.

## Deviations from Plan

None - plan executed exactly as written.

Note (same as Plan 01): the plan's `<read_first>`/`<context>` referenced `09-PATTERNS.md` for the App.tsx slot→token mapping; that file does not exist in the phase directory. The exact slot→token mapping was instead taken directly from the plan's Task 1 `<action>` (which enumerates every slot) and confirmed against the live `App.tsx` literals and `src/Theme/iosTokens.ts`. No mapping ambiguity resulted.

## Manual-Run Fallback (e2e)

The `mobile-safari` e2e could not be executed end-to-end in this environment: `npx playwright test ... --project=mobile-safari` failed at `config.webServer` startup (the dev server exited with code 1 in the sandbox), not at test authoring. Per the plan, the test is authored and verified via `--list` + tsc. To run it manually:

```
npx playwright test tests/e2e/sheet-picker.spec.ts --project=mobile-safari
```

If the WebKit binary is absent first run `npx playwright install webkit`.

## Threat Flags

None — this plan changes only client-side inline-style token wiring and adds test assertions. No auth, network, storage, input-handling, or crypto surface touched (matches plan threat_model: T-09-02 accepted, zero new dependencies). ASVS L1 V2/V3/V4/V5/V6 all non-applicable.

## Self-Check: PASSED

All six modified files present on disk; all three task commits (0cd9118, e2baee1, bf25772) found in git log.
