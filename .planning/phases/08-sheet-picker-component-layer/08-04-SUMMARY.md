---
phase: 08-sheet-picker-component-layer
plan: 04
subsystem: ui
tags: [react, antd, sheet-picker, multi-select, form-binding, vietnamese, diacritics]

requires:
  - phase: 07-native-sheet-foundation
    provides: "@components/Sheet host (drag-dismiss, focus trap, z-index token stacking, maskClosable, SheetActions)"
  - phase: 08-sheet-picker-component-layer
    plan: 01
    provides: "shared primitives — useSheetPickerField, SheetTrigger, getTriggerSummary, normalizeDiacritics"
provides:
  - "SheetMultiSelect — checkbox-row multi-select sheet picker with draft + Xong/Hủy commit-revert (PICK-03/04, D-06)"
  - "SheetMultiSelectProps / SheetMultiSelectOption — public prop + option types"
affects: [08-05, 08-06, ScheduledMeal, Dishes, Ingredient, ShoppingList]

tech-stack:
  added: []
  patterns:
    - "Draft re-seeded from value on each open via useSheetPickerField; toggles mutate draft only, sheet stays open (RESEARCH §Pattern 3)"
    - "maskClosable={!dirty} so an accidental drag-dismiss on a dirty draft springs back (Phase 7 D-04)"
    - "Commit on Xong (N) → onChange(draft) + close; Hủy/dismiss → cancel (draft discarded, no onChange)"
    - "Single root element (React.Fragment + SheetTrigger) so Form.Item child-clone binds value/onChange/id/status (PICK-08, D-02)"
    - "Diacritic-insensitive client filter via normalizeDiacritics + String.includes at threshold 8 (ReDoS-safe, D-07)"
    - "jsdom window.matchMedia polyfill in the Form-binding test for AntD Grid responsive observer"

key-files:
  created:
    - src/Components/SheetPicker/SheetMultiSelect/SheetMultiSelect.tsx
    - src/Components/SheetPicker/SheetMultiSelect/SheetMultiSelect.test.tsx
    - src/Components/SheetPicker/SheetMultiSelect/SheetMultiSelect.formbind.test.tsx
    - src/Components/SheetPicker/SheetMultiSelect/index.ts
  modified: []

key-decisions:
  - "Rendered checkbox rows as <label> wrapping AntD <Checkbox> with aria-label from the string option label so RTL getByLabelText targets the row and free aria-checked is preserved (Pitfall 6)"
  - "Added a hidden data-dirty reflector span alongside maskClosable={!dirty} so the dirty-drag-protection contract is assertable in jsdom without simulating a full drag gesture"
  - "Polyfilled window.matchMedia in the Form-binding test only (not shared setupTests) — AntD Grid pulled in by Form/Button registers a responsiveObserver that jsdom lacks (Rule 3 test-env blocker)"
  - "Used waitFor on the onFinish spy — rc-field-form validates and resolves onFinish in a microtask, so findByRole does not flush it"

requirements-completed: [PICK-03, PICK-04, PICK-08]

duration: 9min
completed: 2026-06-29
---

# Phase 8 Plan 04: SheetMultiSelect Summary

**`SheetMultiSelect` — a checkbox-row bottom-sheet multi-select that edits a local draft seeded from `value` on open, commits the full array via a "Xong (N)" primary button, reverts on "Hủy", protects a dirty draft from accidental drag-dismiss, and binds cleanly to an AntD `Form` (PICK-03/04/08, D-06).**

## Performance

- **Duration:** 9 min
- **Tasks:** 2
- **Files created:** 4

## Accomplishments
- Checkbox rows toggle a local draft only; the sheet stays open and `onChange` is never called until commit (proven by an RTL spy).
- The primary button reflects the live draft count — plain `Xong` at 0, `Xong (N)` otherwise — and commits the whole draft array once on click, then dismisses.
- `Hủy` (and drag/backdrop dismiss) reverts: the draft is discarded and reopening re-seeds from the committed `value`; `onChange` is never called.
- While the draft differs from value-on-open the host `<Sheet>` gets `maskClosable={false}` so an accidental drag-dismiss springs back instead of losing edits (Phase 7 D-04), with a hidden `data-dirty` reflector for assertability.
- Composes the Wave-1 shared primitives (`useSheetPickerField`, `SheetTrigger`, `getTriggerSummary`, `normalizeDiacritics`) plus the Phase-7 `SheetActions` sticky footer; never passes an explicit `zIndex`.
- `Đã chọn (N)` summary strip mirrors `Form/Select.tsx`; diacritic-insensitive search appears at the locked threshold of 8 options or when `showSearch` is passed.
- Proven Form-bindable: inside a real `<Form>`, submit collects the committed array unchanged after `Xong`, and `Hủy` leaves the form value at its `initialValues` array (revert visible through `onFinish`).

