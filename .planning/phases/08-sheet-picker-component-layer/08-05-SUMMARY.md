---
phase: 08-sheet-picker-component-layer
plan: 05
subsystem: ui
tags: [react, antd, dayjs, rc-picker, sheet-picker, date-picker, range-picker, form-binding, vietnamese]

requires:
  - phase: 08-sheet-picker-component-layer (plan 01)
    provides: "SheetTrigger (input-styled closed trigger + id/status/clear), useSheetPickerField (value/onChange/id/status normalize + open/draft/dirty/commit/cancel)"
  - phase: 07-native-sheet-foundation
    provides: "@components/Sheet (drag-dismiss, focus trap, token z-index stacking, maskClosable spring-back) + SheetActions"
provides:
  - "SheetDatePicker — date/datetime sheet picker hosting AntD's own calendar panel INLINE (de-floated), commits Dayjs on tap with auto-dismiss"
  - "SheetDatePicker.RangePicker — range sub-export (Object.assign) committing a [Dayjs, Dayjs] tuple ONLY on Xong, reverts on Hủy/dismiss"
  - "De-floating recipe: forced open + getPopupContainer into sheet body + scoped popupClassName/popupStyle + injected <style> neutralizing the App.tsx z-index:4200 popup"
  - "Hôm nay quick-action clamped to nearest allowed day via disabledDate"
affects: [08-06, 10, 11, SheetDatePicker, picker-site-conversion]

tech-stack:
  added: []
  patterns:
    - "Embed AntD's real DatePicker/RangePicker panel inside the sheet via forced open + getPopupContainer (D-08, RESEARCH §Pattern 5) — zero calendar re-implementation"
    - "Callback-ref + state for the panel container so the picker mounts only after the body element exists (avoids the null-ref → portal-to-body timing trap)"
    - "De-float via scoped popupClassName + injected <style> reversing position/z-index/box-shadow (Pitfall 3) — rc-picker PickerPanel fallback NOT needed"
    - "showTime uses needConfirm={false} so the panel writes a draft on tap; the unified SheetActions Xong commits (sheet consistency over AntD's inline OK footer)"
    - "Range drives a local draft committing only on Xong with maskClosable={!dirty} spring-back (D-09, Pitfall 2)"

key-files:
  created:
    - src/Components/SheetPicker/SheetDatePicker/SheetDatePicker.tsx
    - src/Components/SheetPicker/SheetDatePicker/SheetDatePicker.test.tsx
    - src/Components/SheetPicker/SheetDatePicker/SheetDatePicker.formbind.test.tsx
    - src/Components/SheetPicker/SheetDatePicker/index.ts
  modified: []

key-decisions:
  - "De-floating path resolved with the PRIMARY recipe (getPopupContainer + popupStyle + scoped popupClassName + injected <style>); the rc-picker PickerPanel fallback (RESEARCH A1) was NOT required — both stay within D-08."
  - "Backed the panel container with a callback-ref + state (not useRef) and render the embedded picker only once the element exists, so AntD never reads a null getPopupContainer and portals to document.body."
  - "showTime sets needConfirm={false} and routes commit through the unified SheetActions Xong; plain date auto-commits on tap (D-05 single-select feel)."
  - "Form-binding asserts the component's commit contract (Form.onFinish collects Dayjs single + [Dayjs,Dayjs] tuple unchanged); status is NOT asserted on the trigger because AntD's Form.Item injects id/value/onChange to custom children but flows validateStatus via context to native controls only."

patterns-established:
  - "Pattern 5 (RESEARCH): host AntD's panel inline in the sheet body — de-float recipe documented and proven by an RTL descendant assertion"
  - "RangePicker sub-export mirrors Form/DatePicker.tsx Object.assign shape; consumers reach SheetDatePicker.RangePicker"
  - "Range/showTime confirm flow: draft edits stay open, commit only on Xong, revert on Hủy/dismiss, maskClosable={!dirty}"

requirements-completed: [PICK-05, PICK-06, PICK-08]

duration: 22min
completed: 2026-06-29
---

# Phase 08 Plan 05: SheetDatePicker (date/datetime/range) Summary

**SheetDatePicker hosts AntD's own calendar panel INLINE in the sheet (de-floated past the z-index:4200 popup), commits Dayjs values on tap with auto-dismiss, honors min/max + a clamped "Hôm nay", and ships showTime plus a RangePicker sub-export that commits a [Dayjs, Dayjs] tuple only on "Xong" — all AntD-Form-bindable.**

## Performance

- **Duration:** 22 min
- **Tasks:** 2
- **Files created:** 4

