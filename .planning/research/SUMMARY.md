# Project Research Summary

**Project:** my-household
**Domain:** Native-iOS-feel sheet-picker conversion + hands-on UI polish for an existing local-first meal-planning PWA (React 18 + RTK + Ant Design 5)
**Researched:** 2026-06-19
**Confidence:** HIGH (codebase-verified against the existing Sheet/FastOverlay/Select/DatePicker/SmartForm sources)

## Executive Summary

v1.1 converts every dropdown/combobox/datepicker (~80 `<Select`, ~23 `<DatePicker`, ~15 `<Dropdown` tags) into native-feel bottom-sheet pickers, built as a reusable layer (SheetSelect / SheetMultiSelect / SheetDatePicker / SheetActionMenu) on the existing `@components/Sheet`. The single most important finding: **add zero runtime dependencies.** The v1.0 `FastOverlay` Sheet already provides portal, backdrop, z-index stacking, body-scroll-lock, and escape-close; the missing native bits — grabber, drag-to-dismiss, snap, safe-area — are achievable with React pointer events + CSS `env()`. The work is a disciplined, tested, screen-by-screen migration, not a re-platform.

## Recommended Stack

- **No new runtime deps.** React pointer events (`onPointerDown/Move/Up` + `setPointerCapture`) for drag; CSS `env(safe-area-inset-*)` + `100dvh` for iOS layout.
- **Dates stay Dayjs.** AntD 5 DatePicker is dayjs-native; `SheetDatePicker` must emit `Dayjs`. Do NOT add a date-wheel library and do NOT migrate `moment`→`dayjs` this milestone (DateHelper stays moment; convert at the boundary).
- **Reject `vaul`/`react-spring-bottom-sheet`** — they duplicate the FastOverlay portal + z-index work.
- `@use-gesture/react` exists as a fallback only if inertia physics is ever needed (it isn't for tap-pickers).

## Feature Priorities (table stakes first)

- **Single-select:** tap row → check → auto-dismiss; preserve `showSearch`; highlight current; ≥44px rows.
- **Multi-select:** checkbox rows, sheet stays open, commit on "Xong", count in header, Cancel reverts.
- **Date:** AntD inline calendar in the sheet, Dayjs value, min/max preserved, "Hôm nay" shortcut.
- **Action menu:** full-width action rows, destructive red, Cancel as a separate button, optional icons.
- **Cross-cutting (the "native" signals):** grabber handle, drag-down-to-dismiss, safe-area bottom padding, sticky Cancel/Done header.
- **Skip:** haptics, spring physics, system-font/segmented-control reskin, mandatory multi-detent snap.

## Architecture Approach

- New layer in `src/Components/SheetPicker/` (barrel via `@components/SheetPicker`), built on the extended Sheet base.
- **Drop-in `value`/`onChange` contract** so each picker binds to AntD `Form.Item` with no `SmartForm` change (SmartFormItem is a verified thin pass-through). Accept injected `id`/`status` too.
- **Drag/snap state is local to the Sheet base**, not Redux; release-past-threshold calls the existing `onClose`.
- **iOS tokens:** thin CSS-variable layer + targeted `ConfigProvider` token extension (radius/control-height≥44/type) — not a full theme rewrite. Safe-area applied at shell + per-sheet; needs `viewport-fit=cover`.
- **Build order:** (1) extend Sheet base → (2) picker layer → (3) tokens + safe-area shell → (4) migrate high-traffic screens whole → (5) long tail → (6) remove old AntD wrapper + z-index hacks.

## Critical Pitfalls

1. **Form-binding & value-type regressions** — `strict:false`/`es5` won't catch them; DatePicker must stay Dayjs while DateHelper is moment. Test Form-submit + value-type per picker BEFORE migrating.
2. **Scroll-vs-drag on iOS Safari** — only drag the sheet when its scroll is at top; `overscroll-behavior: contain`; `100dvh` not `100vh`. Get this native-feeling in the Foundation phase.
3. **Big-bang over ~118 sites in 1,300–2,000-line files** — grep inventory + whole-screen atomic conversion + per-screen e2e; "no capability loss" (search/multiple/tags/range/clear) is a hard gate.
4. **Mixed old/new stacking** — converting only some pickers on a screen leaves AntD popups (z-index 4200) floating over sheets; convert whole screens.

## Watch Out For (quick reference)

- DatePicker value type (Dayjs vs moment) at every date site.
- `mode="multiple"`/`"tags"`, `showSearch`, `allowClear`, `OptGroup`, `RangePicker` — preserve or explicitly defer.
- iOS keyboard shoving a `position:fixed` sheet when the search field focuses.
- Nested sheet (picker opened inside a sheet) — rely on existing z-index tokens, add a nested e2e.
- `viewport-fit=cover` meta must exist for `env()` safe-area to work.

## Suggested Phase Shape (input to roadmap)

1. **Sheet base upgrade** — grabber, drag-to-dismiss, scroll/drag disambiguation, safe-area, snap (optional). Tested, no call-site changes.
2. **Picker layer** — SheetSelect / MultiSelect / DatePicker / ActionMenu + shared primitives, Form-binding tests.
3. **iOS tokens + safe-area shell** — token layer, `viewport-fit=cover`, ConfigProvider tokens, applied once.
4. **High-traffic migration** — wizard, Home, ScheduledMeal, ShoppingList (whole screens).
5. **Long-tail migration** — Dishes, Ingredient, DishSuggester, admin/backup/settings; RangePicker last.
6. **Cleanup + visual polish pass** — remove old wrappers/z-index hacks, final hands-on/visual tuning.

## Sources

- `src/Components/FastOverlay/FastOverlay.tsx`, `Sheet/`, `Form/Select/Select.tsx`, `Form/DatePicker/DatePicker.tsx`, `SmartForm/SmartFormItem/*` — read directly (HIGH)
- `src/Common/Helpers/DateHelper.ts` — moment usage (HIGH)
- `package.json`, `tsconfig.json` — versions, es5/strict:false (HIGH)
- `.planning/codebase/CONCERNS.md`, `ARCHITECTURE.md`, `CONVENTIONS.md` — existing tech debt + conventions (HIGH)
- Apple HIG (sheets/pickers/action sheets); iOS Safari web-platform behavior (`dvh`, `env()`, `visualViewport`, `overscroll-behavior`)
- `/pmndrs/use-gesture` (Context7) — fallback library, not recommended now

---
*Research summary for: native iOS sheet-picker conversion (v1.1)*
*Researched: 2026-06-19*
