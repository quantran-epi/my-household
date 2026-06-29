# Roadmap: my-household

## Milestones

- ✅ **v1.0 UI/UX Refactor** — Phases 1-6 (shipped 2026-06-19)
- 🚧 **v1.1 Native iOS Feel** — Phases 7-11 (started 2026-06-19)

Full v1.0 details archived in [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md).

## Phases

<details>
<summary>✅ v1.0 UI/UX Refactor (Phases 1-6) — SHIPPED 2026-06-19</summary>

- [x] Phase 1: Copy Infrastructure (1/1 plan) — completed 2026-06-14
- [x] Phase 2: Shell Safety & Extraction (5/5 plans) — completed 2026-06-15
- [x] Phase 3: Wizard State Slice (3/3 plans) — completed 2026-06-16
- [x] Phase 4: Wizard UI & Hero Entry (6/6 plans) — completed 2026-06-16
- [x] Phase 5: Mobile Tuning & Copy Rollout (7/7 plans) — completed 2026-06-17
- [x] Phase 6: Differentiator Enhancements (5/5 plans) — completed 2026-06-19

</details>

### 🚧 v1.1 Native iOS Feel (Phases 7-11)

**Goal:** Convert every dropdown/combobox/datepicker into a gesture-driven, safe-area-aware bottom-sheet picker and apply a cohesive iOS-flavored, thumb-friendly visual baseline across the app.

#### Phase 7: Native Sheet Foundation

**Goal:** Upgrade the existing `@components/Sheet` (FastOverlay) into a native-feeling iOS sheet — grabber, drag-to-dismiss, scroll/drag disambiguation, snap detents, safe-area — with no call-site changes yet.

**Requirements:** SHEET-01, SHEET-02, SHEET-03, SHEET-04, SHEET-05, SHEET-06

**Success criteria:**

1. Every bottom sheet shows a grabber handle and can be dragged down to dismiss, backdrop dimming with the drag.
2. Dragging a scrolled list scrolls it; the sheet only drags-to-dismiss when the content is at the top (no scroll/drag conflict on iOS Safari).
3. Sheets snap to medium/full detents and respect safe-area + `dvh` so nothing clips under the iOS toolbar or home indicator.
4. A sheet opened from inside another sheet stacks above it and dismisses independently.

#### Phase 8: Sheet-Picker Component Layer

**Goal:** Build the reusable `@components/SheetPicker` layer (SheetSelect, SheetMultiSelect, SheetDatePicker, SheetActionMenu) on the upgraded Sheet base, each AntD-Form-bindable, with full behavior parity — before any mass migration.

**Requirements:** PICK-01, PICK-02, PICK-03, PICK-04, PICK-05, PICK-06, PICK-07, PICK-08

**Success criteria:**

1. SheetSelect (tap→check→dismiss, search, clear) and SheetMultiSelect (checkbox rows, "Xong" commit, count, cancel-reverts) work in isolation with tests.
2. SheetDatePicker hosts an in-sheet calendar, keeps a `Dayjs` value, and honors min/max, time, range, and a "Hôm nay" shortcut.
3. SheetActionMenu renders full-width rows, red destructive actions, and a separate "Hủy".
4. All four pickers bind to AntD `Form` (value/onChange/id/status) so a Form submit validates and collects their values unchanged.

#### Phase 9: iOS Visual Baseline & Safe-Area Shell

**Goal:** Define and apply a lightweight iOS token baseline and a `viewport-fit=cover` safe-area shell so the picker layer and app chrome read as native and thumb-friendly app-wide.

**Requirements:** IOS-01, IOS-02, IOS-03

**Success criteria:**

1. An iOS token baseline (spacing, radius, type scale, sheet surface) exists and the sheet-picker layer renders from it.
2. The shell sets `viewport-fit=cover` and sticky bottom chrome (nav, CTAs) clears the home indicator on a notched iOS device.
3. Converted picker triggers and sheet rows meet the ≥44px thumb-zone bar.

#### Phase 10: High-Traffic Screen Conversion

**Goal:** Migrate the high-traffic user-facing screens (wizard, Home, ScheduledMeal, ShoppingList) onto the sheet pickers, whole-screen at a time, with no capability loss.

**Requirements:** CONV-04 (high-traffic portion), plus the high-traffic share of CONV-01, CONV-02, CONV-03

**Success criteria:**

1. Every Select/DatePicker/Dropdown on the wizard, Home, ScheduledMeal, and ShoppingList screens is a sheet picker.
2. No high-traffic screen has a mixed old-popup / new-sheet stack.
3. Search, multi-select, date range, and clear behaviors that existed on these screens still work (per-screen UAT vs original).

#### Phase 11: Long-Tail Conversion & Wrapper Removal

**Goal:** Convert the remaining picker sites (Dishes, Ingredient, DishSuggester, admin/backup/settings), then remove the old AntD picker wrappers and their z-index hacks for a clean end state.

**Requirements:** CONV-01 (remainder), CONV-02 (remainder), CONV-03 (remainder), CONV-05

**Success criteria:**

1. No source file imports the old `Form/Select` or `Form/DatePicker` AntD wrappers; all picker sites are sheet pickers.
2. The `z-index: 4200` popup hacks and dead wrapper code are removed.
3. A full app pass confirms no remaining `<Select>`/`<DatePicker>`/`<Dropdown>` renders a legacy popover.

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Copy Infrastructure | v1.0 | 1/1 | Complete | 2026-06-14 |
| 2. Shell Safety & Extraction | v1.0 | 5/5 | Complete | 2026-06-15 |
| 3. Wizard State Slice | v1.0 | 3/3 | Complete | 2026-06-16 |
| 4. Wizard UI & Hero Entry | v1.0 | 6/6 | Complete | 2026-06-16 |
| 5. Mobile Tuning & Copy Rollout | v1.0 | 7/7 | Complete | 2026-06-17 |
| 6. Differentiator Enhancements | v1.0 | 5/5 | Complete | 2026-06-19 |
| 7. Native Sheet Foundation | v1.1 | 3/3 | Complete   | 2026-06-29 |
| 8. Sheet-Picker Component Layer | v1.1 | 0/— | Not started | — |
| 9. iOS Visual Baseline & Safe-Area Shell | v1.1 | 0/— | Not started | — |
| 10. High-Traffic Screen Conversion | v1.1 | 0/— | Not started | — |
| 11. Long-Tail Conversion & Wrapper Removal | v1.1 | 0/— | Not started | — |