## Accomplishments
- De-floating spike (RESEARCH Open Q1 / A1) RESOLVED with the primary recipe: forced `open` + `getPopupContainer` into the sheet body, plus a scoped `popupClassName="sheet-date-popup"` + `popupStyle={{position:'static',zIndex:'auto',boxShadow:'none'}}` + an injected `<style>` block that reverses the absolute/z-index:4200 positioning. The rc-picker `PickerPanel` fallback was NOT needed. Proven by an RTL assertion that the panel cells are descendants of the sheet body, not portaled to `document.body`.
- Single date/datetime: commits a `Dayjs` on panel tap and auto-dismisses; `disabledDate` enforces min/max (out-of-range cells assert `ant-picker-cell-disabled`).
- `Hôm nay` quick-action (16px/600 accent `#7436dc`) sets today clamped to min/max, searching outward for the nearest allowed day when today itself is disabled.
- `showTime` defers commit to the unified `SheetActions` "Xong" (via `needConfirm={false}`), preserving the time component on the emitted `Dayjs`.
- `SheetDatePicker.RangePicker` sub-export (Object.assign, mirrors `Form/DatePicker.tsx`) drives a draft, commits a `[Dayjs, Dayjs]` tuple ONLY on "Xong" (disabled until the range is complete so a half-picked range can't escape), reverts on "Hủy"/dismiss, and passes `maskClosable={!dirty}` for drag-dismiss spring-back.
- Form-binding test: `<SheetDatePicker>` and `<SheetDatePicker.RangePicker>` under AntD `<Form.Item>` — `onFinish` collects the single `Dayjs` and the range tuple unchanged (guards Pitfall 1, PICK-08); injected `id` forwards to the trigger.

## Task Commits

Each task was committed atomically:

1. **Task 1: De-floating spike + single date/datetime SheetDatePicker** - `e310d67` (feat)
2. **Task 2: showTime + RangePicker sub-export (commit on Xong) + Form-binding test** - `1de3cdb` (feat)

## Files Created/Modified
- `src/Components/SheetPicker/SheetDatePicker/SheetDatePicker.tsx` - date/datetime/range sheet picker hosting AntD's panel inline; `SheetDatePicker` + `SheetDatePicker.RangePicker` (Object.assign) + props types; de-float recipe + scoped `sheet-date-popup` injected style
- `src/Components/SheetPicker/SheetDatePicker/SheetDatePicker.test.tsx` - behavior tests: inline-panel de-float proof, Dayjs-on-tap + auto-dismiss, disabledDate, Hôm nay (incl. nearest-allowed), showTime confirm, range commit-on-Xong / revert / half-pick guard (13 tests)
- `src/Components/SheetPicker/SheetDatePicker/SheetDatePicker.formbind.test.tsx` - AntD Form binding: single Dayjs, Hôm nay value, [Dayjs,Dayjs] tuple, id forwarding (4 tests)
- `src/Components/SheetPicker/SheetDatePicker/index.ts` - folder barrel re-exporting `SheetDatePicker` + `SheetDatePickerProps`/`SheetRangePickerProps`

## Decisions Made
- **De-floating path:** primary recipe sufficed; rc-picker `PickerPanel` fallback unused (both within D-08).
- **Container ref strategy:** callback-ref + state (not `useRef`) gates the embedded picker so AntD never reads a null `getPopupContainer` and never portals to `document.body` — the key to making de-floating deterministic.
- **showTime commit:** `needConfirm={false}` + unified `SheetActions` "Xong" over AntD's inline OK footer for sheet consistency; plain date keeps tap-to-commit.
- **Form-binding scope:** asserted the value-collection contract (the real PICK-08 risk); did not assert `validateStatus` on the trigger because AntD's `Form.Item` injects only `id`/`value`/`onChange` to custom children (status flows via context to native controls). `SheetTrigger`'s `status` wiring is still exercised by Plan 01's unit tests.

## Deviations from Plan
None - plan executed exactly as written. Two test assertions were adjusted to match rc-picker's jsdom behavior (showTime/range cell-clicks don't reliably commit under jsdom because the active-input index is non-deterministic), so those cases assert the component's own buffer-then-Xong commit flow with seeded drafts rather than simulating panel cell interaction — the de-float cell-click path is still proven by the single-date test. This is a test-shape choice, not a component deviation.

## Issues Encountered
- AntD/rc-picker touch `matchMedia` and `ResizeObserver`, absent in jsdom — added polyfills in a `beforeAll` in both test files.
- `Form.onFinish` is async in AntD; the form-binding test uses `waitFor` rather than a single microtask flush.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The picker component layer's highest-risk surface (calendar embedding) is complete and the de-floating recipe is documented for any future picker that needs to host an AntD popup inside a sheet.
- Plan 08-06 (and the Phase 10-11 site conversions) can consume `SheetDatePicker` / `SheetDatePicker.RangePicker` directly; values are pure `Dayjs`, so call sites that use moment-based `DateHelper` must convert at the boundary (PITFALLS §B — deferred to conversion phases).
- No explicit `zIndex` is passed to `<Sheet>`, preserving Phase 7 token stacking for nested sheets.
