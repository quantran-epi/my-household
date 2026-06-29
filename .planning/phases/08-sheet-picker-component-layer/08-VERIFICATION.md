---
phase: 08-sheet-picker-component-layer
verified: 2026-06-29T08:40:00Z
status: human_needed
score: 8/8 must-haves verified (logic level); 4/4 ROADMAP success criteria met
overrides_applied: 0
human_verification:
  - test: "On a real touch device (iPhone/WebKit), open the SheetSelect from its closed trigger and tap an option row."
    expected: "The sheet (and its backdrop overlay) tears down on the single tap and the closed trigger now shows the picked label."
    why_human: "jsdom units prove the onChange+setOpen(false) logic on synthetic click, but real-gesture tap-to-commit + overlay teardown is only exercised by tests/e2e/sheet-picker.spec.ts (mobile-safari), which cannot run in this environment due to the pre-existing PUBLIC_URL(/my-household) vs playwright baseURL(/my-recipes) basename mismatch (REVIEW IN-04). The fixture route never mounts, so the e2e is unrunnable here."
  - test: "On a touch device, open the SheetMultiSelect, toggle two rows, confirm the sheet stays open and 'Xong (2)' reflects the count, then tap 'Xong'."
    expected: "Sheet stays open during toggles; commit button reads 'Xong (2)'; tapping it dismisses and the trigger shows the multi summary."
    why_human: "Same e2e-cannot-run constraint. The count/commit logic is unit-verified, but the real-gesture flow proof is e2e-only and the suite is blocked by the basename mismatch."
  - test: "On a touch device, make a SheetMultiSelect dirty (toggle a row), then drag the sheet grabber down past the 40% threshold."
    expected: "The dirty sheet springs back (maskClosable=false) instead of dismissing — the in-progress draft is not lost."
    why_human: "Real pointer-drag spring-back cannot be reproduced in jsdom — units can only assert maskClosable={!dirty} is wired and the data-dirty attribute flips. The gesture-level spring-back lives exclusively in the e2e, which is blocked from running."
---

# Phase 08: Sheet Picker Component Layer Verification Report

