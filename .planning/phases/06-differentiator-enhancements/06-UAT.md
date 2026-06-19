---
status: complete
phase: 06-differentiator-enhancements
source:
  - 06-01-SUMMARY.md
  - 06-02-SUMMARY.md
  - 06-03-SUMMARY.md
started: 2026-06-19T00:00:00Z
updated: 2026-06-19T00:30:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Portions / Member Selection Step
expected: After picking ingredients and before preferences, a new step "Nhà mình có ai ăn bữa này?" appears. Household members are selectable if they exist; otherwise a +/- serving-count stepper shows with large tap targets. The step is skippable ("Tùy bạn").
result: issue
reported: "pass but the layout of member not good, i want each member selection is a card, stretch full width, consist of member name, member status and short description"
severity: cosmetic

### 2. Remembered Defaults, Start Fresh, Clear Defaults
expected: On a repeat wizard run a subtle hint "Đang dùng lựa chọn lần trước" appears with your previous answers prefilled. You can "Chọn lại từ đầu" to reset the current run, or "Xóa lựa chọn đã nhớ" to clear remembered defaults. Clearing asks for confirmation — nothing is deleted silently.
result: issue
reported: "clearing not ask for confirm, and the layout of subtle hint and the 2 buttons is condensed, the title should above and two button below"
severity: major

### 3. Cook-Now Toggle on Preferences
expected: On the preference step there is an optional toggle "Ưu tiên nấu được ngay". It is off by default and can be turned on without blocking the flow.
result: pass

### 4. Cook-Now Result Grouping
expected: With cook-now enabled and inventory data present, results group into "Nấu ngay", "Cần mua thêm ít", and "Dự phòng". The flow never dead-ends on an empty ready group. With weak/empty inventory you see the hint "Kho chưa đủ rõ, mình vẫn xếp món theo nguyên liệu bạn chọn." and results still appear (fallback to chosen ingredients).
result: issue
reported: "only \"need buy a bit\" section show up"
severity: major

### 5. Result Card Reason + Detail Sheet
expected: Each result card shows a one-line natural household reason. Tapping the small question-mark icon opens a sheet "Vì sao gợi ý món này?" explaining matched ingredients, missing ingredients, preference fit, and household fit — in plain language with no raw score numbers.
result: pass

### 6. Add Missing Ingredients to Đi chợ Inline
expected: Result cards with missing ingredients show "Thêm vào Đi chợ". Tapping opens a sheet with the missing rows preselected; items already on the active list are disabled as already added. Adding keeps you on the result page and shows inline success with manage and undo actions. If no incomplete shopping list exists, it creates "Đi chợ hôm nay" in place.
result: issue
reported: "pass. but need option to add to a brand new shopping list if user dont want to add to existing open shopping list"
severity: minor

## Summary

total: 6
passed: 2
issues: 4
pending: 0
skipped: 0

## Gaps

- truth: "Member selection on the portions step is presented in a usable, clear layout."
  status: failed
  reason: "User reported: pass but the layout of member not good, i want each member selection is a card, stretch full width, consist of member name, member status and short description"
  severity: cosmetic
  test: 1
  artifacts: []
  missing: []

- truth: "Clearing remembered defaults asks for confirmation (no silent deletion), and the remembered-defaults hint with its two actions is laid out clearly."
  status: failed
  reason: "User reported: clearing not ask for confirm, and the layout of subtle hint and the 2 buttons is condensed, the title should above and two button below"
  severity: major
  test: 2
  artifacts: []
  missing: []

- truth: "With cook-now enabled and inventory present, results show all three groups (Nấu ngay, Cần mua thêm ít, Dự phòng) as appropriate, never collapsing to a single group."
  status: failed
  reason: "User reported: only \"need buy a bit\" section show up"
  severity: major
  test: 4
  artifacts: []
  missing: []

- truth: "When adding missing ingredients, the user can choose to add them to a brand-new shopping list instead of being forced into the existing open list."
  status: failed
  reason: "User reported: pass. but need option to add to a brand new shopping list if user dont want to add to existing open shopping list"
  severity: minor
  test: 6
  artifacts: []
  missing: []


