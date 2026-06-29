---
phase: 08-sheet-picker-component-layer
plan: 01
subsystem: ui
tags: [react, antd, sheet-picker, form-binding, vietnamese, diacritics]

requires:
  - phase: 07-native-sheet-foundation
    provides: "@components/Sheet host (drag-dismiss, focus trap, z-index token stacking, maskClosable, SheetActions)"
provides:
  - "normalizeDiacritics — NFD-strip + explicit đ/Đ replace VN-insensitive normalize"
  - "optionLabel — value→label resolution (getSelectedOptionDisplays) + closed-trigger summary (getTriggerSummary, D-04)"
  - "useSheetPickerField — normalize injected value/onChange/id/status + open/draft/dirty/commit/cancel state machine"
  - "SheetTrigger — AntD-input-styled closed trigger forwarding id/aria-invalid + clear × (D-02/D-03/D-04)"
affects: [08-02, 08-03, 08-04, 08-05, 08-06, SheetSelect, SheetMultiSelect, SheetDatePicker, SheetActionMenu]

tech-stack:
  added: []
  patterns:
    - "Form.Item child-clone consumption via useSheetPickerField (PICK-08 mechanism, D-02)"
    - "Draft re-seeded from value on each open transition, never persisted across opens (RESEARCH §Pattern 3)"
    - "Dedicated input-styled trigger instead of a popup-suppressed live AntD control (D-03)"
    - "Diacritic-insensitive client filter via NFD + String.includes (ReDoS-safe, D-07)"

key-files:
  created:
    - src/Components/SheetPicker/shared/normalizeDiacritics.ts
    - src/Components/SheetPicker/shared/normalizeDiacritics.test.ts
    - src/Components/SheetPicker/shared/optionLabel.ts
    - src/Components/SheetPicker/shared/optionLabel.test.ts
    - src/Components/SheetPicker/shared/useSheetPickerField.ts
    - src/Components/SheetPicker/shared/SheetTrigger.tsx
    - src/Components/SheetPicker/shared/SheetTrigger.test.tsx
  modified: []

key-decisions:
  - "optionLabel.ts kept as a .ts module (per plan file list) — used React.createElement instead of JSX for the multi 'first +N' summary so the file needs no .tsx rename"
  - "getTriggerSummary falls back to 'N đã chọn' only when labels do not resolve (options empty/not loaded); otherwise renders 'first +N' per D-04"
  - "useSheetPickerField never computes or passes zIndex — Phase 7 token-stacks automatically (RESEARCH anti-pattern)"

patterns-established:
  - "Pattern 1: controlled Form-bound child — consume value/onChange/id/status, single root element"
  - "Pattern 3: draft seeded on open, dirty = !sameSet(draft, value), commit→onChange+close, cancel→close"
  - "D-03 dedicated trigger: input-box styling, id forwarded to button, aria-invalid on status==='error', clear × stops propagation"

requirements-completed: [PICK-02, PICK-08]

duration: 17min
completed: 2026-06-29
---

# Phase 8 Plan 01: Shared Sheet-Picker Primitives Summary

**Four shared primitives — diacritic-insensitive VN filter, value→label/summary resolver, the value/onChange/id/status + draft field hook, and the AntD-input-styled SheetTrigger — that the Wave 2-3 pickers compose on.**

## Performance

- **Duration:** 17 min
- **Tasks:** 2
- **Files created:** 7

## Accomplishments
- `normalizeDiacritics` strips NFD tone marks AND the non-decomposing đ/Đ so searching "do" matches "đỏ" and "ca" matches "cà chua" (PICK-02 foundation).
- `optionLabel` lifts the `Form/Select.tsx` label-resolution helpers near-verbatim and adds `getTriggerSummary` (D-04): single label, multi "first +N" / "N đã chọn" fallback, undefined when empty.
- `useSheetPickerField` normalizes the injected `value`/`onChange`/`id`/`status` and owns the `open`/`draft`/`dirty`/`commit`/`cancel` machine, re-seeding the draft on each open and never passing an explicit zIndex (PICK-08 foundation).
- `SheetTrigger` renders the closed trigger as an AntD input box, forwards the injected `id`, sets `aria-invalid` on `status==='error'`, and its clear × stops propagation so clearing does not open the sheet (D-02/D-03/D-04).

## Task Commits

Each task was committed atomically:

1. **Task 1: Diacritic filter + label/summary resolver utilities** - `9e5e718` (feat)
2. **Task 2: useSheetPickerField hook + SheetTrigger component** - `2896d48` (feat)

## Files Created/Modified
- `src/Components/SheetPicker/shared/normalizeDiacritics.ts` - NFD-strip + đ/Đ replace VN-insensitive normalize
- `src/Components/SheetPicker/shared/normalizeDiacritics.test.ts` - VN diacritic-match coverage incl. đ→d
- `src/Components/SheetPicker/shared/optionLabel.ts` - lifted label helpers + getTriggerSummary/getSelectedOptionDisplays (D-04)
- `src/Components/SheetPicker/shared/optionLabel.test.ts` - single/multi/empty summary coverage
- `src/Components/SheetPicker/shared/useSheetPickerField.ts` - injected-prop normalize + open/draft/dirty/commit/cancel
- `src/Components/SheetPicker/shared/SheetTrigger.tsx` - input-styled trigger forwarding id/aria-invalid + clear ×
- `src/Components/SheetPicker/shared/SheetTrigger.test.tsx` - id/status forwarding, clear-without-open, disabled, draft dirty/commit/cancel

## Decisions Made
- Kept `optionLabel.ts` as a `.ts` file per the plan's file list; the multi "first +N" summary uses `React.createElement(Fragment, ...)` rather than JSX so no `.tsx` rename is needed.
- `getTriggerSummary` only falls back to "N đã chọn" when labels do not resolve (options empty/not yet loaded); a resolved multi-selection renders "first +N" per D-04.
- `useSheetPickerField` deliberately computes no zIndex — Phase 7's `useResolvedOverlayZIndex` token-stacks Sheets automatically (RESEARCH anti-pattern).

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Shared primitives are in place and individually tested; Wave 2-3 pickers (SheetSelect, SheetMultiSelect, SheetDatePicker, SheetActionMenu) can compose `useSheetPickerField` + `SheetTrigger` + `getTriggerSummary` + `normalizeDiacritics` directly.
- No explicit zIndex is passed anywhere in this layer, preserving Phase 7 stacking for nested sheets.

---
*Phase: 08-sheet-picker-component-layer*
*Completed: 2026-06-29*