**Phase Goal:** Build the reusable `@components/SheetPicker` layer (SheetSelect, SheetMultiSelect, SheetDatePicker, SheetActionMenu) on the upgraded Sheet base, each AntD-Form-bindable, with full behavior parity — before any mass migration.
**Verified:** 2026-06-29T08:40:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | SheetSelect (tap→check→dismiss, search, clear) and SheetMultiSelect (checkbox rows, "Xong" commit, count, cancel-reverts) work in isolation with tests | ✓ VERIFIED | `SheetSelect.tsx:111-119` handleSelect calls `onChange` + `setOpen(false)`; checkmark at L193; search threshold 8 / diacritic filter L103-109; "Bỏ chọn" clear row L150-160. `SheetMultiSelect.tsx`: checkbox rows L222, sheet stays open (no auto-dismiss on toggle), `Xong (N)` L154 + commit L239, `Hủy`/cancel L236 discards draft. Units assert each: SheetSelect.test "tapping an option row commits the value once and dismisses" / "search filters diacritic-insensitively" / "Bỏ chọn clears and dismisses"; SheetMultiSelect.test "toggling does NOT call onChange while sheet stays open", "Xong (N) calls onChange once with full draft", "Hủy closes without onChange and reopening re-seeds original". |
| 2 | SheetDatePicker hosts an in-sheet calendar, keeps a `Dayjs` value, honors min/max, time, range, and a "Hôm nay" shortcut | ✓ VERIFIED | `SheetDatePicker.tsx`: de-floated AntD panel via `getPopupContainer={()=>bodyEl}` + `popupStyle` + scoped `.sheet-date-popup` CSS L48-60,180-182; value stays `Dayjs` (no moment conversion); `disabledDate` passed through L183; `resolveToday` clamps "Hôm nay" to min/max searching outward L76-86; `showTime` confirm flow L124-132,196-207; `RangePicker` sub-export via `Object.assign` L335, range commits only on "Xong" L278-283. Unit names confirm: "renders embedded AntD panel INSIDE the sheet body", "picking a day calls onChange with a Dayjs and closes", "disabledDate marks out-of-range disabled", "Hôm nay commits today / lands on nearest allowed", "showTime commits a Dayjs preserving time", "RangePicker commits tuple ONLY on Xong", "Hủy reverts". |
| 3 | SheetActionMenu renders full-width rows, red destructive actions, and a separate "Hủy" | ✓ VERIFIED | `SheetActionMenu.tsx`: full-width rows in one rounded surface L95-116, danger `#ff4d4f` L26,105, detached "Hủy" in own surface with 24px gap L117-123, row onClick runs action then onClose L88-91. Units assert: "danger row renders label in #ff4d4f", "non-danger not red", "clicking row fires onClick once then onClose once in order", "Hủy fires onClose and triggers no action". |
| 4 | All four pickers bind to AntD `Form` (value/onChange/id/status) so a Form submit validates and collects values unchanged | ✓ VERIFIED (with documented design nuance) | `useSheetPickerField.ts` + `SheetTrigger.tsx` normalize the Form.Item-injected value/onChange/id/status; trigger forwards `id` to root button L89 and `aria-invalid` on `status==='error'` L94. Form-bind tests prove unchanged collection: SheetSelect.formbind "submits picked value unchanged" `onFinish({field:'c'})` + required rule blocks submit; SheetMultiSelect.formbind "Xong collects committed array unchanged" `{tags:['a','b','c']}` + "Hủy leaves initial array"; SheetDatePicker.formbind "collects the single Dayjs value unchanged" asserting `dayjs.isDayjs(values.date)===true`. **Nuance:** SheetActionMenu is intentionally NOT Form-bound (design D-10 — it dispatches actions, holds no value); the 3 value-holding pickers all bind. The "all four" criterion is satisfied in spirit — the only non-bound picker has no value to bind. |

