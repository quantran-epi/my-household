---
phase: 09-ios-visual-baseline-safe-area-shell
reviewed: 2026-06-30T08:49:27Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - src/App.tsx
  - src/Components/FastOverlay/FastOverlay.tsx
  - src/Components/Layout/Content/Content.tsx
  - src/Components/Layout/Content/Content.test.tsx
  - src/Components/SheetPicker/SheetSelect/SheetSelect.tsx
  - src/Components/SheetPicker/shared/SheetTrigger.tsx
  - src/Components/SheetPicker/shared/SheetTrigger.test.tsx
  - src/Routing/Shell/BottomTabNavigator.tsx
  - src/Routing/Shell/CookingPill.tsx
  - src/Theme/index.ts
  - src/Theme/iosTokens.ts
  - src/Theme/iosTokens.test.ts
  - src/Theme/safeArea.ts
  - tests/e2e/cooking-pill.spec.ts
  - tests/e2e/sheet-picker.spec.ts
findings:
  critical: 1
  warning: 2
  info: 3
  total: 6
status: issues_found
---

# Phase 9: Code Review Report

**Reviewed:** 2026-06-30T08:49:27Z
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

This phase promotes scattered Phase 7/8 style literals into `iosTokens`/`safeAreaInset` and rebuilds the safe-area shell math (Content height cascade, bottom-nav inset, cooking-pill clearance). The token promotion and the `Content` vh→dvh cascade are sound and well guarded by unit tests.

The defect is in the bottom-nav clearance geometry. The cooking pill and the `Content` chrome reservation both key off `iosTokens.layout.bottomNavHeight` (80), but the nav chrome actually renders at `iosTokens.layout.bottomNavContainerMinHeight` (88). This 8px under-reservation makes the phase's own shipped regression test (`cooking-pill.spec.ts` → "the floating pill clears the bottom nav") fail: the pill's bottom edge lands ~7-8px below the nav container's top edge, the opposite of what the test asserts.

## Critical Issues

### CR-01: Cooking pill does not clear the bottom nav — its own e2e regression test fails

**File:** `src/Routing/Shell/CookingPill.tsx:58`
**Issue:**
The pill is positioned with
```
bottom: safeAreaInset.bottom(iosTokens.layout.bottomNavHeight)  // calc(80px + env(safe-area-inset-bottom))
```
so its bottom edge sits `80 + inset` from the viewport bottom.

The nav container (`BottomTabNavigator.tsx:30-45`, `data-testid="bottom-tab-navigator"`) renders with `position: fixed; bottom: 0`, `minHeight: 88` (`bottomNavContainerMinHeight`), `box-sizing: border-box`, and `padding: 16px 10px calc(8px + inset)`. Its rendered border-box height is `max(88, 16 + 64 + (8 + inset)) = 88 + inset`, so its top edge sits `88 + inset` from the viewport bottom — i.e. `getBoundingClientRect()` returns `navBox.y = H - (88 + inset)` (overflowing/absolute children like the center bump do not expand the box).

`cooking-pill.spec.ts:40` asserts:
```ts
expect(pillBox!.y + pillBox!.height).toBeLessThanOrEqual(navBox!.y + 1);
```
With Playwright's iPhone 13 descriptor, `env(safe-area-inset-bottom)` resolves to 0, so:
- pill bottom edge = `H - 80`
- nav top edge   = `H - 88`

`H - 80 <= (H - 88) + 1` → `-80 <= -87` → **false**. The pill's bottom edge is ~7px below the nav container's top edge; the test fails and the IOS-02 "no overlap" guarantee this phase ships is not met.

