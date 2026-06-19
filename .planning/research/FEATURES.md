# Feature Research

**Domain:** Native iOS bottom-sheet picker & action-sheet behaviors for a phone-first React PWA
**Researched:** 2026-06-19
**Confidence:** HIGH (iOS HIG patterns + existing Sheet primitive verified)

> **Scope note.** Every item is an *interaction behavior* the new picker layer (SheetSelect / SheetMultiSelect / SheetDatePicker / SheetActionMenu) must replicate to feel native. These replace ~80 `<Select`, ~23 `<DatePicker`, ~15 `<Dropdown` sites. The existing `@components/Sheet` already gives: bottom-anchored panel, backdrop + tap-to-dismiss (`maskClosable`), body-scroll-lock, escape-close, 18px top radius, z-index stacking. It does NOT yet have: grabber handle, drag-to-dismiss, snap/detent points, safe-area padding. OUT OF SCOPE per milestone: haptics, spring-physics motion, full system-aesthetic reskin.

## Feature Categories

### 1. Single-select sheet (`SheetSelect`)

| Behavior | Classification | Complexity | Notes |
|----------|---------------|------------|-------|
| Tap a row → select → auto-dismiss | TABLE STAKES | Low | The iOS idiom for single choice: no separate confirm. Emit `onChange(value)` then `onClose()` |
| Selected row shows a trailing checkmark | TABLE STAKES | Low | iOS uses a leading/trailing check, not a radio |
| Current value highlighted on open + scrolled into view | TABLE STAKES | Low | `scrollIntoView` the selected row |
| Search/filter field for long option lists | TABLE STAKES (for long lists) | Med | Many of the ~80 Selects have `showSearch`; preserve it. Sticky search at sheet top |
| Row min-height ≥44px, full-width tap target | TABLE STAKES | Low | Already the v1.0 thumb-zone bar |
| Disabled options shown dimmed, non-tappable | TABLE STAKES | Low | Map AntD `option.disabled` |
| Grouped options (section headers) | DIFFERENTIATOR | Med | AntD `OptGroup` exists in some selects; render as sticky group labels |
| Clearable ("Bỏ chọn" / none row) | DIFFERENTIATOR | Low | Mirror AntD `allowClear` |
| Virtualized list for very long option sets | DIFFERENTIATOR | Med | `react-window@2.2.7` already installed; use only if a list is >~100 rows |

### 2. Multi-select sheet (`SheetMultiSelect`)

| Behavior | Classification | Complexity | Notes |
|----------|---------------|------------|-------|
| Checkbox/check rows, tap toggles without dismissing | TABLE STAKES | Low | Differs from single: sheet STAYS open |
| Explicit "Xong" (Done) confirm to commit + dismiss | TABLE STAKES | Low | iOS multi-select commits on Done, not per-tap |
| Running count of selected ("Đã chọn (3)") in header | TABLE STAKES | Low | The existing Select wrapper already renders a "Đã chọn (n)" panel — reuse the idea |
| Cancel discards changes (revert to value-on-open) | TABLE STAKES | Med | Keep a draft array; only emit `onChange` on Done |
| Search/filter for long lists | TABLE STAKES (long lists) | Med | Preserve `showSearch` from `mode="multiple"/"tags"` |
| Select-all / Clear-all affordance | DIFFERENTIATOR | Low | Useful for tag pickers |
| "tags" mode: create a new free-text value | DIFFERENTIATOR | Med | A subset of Selects use `mode="tags"`; support add-new or document deferral |

### 3. Date/time picker sheet (`SheetDatePicker`)

| Behavior | Classification | Complexity | Notes |
|----------|---------------|------------|-------|
| Calendar/wheel hosted IN the bottom sheet, not a popover | TABLE STAKES | Med | Render AntD inline calendar inside the sheet body (Dayjs value) |
| Value type stays `Dayjs` (drop-in for AntD DatePicker) | TABLE STAKES | Med | Critical — see PITFALLS value-type section |
| Confirm/"Xong" + Cancel (or tap-day-to-commit) | TABLE STAKES | Low | Day-tap-commits for date; Done for datetime |
| min/max date constraints preserved | TABLE STAKES | Low | Map AntD `disabledDate` |
| "Hôm nay" (Today) shortcut | DIFFERENTIATOR | Low | Common iOS convenience |
| Time selection (hour/minute) where the site needs it | TABLE STAKES (where used) | Med | Only the sites that pass `showTime`; most are date-only |
| Range selection (RangePicker) | DIFFERENTIATOR / DEFER | High | A few sites use `RangePicker`; can stay AntD initially and convert last |

