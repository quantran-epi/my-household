---
phase: 08-sheet-picker-component-layer
reviewed: 2026-06-29T08:30:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - src/Components/SheetPicker/shared/normalizeDiacritics.ts
  - src/Components/SheetPicker/shared/optionLabel.ts
  - src/Components/SheetPicker/shared/useSheetPickerField.ts
  - src/Components/SheetPicker/shared/SheetTrigger.tsx
  - src/Components/SheetPicker/SheetActionMenu/SheetActionMenu.tsx
  - src/Components/SheetPicker/SheetSelect/SheetSelect.tsx
  - src/Components/SheetPicker/SheetMultiSelect/SheetMultiSelect.tsx
  - src/Components/SheetPicker/SheetDatePicker/SheetDatePicker.tsx
  - src/Components/SheetPicker/index.ts
  - src/Routing/SheetPickerFixture.screen.tsx
  - src/Routing/RootRoutes.ts
  - src/Routing/RootRouter.tsx
  - src/setupTests.ts
findings:
  critical: 0
  warning: 4
  info: 4
  total: 8
status: issues_found
---

# Phase 08: Code Review Report

**Reviewed:** 2026-06-29T08:30:00Z
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

Reviewed the new SheetPicker component layer: four AntD-Form-bindable pickers (SheetSelect, SheetMultiSelect, SheetDatePicker + RangePicker, SheetActionMenu), shared helpers (normalizeDiacritics, optionLabel, useSheetPickerField, SheetTrigger), the barrel, the test-only fixture route, and the touched setupTests polyfill.

The Form-binding contract (value/onChange/id/status injection), diacritic-insensitive filtering, the draft/commit/revert state machine in SheetMultiSelect and RangePicker, and the DatePicker de-floating technique are all implemented as the plan describes and are largely correct. The matchMedia polyfill in setupTests.ts is additive and guarded as required — no issue there. No security vulnerabilities, no XSS sinks (the injected `<style>` is a static literal), no secrets, and the test-only fixture route is unauthenticated by design and carries no real data.

The findings below are correctness/quality gaps, concentrated in two areas: (1) the SheetDatePicker `showTime` single-date flow omits the dirty-state drag-protection that every other draft-bearing picker has, so an in-progress datetime edit can be silently lost; and (2) several accessibility defects in the shared SheetTrigger and SheetSelect (keyboard-inoperable clear control, invalid interactive nesting, orphaned ARIA roles, static `aria-expanded`).

## Warnings

### WR-01: SheetDatePicker `showTime` flow has no maskClosable drag-protection — in-progress datetime is lost on accidental dismiss

**File:** `src/Components/SheetPicker/SheetDatePicker/SheetDatePicker.tsx:151`
**Issue:** In `SheetDatePickerBase`, when `showTime` is set the picker maintains an in-progress `singleDraft` and only commits it on the "Xong" button. But the host `<Sheet>` is opened with no `maskClosable` guard:

```tsx
<Sheet open={open} onClose={() => setOpen(false)} title={title}>
```

The RangePicker sibling correctly uses `maskClosable={!dirty}` (line 303) precisely so an accidental backdrop tap or drag-dismiss "springs back" instead of discarding the draft (the documented Pitfall 2 / Phase 7 D-04 behavior). For the `showTime` single-date case there is an identical draft (`singleDraft`) that differs from the committed `value`, yet a backdrop/drag dismiss silently drops it. This contradicts the draft-protection pattern the module's own comments claim to follow.
**Fix:** Track dirtiness of `singleDraft` and gate `maskClosable` the same way RangePicker does:
```tsx
const singleDirty = showTime
    ? (singleDraft?.valueOf() ?? null) !== ((value ?? null)?.valueOf() ?? null)
    : false;
// ...
<Sheet open={open} onClose={() => setOpen(false)} title={title} maskClosable={!singleDirty}>
```

### WR-02: SheetTrigger clear control is keyboard-inoperable and is invalid interactive nesting

**File:** `src/Components/SheetPicker/shared/SheetTrigger.tsx:102-110`
**Issue:** The clear affordance is a `<span role="button" aria-label="Bỏ chọn" onClick={handleClear}>` rendered *inside* the trigger `<button>`. Two problems:
1. A `role="button"` element with an `onClick` but no `tabIndex={0}` and no `onKeyDown` (Enter/Space) handler is not reachable or operable by keyboard — clearing is mouse/touch-only.
2. Placing an interactive `role="button"` inside a real `<button>` is invalid interactive-content nesting (HTML disallows nested interactive descendants); behavior across AT/browsers is undefined.

This is part of a shared primitive consumed by all four pickers, so the defect propagates everywhere allowClear is used.
**Fix:** Make it a real, non-nested control. Simplest correct option is a sibling `<button type="button">` placed outside the trigger button, or keep it visually inside but render the trigger as a non-button container with an inner real button:
```tsx
<button type="button" aria-label="Bỏ chọn" onClick={handleClear}
        style={{ ...clearStyle, background: 'none', border: 'none', padding: 0 }}>
    <CloseCircleFilled />
</button>
```
and restructure so the clear button is not a descendant of another `<button>` (e.g. trigger row as a `<div>` with an inner open-button + clear-button).

