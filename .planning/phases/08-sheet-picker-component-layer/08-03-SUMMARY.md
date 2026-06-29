---
phase: 08-sheet-picker-component-layer
plan: 03
subsystem: ui
tags: [react, antd, sheet-picker, single-select, form-binding, diacritics, jsdom]

requires:
  - phase: 08-01
    provides: shared primitives (useSheetPickerField, SheetTrigger, getTriggerSummary, normalizeDiacritics) + @components/Sheet host
provides:
  - SheetSelect single-select sheet picker (tap→check→dismiss, diacritic search, "Bỏ chọn" clear)
  - SheetSelectProps / SheetSelectOption public types
  - SheetSelect folder barrel for @components/SheetPicker consumers
  - window.matchMedia jsdom polyfill in src/setupTests.ts (unblocks AntD Form rendering under test)
affects: [08-sheet-picker-component-layer remaining plans, call-site migration phases (10-11)]

tech-stack:
  added: []
  patterns:
    - "Single-select picker composes Wave-1 shared primitives — no reimplementation of trigger/label/filter logic"
    - "Real <button role='option' aria-selected> rows convey selection via ARIA, checkmark is aria-hidden decoration"
    - "Search query reset on each open transition, mirroring useSheetPickerField draft re-seeding"
    - "Co-located form-binding test wraps the component in a real AntD Form to guard against lost Form.Item child-clone binding (Pitfall 1)"

key-files:
  created:
    - src/Components/SheetPicker/SheetSelect/SheetSelect.tsx
    - src/Components/SheetPicker/SheetSelect/SheetSelect.test.tsx
    - src/Components/SheetPicker/SheetSelect/SheetSelect.formbind.test.tsx
    - src/Components/SheetPicker/SheetSelect/index.ts
  modified:
    - src/setupTests.ts

key-decisions:
  - "Reset search query on each open via effect so a stale filter never leaks into a fresh open"
  - "CheckOutlined rendered aria-hidden — selection state is conveyed by aria-selected, not the icon's accessible name (a11y, avoids polluting the option's accessible name)"
  - "Added a shared window.matchMedia jsdom polyfill rather than per-test mocks — first AntD Form under test needed it, all future picker form-binding tests will too"
  - "Form-binding test uses a native <button type=submit> instead of AntD Button to keep the test focused on binding and sidestep an unrelated jsdom gap"

patterns-established:
  - "Pattern: single-select sheet picker = SheetTrigger (closed) + Sheet host (open) + option-row buttons; tap commits + auto-dismisses, no commit button"
  - "Pattern: diacritic-insensitive client filter via normalizeDiacritics(label).includes(normalizeDiacritics(query)), threshold 8 or showSearch"

requirements-completed: [PICK-01, PICK-02, PICK-08]

duration: 18min
completed: 2026-06-29
---

# Phase 8 Plan 03: SheetSelect Summary

**Single-select sheet picker that commits on tap with a checkmark and auto-dismisses, with diacritic-insensitive search at threshold 8 and a "Bỏ chọn" clear row, proven AntD-Form-bindable by two co-located jsdom test suites (12 tests).**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-06-29T07:25Z
- **Completed:** 2026-06-29T07:43Z
- **Tasks:** 2 (plus folder barrel)
- **Files modified:** 5 (4 created, 1 modified)

## Accomplishments
- `SheetSelect` (PICK-01/02): tap an option row → `onChange(value)` once → trailing `CheckOutlined` + `aria-selected` → sheet auto-dismisses, no commit button.
- Diacritic-insensitive search (D-07) auto-appears at `options.length >= 8` or `showSearch`; "do" matches "Đỏ"; empty filter → "Không tìm thấy", no options at all → "Chưa có lựa chọn".
- `allowClear` leading "Bỏ chọn" row clears the value and dismisses (PICK-02).
- Proven Form-bindable (PICK-08, D-12): a bound SheetSelect submits the picked value unchanged via AntD `Form`, and a required rule blocks submit when empty.
- Composes the Wave-1 shared primitives (`useSheetPickerField`, `SheetTrigger`, `getTriggerSummary`, `normalizeDiacritics`) on `@components/Sheet`; passes no explicit `zIndex` (RESEARCH anti-pattern).