### 4. Action menu / iOS action sheet (`SheetActionMenu`)

| Behavior | Classification | Complexity | Notes |
|----------|---------------|------------|-------|
| Vertical list of action rows, each full-width ≥44px | TABLE STAKES | Low | Replaces `<Dropdown>` overflow menus |
| Destructive action styled red ("Xóa") | TABLE STAKES | Low | iOS destructive idiom; map a `danger` flag |
| Cancel as a SEPARATE, visually-detached button | TABLE STAKES | Low | iOS groups Cancel apart from the action list |
| Optional leading icon per action | DIFFERENTIATOR | Low | Many Dropdowns already carry icons |
| Optional title/subtitle context header | DIFFERENTIATOR | Low | "What does this menu act on?" |
| Disabled actions dimmed | TABLE STAKES | Low | Map `disabled` |

### 5. Cross-cutting sheet behaviors (shared base, applies to all four)

| Behavior | Classification | Complexity | Notes |
|----------|---------------|------------|-------|
| Grabber handle (pill) at top of sheet | TABLE STAKES | Low | The single biggest "looks native" signal; add to the Sheet base |
| Drag-down-to-dismiss | TABLE STAKES | Med | Pointer events on the header/grabber; translateY follows finger, release past threshold → close |
| Backdrop tap-to-dismiss + dimming | DONE (exists) | — | `maskClosable` + `rgba` backdrop already in Sheet |
| Safe-area bottom padding (home indicator) | TABLE STAKES | Low | `padding-bottom: env(safe-area-inset-bottom)`; sticky CTAs must clear it |
| Scroll-within-sheet vs drag-the-sheet disambiguation | TABLE STAKES | High | Hardest behavior: only start sheet-drag when content scroll is at top. The known iOS-Safari trap (see PITFALLS) |
| Snap/detent points (medium vs large height) | DIFFERENTIATOR | High | iOS sheets snap to ~half then full. Nice-to-have; tap-pickers work fine at one height |
| Sticky header: title + Cancel/Done | TABLE STAKES | Low | Sheet already has a header row with a close button; extend with Done |
| Rounded top corners | DONE (exists) | — | 18px radius already in Sheet |
| `prefers-reduced-motion` respect | TABLE STAKES | Low | FastOverlay already honors it |
| Focus management / keyboard for search field | TABLE STAKES | Med | Focus search on open; avoid iOS keyboard shoving the sheet (PITFALLS) |

## What "done" looks like (per milestone goal)

- All four picker components exist, are Form-bindable (`value`/`onChange`), and carry grabber + drag-to-dismiss + safe-area padding from the shared Sheet base.
- All ~118 picker sites are converted with no lost capability (search, multiple/tags mode, min/max dates, clear).
- The app reads as "native iOS phone app," not "web admin tool with dropdowns."

## Anti-features (explicitly skip this milestone)

| Skip | Why |
|------|-----|
| Haptic feedback on selection | Out of scope (haptics deferred); PWA haptic support on iOS is unreliable anyway |
| Spring/inertia physics on drag | Out of scope (motion polish deferred); a linear translate + threshold close is enough |
| iOS system font stack / segmented controls / inset-grouped tables | Out of scope (full reskin deferred); v1.1 defines only lightweight tokens |
| Multi-detent snap as a hard requirement | Differentiator, not table stakes; single-height sheets are acceptable |

## Sources

- Apple HIG — Sheets, Pickers, Action Sheets (interaction idioms)
- `src/Components/FastOverlay/FastOverlay.tsx` — what the Sheet base already provides vs what's missing (HIGH)
- `src/Components/Form/Select/Select.tsx` — existing "Đã chọn (n)" multi-select panel, showSearch/tags usage (HIGH)
- `src/Modules/` — picker usage patterns (ScheduledMeal dates, dish/ingredient category selects, tag multi-selects, overflow Dropdowns)

---
*Feature research for: native iOS sheet-picker behaviors*
*Researched: 2026-06-19*