### WR-03: SheetTrigger hardcodes `aria-expanded={false}` while advertising `aria-haspopup="dialog"`

**File:** `src/Components/SheetPicker/shared/SheetTrigger.tsx:92-94`
**Issue:** The trigger declares `aria-haspopup="dialog"` but always reports `aria-expanded={false}`, even when the sheet it controls is open. Assistive tech is told the popup is never expanded, which is incorrect. SheetTrigger has no `open`/`expanded` prop, so it cannot reflect the true state — the omission is structural.
**Fix:** Add an `expanded?: boolean` prop and pass the picker's open state through, then bind `aria-expanded={!!expanded}`. Each picker already holds `open` (e.g. `field.open`) and can forward it.

### WR-04: SheetSelect option rows use `role="option"` with no enclosing `role="listbox"`

**File:** `src/Components/SheetPicker/SheetSelect/SheetSelect.tsx:151-194`
**Issue:** The "Bỏ chọn" clear row (line 153) and each option button (line 179) carry `role="option"` / `aria-selected`, but they are rendered as direct children of the Sheet body with no ancestor `role="listbox"` (or `listbox`/`combobox` owner). An orphaned `role="option"` is invalid ARIA — screen readers will not announce these as a selectable list, and `aria-selected` has no defined meaning outside a listbox container. SheetMultiSelect avoids this by using native `<label>`+`<Checkbox>` instead.
**Fix:** Wrap the option rows in a container with `role="listbox"` (add `aria-multiselectable={false}`), or drop the `role="option"`/`aria-selected` attributes and rely on the native `<button>` semantics plus the visible checkmark.

## Info

### IN-01: Single-value pickers pull in the full draft state machine but only use `open`/`status`

**File:** `src/Components/SheetPicker/SheetSelect/SheetSelect.tsx:92`, `src/Components/SheetPicker/SheetDatePicker/SheetDatePicker.tsx:101`
**Issue:** `useSheetPickerField` owns a `draft`/`setDraft`/`commit`/`cancel`/`dirty` machine intended for the multi-select revert flow. SheetSelect and SheetDatePickerBase consume the hook but only read `open`/`setOpen`/`status`/`id`; the draft is seeded (`toArray(value)`) and re-seeded on every open for no consumer. This is harmless but obscures intent and re-runs `toArray` needlessly.
**Fix:** Either expose a lighter `useSheetOpenState({ id, status })` for single-value pickers, or document at the call site that only the open/status slice is used.

### IN-02: De-float `<style>` block is injected per-instance and defines page-global rules

**File:** `src/Components/SheetPicker/SheetDatePicker/SheetDatePicker.tsx:48-60, 152, 304`
**Issue:** `deFloatStyles` is rendered inside the Sheet body of both the single and range pickers. Mounting two SheetDatePickers injects duplicate identical `<style>` blocks, and the rules (`.sheet-date-popup.ant-picker-dropdown { position: static !important; ... }`) are page-global, so they affect any `.ant-picker-dropdown` that happens to carry the `sheet-date-popup` class anywhere in the document. It is scoped by class name so collisions are unlikely, but injecting global CSS from render is brittle. No leak was found (the class is only applied to these embedded popups), hence Info.
**Fix:** Hoist the rule to a real stylesheet (CSS/`*.css` import) loaded once, rather than rendering a `<style>` element from component output.

### IN-03: Inconsistent placeholder defaulting between SheetSelect and SheetMultiSelect

**File:** `src/Components/SheetPicker/SheetSelect/SheetSelect.tsx:129`
**Issue:** SheetSelect passes `placeholder={placeholder}` to the trigger (undefined when not supplied, so the closed trigger shows nothing), while SheetMultiSelect defaults to `placeholder ?? 'Chọn'` (line 164) and uses that default for the trigger. The sheet title in SheetSelect already falls back to `'Chọn'` (line 121) but the trigger does not, so an unconfigured SheetSelect renders an empty trigger.
**Fix:** Mirror the multi-select default: `placeholder={placeholder ?? 'Chọn'}` on the trigger.

### IN-04: Pre-existing PUBLIC_URL/basename mismatch (not introduced by this phase)

**File:** `src/Routing/RootRouter.tsx:67-77`
**Issue:** `getRouterBasename()` derives the `BrowserRouter` basename from `PUBLIC_URL` (`/my-household` per `.env`), while `playwright.config.ts` navigates against `/my-recipes/`, so route-navigating e2e specs fail to mount their fixtures. The 08-06 summary confirms this is environmental and reproduces with the pre-existing `native-sheet.spec.ts`. Flagged here only for visibility; per review scope this is treated as pre-existing, not a phase-08 defect.
**Fix:** Out of scope for this phase — align `playwright.config.ts` baseURL with `PUBLIC_URL` (or vice versa) at the orchestrator/operator level.

---

_Reviewed: 2026-06-29T08:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