## Task Commits

Each task was committed atomically (TDD):

1. **Task 1: SheetSelect component + behavior test** - `ff26ab3` (feat) — RED+GREEN combined since the test file imports the component
2. **Task 2: SheetSelect Form-binding test + matchMedia polyfill** - `7033b26` (test)
3. **Folder barrel** - `1755e2a` (feat)

_Note: behavior test and component landed in one commit because the test imports the component; the formbind suite verifies pre-existing behavior so it is a single test commit._

## Files Created/Modified
- `src/Components/SheetPicker/SheetSelect/SheetSelect.tsx` - Single-select sheet picker (trigger + sheet + option rows, search, clear).
- `src/Components/SheetPicker/SheetSelect/SheetSelect.test.tsx` - 10 jsdom behavior tests (tap-commit, checkmark/aria, search threshold + diacritics, clear, empty states, disabled).
- `src/Components/SheetPicker/SheetSelect/SheetSelect.formbind.test.tsx` - 2 jsdom Form-binding tests (value unchanged on submit, required rule blocks).
- `src/Components/SheetPicker/SheetSelect/index.ts` - Folder barrel re-exporting component + types.
- `src/setupTests.ts` - Added `window.matchMedia` jsdom polyfill.

## Decisions Made
- Reset the search query on each open transition (effect on `open`) so a stale filter never leaks into a fresh open — mirrors `useSheetPickerField`'s draft re-seeding.
- `CheckOutlined` is `aria-hidden`; selection is conveyed by `aria-selected` only, keeping the option's accessible name clean (a11y, Pitfall 6).
- Used `useSheetPickerField` for `open`/`setOpen` only (single-select needs no draft) and called `onChange` directly on tap.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added window.matchMedia jsdom polyfill**
- **Found during:** Task 2 (Form-binding test)
- **Issue:** AntD `Form.Item` renders through responsive `Row`/`Col`, which subscribes to a responsive observer calling `window.matchMedia` on mount — unimplemented in jsdom, throwing `TypeError: window.matchMedia is not a function`. No prior test exercised an AntD Form, so the polyfill never existed.
- **Fix:** Added the standard AntD-recommended no-op `matchMedia` polyfill to the shared `src/setupTests.ts` (additive, guarded by an existence check).
- **Files modified:** src/setupTests.ts
- **Verification:** Both form-binding tests pass; full SheetPicker suite (47 tests across 6 files) green — no regressions.
- **Committed in:** 7033b26 (Task 2 commit)

**2. [Rule 3 - Blocking] Form-binding test uses native submit button, not AntD Button**
- **Found during:** Task 2
- **Issue:** An AntD `Button` pulls in the same responsive-grid path; using it adds an unrelated surface to a test whose subject is the Form binding.
- **Fix:** Used a native `<button type="submit">` to drive form submission.
- **Files modified:** src/Components/SheetPicker/SheetSelect/SheetSelect.formbind.test.tsx
- **Verification:** Form submit fires `onFinish` with the picked value; required-rule case blocks submit.
- **Committed in:** 7033b26 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 3 - blocking, test-environment only).
**Impact on plan:** Both fixes were necessary to run the planned Form-binding test under jsdom. The polyfill is reusable infrastructure for all future picker form-binding tests. No scope creep; component behavior matches the plan exactly.

## Issues Encountered
- Several initial behavior-test assertions used `queryByText('Chọn')` to detect sheet dismissal, but the placeholder "Chọn" also renders permanently in the closed trigger, so the assertion always matched. Switched dismissal checks to `queryByRole('option')` (sheet-body content). The `openSheet` helper also had to target the `aria-haspopup="dialog"` button specifically, since `allowClear` + a value renders a second nested clear button. These were test-only corrections; component behavior was correct throughout.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `SheetSelect` is ready for the remaining Wave-2 pickers to follow the same composition pattern and for call-site migration (Phases 10-11).
- The shared `matchMedia` polyfill unblocks any future AntD-Form-based picker test.
- No blockers.

---
*Phase: 08-sheet-picker-component-layer*
*Completed: 2026-06-29*