(Note: the pill does visually clear the *visible dock* — the dock's top sits at `72 + inset` from the bottom because of the container's 16px top padding — but the regression test measures the container box, which is what the phase's acceptance criterion targets.)

**Fix:** Base the pill offset on the value that reflects the container's true footprint so it actually clears the chrome the test measures:
```tsx
// CookingPill.tsx:58
bottom: safeAreaInset.bottom(iosTokens.layout.bottomNavContainerMinHeight),
```
(Alternatively, if the intent is to clear only the visible dock, the test must measure a dock element rather than the `bottom-tab-navigator` container, and the 80/88 layout constants must be documented as dock-vs-container. Either way the current pairing fails.)

## Warnings

### WR-01: Content reserves only `bottomNavHeight` (80) for a nav chrome that occupies 88px

**File:** `src/Components/Layout/Content/Content.tsx:9,17-20`
**Issue:**
```ts
const chrome = iosTokens.layout.headerHeight + iosTokens.layout.bottomNavHeight; // 76 + 80 = 156
```
The scrollable content box height subtracts 80 for the bottom nav, but the nav container renders at 88 (`bottomNavContainerMinHeight`, see CR-01). The content box's bottom edge therefore ends ~8px below the nav container's top edge, so the final ~8px of scrollable content underlaps the nav container's (transparent, `pointerEvents: none`) top-padding band. This is the same root-cause inconsistency as CR-01: three different "bottom nav" magnitudes (`bottomNavHeight` 80, `bottomNavContainerMinHeight` 88, effective dock top ~72) are mixed across `CookingPill`, `Content`, and `BottomTabNavigator` with no single source of truth for "how much vertical space the nav chrome consumes."
**Fix:** Decide on one canonical "nav footprint" token and use it for both the pill offset and the content chrome reservation. If the content reservation is intentionally the dock height rather than the container height, add a comment documenting why `Content` and `CookingPill` may key off different constants, so the divergence is not read as a copy/paste slip.

### WR-02: SheetTrigger nests an interactive control inside a `<button>`

**File:** `src/Components/SheetPicker/shared/SheetTrigger.tsx:101-110`
**Issue:** The clear affordance is a `<span role="button" aria-label="Bỏ chọn" onClick=...>` rendered as a child of the outer `<button>` (lines 86-115). A `<button>` may not contain interactive descendants per the HTML content model; nesting an ARIA `button` inside a real `button` produces invalid markup and is unreliable for assistive technology and keyboard users (the inner control is not natively focusable and screen readers may not expose it as a separate action). The jsdom/Playwright tests pass because they dispatch a click directly on the element, which masks the real-AT problem.
**Fix:** Render the trigger surface as a non-button container (e.g. a `div role="button"` with `tabIndex`/keyboard handlers, or a flex row) that holds two sibling real `<button>`s — one to open, one to clear — so neither interactive control is nested inside the other. Keep the existing `stopPropagation` so clear does not open the sheet.

## Info

### IN-01: `aria-expanded` is hardcoded `false` on a popup trigger

**File:** `src/Components/SheetPicker/shared/SheetTrigger.tsx:91-92`
**Issue:** The trigger declares `aria-haspopup="dialog"` but `aria-expanded={false}` is a constant — it never becomes `true` while the sheet is open, so AT users get no state feedback on the control that owns the dialog. `SheetTrigger` is stateless about open state today (the owning picker holds it).
**Fix:** Thread the open state down (e.g. an `expanded?: boolean` prop set from `SheetSelect`/`useSheetPickerField`) and bind `aria-expanded={!!expanded}`.

### IN-02: Duplicate, divergent clear logic in SheetSelect

**File:** `src/Components/SheetPicker/SheetSelect/SheetSelect.tsx:115-118,131`
**Issue:** `handleClear` (clears value and calls `setOpen(false)`) is used only by the in-sheet "Bỏ chọn" row (line 154), while the trigger's `onClear` is wired to an inline `() => onChange?.(undefined)` (line 131) that intentionally omits `setOpen(false)`. Two near-identical handlers with a subtle behavioral difference invite future drift.
**Fix:** Keep one helper that takes the close behavior as a parameter, or comment why the trigger clear must not touch `open` (it fires only while the sheet is closed), to make the asymmetry deliberate rather than accidental.

### IN-03: Content bypasses the stated single safe-area convention

**File:** `src/Components/Layout/Content/Content.tsx:17-20`
**Issue:** `safeArea.ts` documents "ONE convention for all sticky chrome," but `Content` writes raw `env(safe-area-inset-top/bottom)` into its CSS string instead of using `safeAreaInset`. This is reasonable (the helper only composes a single-inset `calc(base + env())` and cannot express the two-inset subtraction), but it quietly contradicts the helper's "one convention" docstring.
**Fix:** Either extend `safeAreaInset` with a helper that fits the Content subtraction case, or soften the `safeArea.ts` docstring to acknowledge that multi-inset `calc()` subtraction is expected to inline `env()` directly.

---

_Reviewed: 2026-06-30T08:49:27Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