**Score:** 8/8 PICK requirements verified at logic level; 4/4 ROADMAP success criteria met. Real-gesture touch behaviors (criterion 1's tap/drag flows) require human confirmation — see below.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/Components/SheetPicker/shared/normalizeDiacritics.ts` | VN diacritic-insensitive normalize | ✓ VERIFIED | NFD strip + đ/Đ replace + lowercase; ReDoS-safe (callers use String.includes). |
| `src/Components/SheetPicker/shared/optionLabel.ts` | value→label + trigger summary | ✓ VERIFIED | `getTriggerSummary` + `getSelectedOptionDisplays` lifted from Form/Select; multi "+N" / "N đã chọn" fallback. |
| `src/Components/SheetPicker/shared/useSheetPickerField.ts` | normalize injected props + open/draft/dirty machine | ✓ VERIFIED | Re-seeds draft on each open L51-54; `dirty` via sameSet; commit/cancel; never passes zIndex. |
| `src/Components/SheetPicker/shared/SheetTrigger.tsx` | AntD-input-styled trigger forwarding id/status | ✓ VERIFIED | Forwards id, aria-invalid on error ring, clear × affordance. (REVIEW WR-02/WR-03 a11y warnings noted, non-blocking.) |
| `src/Components/SheetPicker/SheetSelect/SheetSelect.tsx` | single-select picker | ✓ VERIFIED | Composes shared primitives + Sheet; tap→check→dismiss + search + clear. |
| `src/Components/SheetPicker/SheetMultiSelect/SheetMultiSelect.tsx` | multi-select draft/commit/revert | ✓ VERIFIED | Checkbox draft + Xong/Hủy + maskClosable={!dirty} L175. |
| `src/Components/SheetPicker/SheetDatePicker/SheetDatePicker.tsx` | date/datetime/range, RangePicker sub-export | ✓ VERIFIED | De-floated panel, Dayjs, Hôm nay, showTime, Object.assign RangePicker. |
| `src/Components/SheetPicker/SheetActionMenu/SheetActionMenu.tsx` | grouped action sheet | ✓ VERIFIED | Rows + danger red + detached Hủy; not Form-bound by design. |
| `src/Components/SheetPicker/index.ts` | barrel exporting four pickers + types | ✓ VERIFIED | Named re-exports for all four + types L8-18. |
| `src/Routing/SheetPickerFixture.screen.tsx` | test-only fixture mounting four pickers | ✓ VERIFIED | Mounts all four deterministically; local state for e2e assertions. |
| `tests/e2e/sheet-picker.spec.ts` | mobile-safari touch e2e | ✓ EXISTS (unrunnable here) | Well-formed PICK-01/03/04 gesture tests; blocked by basename mismatch (IN-04) — cannot execute in this env. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| SheetSelect/MultiSelect/DatePicker | shared primitives | `useSheetPickerField` + `SheetTrigger` + `getTriggerSummary` + `normalizeDiacritics` | ✓ WIRED | All imports present and used in each picker. |
| All pickers | `@components/Sheet` | Sheet host + SheetActions | ✓ WIRED | `from '@components/Sheet'` in all four. |
| Form.Item child-clone | trigger root | injected `id` → button id, `status` → aria-invalid | ✓ WIRED | SheetTrigger.tsx L89,94; proven by formbind tests. |
| SheetDatePicker | embedded AntD panel | `getPopupContainer` into sheet body + z-index neutralized | ✓ WIRED | L180-182 + deFloatStyles; unit confirms panel renders inside body, not portaled. |
| SheetDatePicker | RangePicker | `Object.assign(SheetDatePickerBase, { RangePicker })` | ✓ WIRED | L335; unit "exists as Object.assign sub-export". |
| RootRouter.tsx | SheetPickerFixtureScreen | lazy route at StaticRoutes.SheetPickerFixture | ✓ WIRED | RootRouter.tsx L63-64,120; RootRoutes.ts L128 `/__sheet-picker-fixture`. |
| sheet-picker.spec.ts | fixture route | page.goto + getByTestId | ⚠️ WIRED but UNRUNNABLE | Spec targets the route correctly, but the route does not mount under playwright's baseURL (IN-04). |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Unit suite passes | `CI=true npx react-scripts test --watchAll=false src/Components/SheetPicker` | 10 suites, 73 tests passed | ✓ PASS |
| Type safety | `npx tsc --noEmit` | exit 0 | ✓ PASS |
| Real-gesture touch e2e | `playwright test tests/e2e/sheet-picker.spec.ts --project=mobile-safari` | Cannot run — fixture route does not mount under baseURL mismatch (IN-04) | ? SKIP → human |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| PICK-01 | 08-03, 08-06 | SheetSelect tap→check→dismiss | ✓ SATISFIED (logic); human for real-gesture | Source + unit verified; touch e2e needs human. |
| PICK-02 | 08-01, 08-03 | search/filter + "bỏ chọn" clear | ✓ SATISFIED | Search threshold + diacritic filter + clear row, unit-verified. |
| PICK-03 | 08-04, 08-06 | MultiSelect checkbox, stays open, Xong commit + count | ✓ SATISFIED (logic); human for real-gesture | Source + unit verified; touch e2e needs human. |
| PICK-04 | 08-04, 08-06 | Cancel reverts to values-on-open | ✓ SATISFIED (logic); human for drag spring-back | Hủy revert unit-verified + maskClosable wired; real drag spring-back needs human. |
| PICK-05 | 08-05 | SheetDatePicker in-sheet calendar, Dayjs, min/max, Hôm nay | ✓ SATISFIED | Source + units verified. |
| PICK-06 | 08-05 | showTime + RangePicker | ✓ SATISFIED | Source + units verified. |
| PICK-07 | 08-02 | SheetActionMenu rows, red destructive, Hủy | ✓ SATISFIED | Source + units verified. |
| PICK-08 | 08-01, 08-03, 08-04, 08-05 | All pickers bind to AntD Form | ✓ SATISFIED | 3 value-holding pickers bind (formbind tests pass); ActionMenu excluded by design D-10. |

No orphaned requirements — all PICK-01..08 mapped to plans and accounted for.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| SheetDatePicker.tsx | 48-60 | Per-instance injected `<style>` with page-global rules | ℹ️ Info | REVIEW IN-02; class-scoped, no leak found. |
| SheetTrigger.tsx | 102-110 | Clear control keyboard-inoperable, nested interactive | ⚠️ Warning | REVIEW WR-02; a11y defect, propagates to all pickers via allowClear. Non-blocking for goal. |
| SheetTrigger.tsx | 92-94 | Static `aria-expanded={false}` with `aria-haspopup="dialog"` | ⚠️ Warning | REVIEW WR-03; AT reports popup never expanded. Non-blocking. |
| SheetSelect.tsx | 151-194 | `role="option"` without enclosing `role="listbox"` | ⚠️ Warning | REVIEW WR-04; orphaned ARIA. Non-blocking. |
| SheetDatePicker.tsx | 151 | showTime flow lacks maskClosable drag-protection | ⚠️ Warning | REVIEW WR-01; in-progress datetime can be lost on accidental dismiss. Behavioral gap but not a goal-blocker (showTime commits via Xong; only accidental-dismiss edge affected). |

No 🛑 blockers. No TBD/FIXME/XXX debt markers. No stubs — all artifacts are substantive and wired with real data flow.

### Human Verification Required

The three real-gesture touch flows below are the gesture-level integration proof that jsdom cannot provide. The underlying selection/draft/commit/revert LOGIC is fully unit-verified (73 passing tests), and the `maskClosable={!dirty}` wiring is asserted. What remains unverifiable programmatically here is the real pointer-event behavior, because `tests/e2e/sheet-picker.spec.ts` cannot execute in this environment due to the pre-existing PUBLIC_URL(`/my-household`) vs playwright baseURL(`/my-recipes`) basename mismatch documented in REVIEW IN-04 (reproduces with the existing native-sheet.spec.ts too — environmental, not a phase-08 code defect).

1. **SheetSelect tap-to-commit (PICK-01)** — On a touch device, tap an option row; the sheet+overlay should tear down and the trigger should show the pick.
2. **SheetMultiSelect Xong commit + count (PICK-03)** — Toggle two rows (sheet stays open), confirm "Xong (2)", tap to commit and dismiss.
3. **SheetMultiSelect dirty drag-dismiss revert (PICK-04)** — Make dirty, drag grabber past 40%; sheet must spring back, draft intact.

If the orchestrator fixes the baseURL/basename mismatch, these become machine-verifiable by running the existing e2e on the `mobile-safari` project.

### Gaps Summary

No goal-blocking gaps. All four pickers exist, are substantive, wired, AntD-Form-bindable (the three value-holding ones), exported via the barrel, and mounted in a fixture. 73 unit tests pass and `tsc --noEmit` is clean. Every PICK-01..08 requirement is accounted for in code.

Status is `human_needed` rather than `passed` solely because the phase's explicit mobile-safari touch e2e — the real-gesture proof for PICK-01/03/04 — cannot run in this environment (pre-existing basename mismatch, IN-04), so the tap-to-commit, Xong-commit, and drag-dismiss spring-back behaviors need either an env fix + e2e run or a one-time human/device confirmation. The four REVIEW warnings (a11y in SheetTrigger/SheetSelect, showTime maskClosable) are quality issues that do not block the phase goal and can be addressed during or before the Phase 10-11 migration.

---

_Verified: 2026-06-29T08:40:00Z_
_Verifier: Claude (gsd-verifier)_
