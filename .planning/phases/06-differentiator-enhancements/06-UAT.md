---
status: testing
phase: 06-differentiator-enhancements
source:
  - 06-VERIFICATION.md
started: 2026-06-19T11:45:00Z
updated: 2026-06-19T11:45:00Z
---

## Current Test

number: 1
name: Cook-now three-bucket grouping (UAT test 4 re-test)
expected: |
  With cook-now enabled and real inventory + servingCount > 2, results show
  Nấu ngay, Cần mua thêm ít, and Dự phòng as appropriate, never collapsing to
  one group.
awaiting: user response

## Tests

### 1. Cook-now three-bucket grouping (UAT test 4 re-test)
expected: With cook-now enabled and real inventory + servingCount > 2, results show Nấu ngay, Cần mua thêm ít, and Dự phòng as appropriate, never collapsing to one group. Confirm WR-03 UX is acceptable — a "Nấu ngay" dish may still badge "Thiếu N" at higher serving counts.
result: pending

### 2. Member portions card layout (UAT test 1 re-test)
expected: Each member is a full-width card with name, health-status tag, and short description; selected state uses #7436dc accent; tap targets feel comfortable on a phone (390px viewport).
result: pending

### 3. Clear-defaults confirmation + stacked hint (UAT test 2 re-test)
expected: Clicking "Xóa lựa chọn đã nhớ" shows a confirm dialog (danger ok) before deleting; the hint reads title above the two action buttons (stacked, not condensed on one line).
result: pending

### 4. Brand-new shopping list selector (UAT test 6 re-test)
expected: When an open list exists, the missing-ingredient sheet offers existing-vs-new; choosing "new" reveals the name input and creates a fresh list with the selected ingredients. Per review finding WR-02, verify the new list contains all expected ingredients, not just the ones missing from the old list.
result: pending

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
