# Requirements: my-household — Milestone v1.1 Native iOS Feel

**Defined:** 2026-06-19
**Core Value:** A local Vietnamese household member can open the app and go from "what do we eat?" to a planned meal quickly, in familiar language, without it feeling like an admin tool.
**Milestone goal:** Make the whole app feel like a native iOS app — every dropdown/combobox/datepicker becomes a gesture-driven bottom-sheet picker, with thumb-zone, safe-area-aware sheets and cohesive iOS-flavored visual polish.

## v1.1 Requirements

### SHEET — Native sheet base (extend `@components/Sheet` / FastOverlay)

- [ ] **SHEET-01**: User sees a grabber handle at the top of every bottom sheet
- [ ] **SHEET-02**: User can drag a sheet down to dismiss it, with the backdrop dimming as it moves
- [x] **SHEET-03**: Dragging within a sheet scrolls its content; the sheet only drags-to-dismiss when its content is scrolled to the top (no scroll/drag conflict)
- [x] **SHEET-04**: Sheets snap to detent points (e.g. medium then full height) rather than a single fixed height — *scope reduced to dismiss-only per Phase 7 D-01 (content-height + `dvh` cap, no multi-detent state machine); accepted via verification override*
- [x] **SHEET-05**: Sheet content and sticky actions respect the iOS safe area (home indicator) and full-height sheets use `dvh` so nothing hides under the Safari toolbar
- [x] **SHEET-06**: A sheet opened from within another sheet stacks above it and dismisses independently (nested-sheet z-index correct)

### PICK — Reusable sheet-picker layer (`@components/SheetPicker`)

- [ ] **PICK-01**: User picks a single option from a `SheetSelect` — tapping a row selects it, shows a checkmark, and dismisses the sheet
- [ ] **PICK-02**: `SheetSelect` supports search/filter for long option lists and an optional clear ("bỏ chọn") affordance
- [ ] **PICK-03**: User picks multiple options from a `SheetMultiSelect` with checkbox rows; the sheet stays open and commits on "Xong", showing a selected count
- [ ] **PICK-04**: Cancelling a `SheetMultiSelect` reverts to the values it had when opened (draft is discarded)
- [ ] **PICK-05**: User picks a date from a `SheetDatePicker` hosting an in-sheet calendar; the value stays a `Dayjs` and min/max constraints + a "Hôm nay" shortcut are honored
- [ ] **PICK-06**: `SheetDatePicker` supports time selection where the original site required it (`showTime`) and date-range selection (RangePicker replacement)
- [ ] **PICK-07**: User triggers actions from a `SheetActionMenu` — full-width action rows, destructive actions styled red, and a separate "Hủy" (Cancel) button
- [ ] **PICK-08**: All sheet pickers bind to AntD `Form` (via `value`/`onChange`/`id`/`status`) so existing form validation keeps working unchanged

### IOS — iOS visual baseline & thumb-zone layout

- [ ] **IOS-01**: A lightweight iOS token baseline (spacing, corner radius, type scale, sheet surface) is defined and applied to the sheet-picker layer
- [ ] **IOS-02**: The app shell sets `viewport-fit=cover` and applies safe-area insets so sticky bottom chrome (nav, CTAs) clears the home indicator app-wide
- [ ] **IOS-03**: Every converted picker trigger and sheet row meets the ≥44px thumb-zone touch-target bar

### CONV — App-wide picker conversion

- [ ] **CONV-01**: All `<Select>` sites (single, multiple, tags) are converted to `SheetSelect`/`SheetMultiSelect` with no lost capability (search, multi, clear, grouped options)
- [ ] **CONV-02**: All `<DatePicker>` sites (date, datetime, range) are converted to `SheetDatePicker` preserving the exact `Dayjs` value type each call site expects
- [ ] **CONV-03**: All `<Dropdown>` overflow/action menus are converted to `SheetActionMenu`
- [ ] **CONV-04**: Conversion proceeds whole-screen at a time (no screen left with a mixed old-popup / new-sheet stack), high-traffic screens first
- [ ] **CONV-05**: After all sites migrate, the old AntD `Select`/`DatePicker` wrappers and their `z-index: 4200` popup hacks are removed

## Future Requirements (deferred)

### Motion & feel

- **MOTION-01**: Haptic feedback on selection (where PWA/iOS permits)
- **MOTION-02**: Spring/inertia physics on sheet drag and inter-screen transitions

### Full iOS aesthetic

- **AESTH-01**: iOS system font stack
- **AESTH-02**: iOS-style segmented controls and toggles
- **AESTH-03**: Inset-grouped table/list styling app-wide

## Out of Scope

| Feature | Reason |
|---------|--------|
| Haptics & spring-motion transitions | Deferred to keep v1.1 focused on the sheet-picker conversion + layout, not motion polish |
| Full iOS system-aesthetic reskin (system fonts, segmented controls, inset-grouped tables) | v1.1 defines a lightweight token baseline only, not a wholesale visual-language swap |
| Migrating `moment` → `dayjs` | Cross-cutting change unrelated to pickers; DateHelper stays on moment, new pickers speak Dayjs and convert at the boundary |
| New picker/animation runtime dependency (vaul, framer-motion, date-wheel lib) | Research: the existing Sheet + React pointer events + CSS cover the need; bundle size is a PWA constraint |
| The 10 v1.0 deferred items (debug sessions, UAT/verification gaps) | Acknowledged tech debt carried from v1.0 close; not part of this milestone's definition of done |
| Backend / accounts / non-Vietnamese locale / tech-stack replacement | Standing project out-of-scope (local-first, Vietnamese, React+RTK+AntD) |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SHEET-01 | Phase 7 | Pending |
| SHEET-02 | Phase 7 | Pending |
| SHEET-03 | Phase 7 | Complete |
| SHEET-04 | Phase 7 | Complete (override: dismiss-only per D-01) |
| SHEET-05 | Phase 7 | Complete |
| SHEET-06 | Phase 7 | Complete |
| PICK-01 | Phase 8 | Pending |
| PICK-02 | Phase 8 | Pending |
| PICK-03 | Phase 8 | Pending |
| PICK-04 | Phase 8 | Pending |
| PICK-05 | Phase 8 | Pending |
| PICK-06 | Phase 8 | Pending |
| PICK-07 | Phase 8 | Pending |
| PICK-08 | Phase 8 | Pending |
| IOS-01 | Phase 9 | Pending |
| IOS-02 | Phase 9 | Pending |
| IOS-03 | Phase 9 | Pending |
| CONV-01 | Phase 10 & 11 | Pending |
| CONV-02 | Phase 10 & 11 | Pending |
| CONV-03 | Phase 10 & 11 | Pending |
| CONV-04 | Phase 10 | Pending |
| CONV-05 | Phase 11 | Pending |

**Coverage:**

- v1.1 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-19*
*Last updated: 2026-06-19 at milestone v1.1 start*