## Task Commits

Each task was committed atomically (TDD RED → GREEN):

1. **Task 1 (RED): failing behavior test** - `a3b0e02` (test)
2. **Task 1 (GREEN): SheetMultiSelect implementation** - `a4f2118` (feat)
3. **Task 2: Form-binding test (PICK-08)** - `35b3285` (test)
4. **Folder barrel index.ts** - `36662fd` (feat)

## Files Created/Modified
- `src/Components/SheetPicker/SheetMultiSelect/SheetMultiSelect.tsx` - multi-select sheet picker (checkbox draft + Xong/Hủy commit-revert, maskClosable={!dirty}, search, summary strip)
- `src/Components/SheetPicker/SheetMultiSelect/SheetMultiSelect.test.tsx` - 7 behavior tests (draft toggle no-onChange, Xong count + commit, Hủy revert/re-seed, dirty maskClosable, trigger summary, clear)
- `src/Components/SheetPicker/SheetMultiSelect/SheetMultiSelect.formbind.test.tsx` - 2 Form-binding tests (committed array unchanged on submit; revert preserved through onFinish)
- `src/Components/SheetPicker/SheetMultiSelect/index.ts` - folder barrel re-exporting component + prop/option types

## Decisions Made
- Checkbox rows are `<label>` wrapping AntD `<Checkbox>` with an `aria-label` from the string option label — keeps the free `aria-checked` (Pitfall 6) and lets RTL target rows by Vietnamese label.
- Added a hidden `data-dirty` reflector span so the `maskClosable={!dirty}` drag-protection contract is assertable under jsdom without simulating a full pointer drag.
- Polyfilled `window.matchMedia` in the Form-binding test only — AntD Grid (pulled in by `Form`/`Button`) registers a `responsiveObserver` that jsdom lacks. Scoped to the test file rather than shared `setupTests` to avoid global side effects.
- Used `waitFor` on the `onFinish` spy because `rc-field-form` validates and resolves `onFinish` in a microtask that `findByRole` does not flush.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] jsdom missing window.matchMedia for AntD Form**
- **Found during:** Task 2 (Form-binding test)
- **Issue:** Rendering a real AntD `<Form>` under jsdom threw `TypeError: window.matchMedia is not a function` — AntD Grid's `responsiveObserver` subscribes to `matchMedia` on mount, which jsdom does not implement. Blocked the entire form-binding suite from mounting.
- **Fix:** Added a `beforeAll` polyfill defining a no-op `MediaQueryList` (`matches:false`, no-op listeners) in the form-binding test file only.
- **Files modified:** `src/Components/SheetPicker/SheetMultiSelect/SheetMultiSelect.formbind.test.tsx`
- **Commit:** `35b3285`

**2. [Rule 3 - Blocking] async onFinish not flushed by findByRole**
- **Found during:** Task 2 (Form-binding test)
- **Issue:** After clicking submit, the `onFinish` spy showed 0 calls — `rc-field-form` validates and invokes `onFinish` in a microtask, so the initial `await screen.findByRole(...)` returned before it resolved.
- **Fix:** Replaced the post-submit assertion with `await waitFor(() => expect(onFinish).toHaveBeenCalledTimes(1))` in both form-binding cases.
- **Files modified:** `src/Components/SheetPicker/SheetMultiSelect/SheetMultiSelect.formbind.test.tsx`
- **Commit:** `35b3285`

## Issues Encountered
None beyond the two test-environment blockers documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `SheetMultiSelect` is in place, individually tested (9 tests across 2 files, all green), and exported via its folder barrel; Wave-3 plans and the conversion phases can import it directly.
- The matchMedia polyfill pattern is now established for any future picker test that mounts a real AntD `Form`/Grid under jsdom.
- No explicit `zIndex` is passed anywhere in this component, preserving Phase 7 nested-sheet stacking.
