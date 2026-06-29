---
phase: 08-sheet-picker-component-layer
plan: 02
subsystem: components-sheet-picker
tags: [sheet-picker, action-sheet, ios, antd, react]
requires:
  - "@components/Sheet (Sheet, SheetActions) — Phase 7"
provides:
  - "SheetActionMenu — iOS grouped action-sheet (PICK-07, D-10)"
  - "SheetActionMenuProps, SheetAction — public types"
affects:
  - "Phases 10-11 Dropdown overflow-menu migrations (~17 sites)"
tech-stack:
  added: []
  patterns:
    - "Grouped iOS action sheet hosted in <Sheet>; rows are full-width <button>s in one rounded surface"
    - "Detached Hủy rendered via SheetActions below the group (lg/24px gap)"
    - "Not Form-bound — dispatches actions, holds no value; never passes explicit zIndex"
key-files:
  created:
    - "src/Components/SheetPicker/SheetActionMenu/SheetActionMenu.tsx"
    - "src/Components/SheetPicker/SheetActionMenu/SheetActionMenu.test.tsx"
    - "src/Components/SheetPicker/SheetActionMenu/index.ts"
  modified: []
decisions:
  - "SheetActionMenu composes only Sheet + SheetActions — zero dependency on shared field primitives (Wave-1 sibling), since it is the one non-Form-bound picker (D-10)"
  - "Danger rows use AntD colorError #ff4d4f with weight 400 per UI-SPEC; no dangerouslySetInnerHTML (T-08-03 mitigation)"
metrics:
  duration: ~14m
  completed: 2026-06-29
---

# Phase 08 Plan 02: SheetActionMenu Component Layer Summary

`SheetActionMenu` (PICK-07, D-10): an iOS grouped action-sheet hosted in the Phase 7 native `<Sheet>` — full-width tappable rows in one rounded surface, destructive rows in red (#ff4d4f), and a visually detached "Hủy" button below the group. It is the one picker that is not Form-bound (dispatches actions, holds no value), so it composes only `<Sheet>` + `SheetActions` with no dependency on the shared field primitives.

## What Was Built

- `SheetActionMenu.tsx` exporting `SheetActionMenu`, `SheetActionMenuProps`, and `SheetAction`.
  - Props: `open`, `onClose`, `title?`, `actions: SheetAction[]`, `data-testid?`.
  - `SheetAction = { key, label, icon?, danger?, onClick }`.
  - Action rows render in one rounded `#fff` surface (`borderRadius:14`), divided by `1px solid #f0f0f0`; each row a full-width `<button type="button">` with `minHeight:44`, label 16px, optional 16px-gap leading icon. `danger` → label + icon color `#ff4d4f`, weight stays 400.
  - Each row's `onClick` runs the action then `onClose` (commit-then-dismiss).
  - "Hủy" is a separate detached button (16px/600) in its own rounded surface below the group via `SheetActions` with a `lg`/24px top gap, calling `onClose` only.
  - Hosted in `<Sheet open onClose title>`; never passes an explicit `zIndex` (Phase 7 token-stacking owns z-index).
- Co-located `SheetActionMenu.test.tsx` — 8 jsdom/RTL tests covering rows, min-height, danger red, non-danger color, leading icon, click order (onClick then onClose), Hủy isolation, and closed render.
- Folder barrel `index.ts` re-exporting the component + types (matches the explicit-named Sheet barrel shape).

## Acceptance Criteria

- A `danger` row's label element computed color is `#ff4d4f` / `rgb(255, 77, 79)` — asserted.
- Clicking an action row fires its `onClick` once, then `onClose` once, order asserted via a shared call log.
- The "Hủy" button fires `onClose` and triggers no action `onClick` — asserted.
- Each action row has `min-height:44px` — asserted.

## Verification

`CI=true npx react-scripts test --watchAll=false src/Components/SheetPicker/SheetActionMenu` — 8/8 tests pass (Test Suites: 1 passed).

## TDD Gate Compliance

- RED: `test(08-02): add failing test for SheetActionMenu` (da8a037) — suite failed (component module absent).
- GREEN: `feat(08-02): implement SheetActionMenu grouped action sheet` (7d9d3fa) — 8/8 pass.
- REFACTOR: none needed (implementation was minimal and clean).

## Deviations from Plan

None - plan executed exactly as written.

## Threat Flags

None. Labels render through JSX auto-escape (no `dangerouslySetInnerHTML`) per T-08-03; the menu holds no privileged capability and self-confirms nothing (T-08-04); zero new runtime deps (T-08-SC).
