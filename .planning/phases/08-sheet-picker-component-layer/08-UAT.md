---
status: testing
phase: 08-sheet-picker-component-layer
source: [08-VERIFICATION.md]
started: 2026-06-29T08:45:00Z
updated: 2026-06-29T08:45:00Z
---

## Current Test

number: 1
name: SheetSelect tap-to-commit + overlay teardown on a real touch device
expected: |
  Opening SheetSelect from its closed trigger and tapping an option row tears down
  the sheet (and its backdrop overlay) on the single tap, and the closed trigger then
  shows the picked label.
awaiting: user response

## Tests

### 1. SheetSelect tap-to-commit + overlay teardown (PICK-01)
expected: On a real touch device (iPhone/WebKit), open the SheetSelect from its closed trigger and tap an option row. The sheet and its backdrop overlay tear down on the single tap, and the closed trigger now shows the picked label.
result: [pending]

### 2. SheetMultiSelect stays-open + Xong count commit (PICK-03)
expected: On a touch device, open the SheetMultiSelect, toggle two rows. The sheet stays open during toggles and the commit button reads "Xong (2)". Tapping "Xong" dismisses the sheet and the trigger shows the multi summary.
result: [pending]

### 3. SheetMultiSelect dirty drag-dismiss spring-back (PICK-04)
expected: On a touch device, make a SheetMultiSelect dirty (toggle a row), then drag the sheet grabber down past the 40% threshold. The dirty sheet springs back (maskClosable=false) instead of dismissing — the in-progress draft is not lost.
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
