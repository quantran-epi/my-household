# Phase 8: Sheet-Picker Component Layer - Research

**Researched:** 2026-06-29
**Domain:** React 18 + AntD 5 controlled form-bound components hosted inside a portal'd native bottom sheet
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**API shape & conversion strategy**
- **D-01:** Each picker mirrors the **existing AntD wrapper prop API** (`Form/Select`, `Form/DatePicker`) as closely as possible — `value`/`onChange`/`options`/`mode`/`showSearch`/`allowClear`/`placeholder`/`disabled` for selects; `value`/`onChange`/`picker`/`showTime`/`disabledDate`/`format` for dates; `RangePicker` as a sub-export. Rationale: Phases 10-11 convert ~80 Select + 17 DatePicker + 17 Dropdown sites. A prop-compatible surface turns most conversions into near drop-in import swaps instead of per-site rewrites. Do NOT invent a novel picker API.
- **D-02:** Accept and respect the props AntD `Form.Item` injects when it clones its child — `value`, `onChange`, `id`, and `status` (`'error' | 'warning'`). The trigger renders the AntD error ring/aria when `status==='error'` so existing `Form` validation rules keep working with zero rule changes (PICK-08). Each picker is a **controlled** component (reads `value`, emits via `onChange`); it holds no committed state of its own.

**Trigger element**
- **D-03:** Render a **dedicated trigger** styled to match the current AntD input box (same height, border, radius, placeholder/value text, clear "×" affordance, disabled look), NOT the live AntD `<Select>`/`<DatePicker>` with its popup suppressed. Tapping the trigger opens the sheet; the trigger is the focus-return target the Sheet restores to on close.
- **D-04:** Closed-state trigger shows the **selected value's label** (single), a **count + first label / "N đã chọn"** (multi), or the **formatted date / range** (date), and the localized placeholder when empty — matching what each AntD control shows today.

**Selection & commit semantics**
- **D-05:** **SheetSelect** = tap a row → checkmark on that row → sheet auto-dismisses and commits immediately (PICK-01). `allowClear` renders a "Bỏ chọn" row/affordance that sets value to `undefined` and dismisses (PICK-02).
- **D-06:** **SheetMultiSelect** = checkbox rows, sheet **stays open**, edits a local **draft**; a sticky bottom **"Xong (N)"** primary button commits the draft via `onChange` and dismisses; **"Hủy"** (or drag/backdrop dismiss) **reverts** to the value the sheet had on open — the draft is discarded (PICK-03, PICK-04). Use the Phase 7 `SheetActions` row for the sticky Xong/Hủy footer.
- **D-07:** **Search** (`showSearch`) auto-appears for long lists; default to showing the in-sheet search/filter field when option count is large (threshold ~8-10, Claude's discretion) and always when a site passes `showSearch`. Filter is client-side over option labels, diacritic-insensitive where practical for Vietnamese.

**SheetDatePicker engine**
- **D-08:** **Host AntD's own calendar panel inside the sheet** rather than hand-rolling a calendar grid. Rationale: lowest parity risk — `disabledDate` (min/max), `showTime`, range selection, and locale/`viVN` month-week rendering all come from AntD already in use. Value stays a **`Dayjs`** (PICK-05). Time selection (`showTime`, PICK-06) and date-range (RangePicker replacement, PICK-06) are hosted in the same sheet.
- **D-09:** A **"Hôm nay"** quick-action sits as a prominent row/button in the date sheet, setting the value to today (clamped to min/max) (PICK-05). For range mode, the sheet commits on a "Xong" action like multi-select (start+end chosen) rather than auto-dismiss, so a half-picked range can't escape.

**SheetActionMenu layout**
- **D-10:** **iOS grouped action-sheet** styling: action rows grouped in one rounded surface, **full-width** tappable rows, **destructive actions in red** (PICK-07), an optional leading icon per row, and **"Hủy" as a separate, visually detached button below the group** (gap between the action card and Cancel).

**Packaging & tests**
- **D-11:** Live under `src/Components/SheetPicker/` — one folder per picker (`SheetSelect/`, `SheetMultiSelect/`, `SheetDatePicker/`, `SheetActionMenu/`) each with co-located `*.test.tsx`, plus a barrel `index.ts` exported as `@components/SheetPicker` (mirrors the existing `@components/Sheet` barrel pattern). New alias `@components/SheetPicker` resolves through the existing `@components/*` mapping — no craco/tsconfig change needed.
- **D-12:** Test each picker **in isolation** (no real site): jsdom unit tests for selection/search/draft-commit-revert/Hôm-nay/destructive-styling, plus a **Form-binding test** that wraps each picker in an AntD `<Form>` and asserts a submit validates and collects the picker's value unchanged (PICK-08). Follow the Phase 7 pattern — pure logic in units; a touch e2e (reusing the Phase 7 touch-capable Playwright project) proves tap-to-commit and Xong/Hủy on a real gesture.

### Claude's Discretion
- Exact search-field appearance threshold, row height (will be ≥44px per IOS-03 in Phase 9 but Phase 8 should already build to that bar), checkmark/checkbox iconography, "Xong"/"Hủy"/"Hôm nay"/"Bỏ chọn" exact copy (Vietnamese, friendly-familiar tone), and how AntD's calendar panel is embedded (inline panel render vs `getPopupContainer` into the sheet body) are Claude's call — match the Phase 7 sheet aesthetic (purple-tinted surface `linear-gradient(180deg,#f5f0ff 0%,#ffffff 42%)`, 18px top radius, `cubic-bezier(0.16,1,0.3,1)` ease, primary `#7436dc`).

### Deferred Ideas (OUT OF SCOPE)
- **Migrating real picker sites** (wizard, Home, ScheduledMeal, ShoppingList, Dishes, Ingredient, admin) — Phases 10-11. Phase 8 only builds + tests the layer in isolation.
- **iOS token baseline + app-shell `viewport-fit=cover` safe-area + ≥44px audit** — Phase 9 (IOS-01..03). Phase 8 builds to the thumb-zone bar but the cohesive token system is Phase 9's.
- **Removing old AntD `Form/Select` + `Form/DatePicker` wrappers and `z-index:4200` popup hacks** — Phase 11 (CONV-05). They must keep working in parallel until every site is converted.
- **Multi-detent snapping / haptics / spring physics** — out of v1.1. Pickers use the dismiss-only Sheet as-is.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PICK-01 | Single-select: tap row → checkmark → dismiss + commit | §Pattern 1 (controlled child) + §Pattern 2 (option rows + auto-dismiss). Sheet's `onClose` + focus-return already exist in `FastOverlay.tsx`. |
| PICK-02 | `SheetSelect` search/filter for long lists + optional "bỏ chọn" clear | §Pattern 4 (diacritic-insensitive filter), §Don't Hand-Roll (use AntD `Input`). `allowClear` → "Bỏ chọn" row emits `onChange(undefined)`. |
| PICK-03 | `SheetMultiSelect` checkbox rows, stays open, commits on "Xong", shows count | §Pattern 3 (draft state machine). AntD `Checkbox` rows; commit via `onChange(draft)`; `SheetActions` footer for Xong/Hủy. |
| PICK-04 | Cancelling `SheetMultiSelect` reverts to values-on-open | §Pattern 3 — draft seeded from `value` on open; Hủy/dismiss discards draft, never calls `onChange`. `maskClosable={false}` while dirty (Phase 7 D-04). |
| PICK-05 | `SheetDatePicker` in-sheet calendar, `Dayjs` value, min/max + "Hôm nay" | §Pattern 5 (embed AntD panel via `getPopupContainer` into sheet body). `disabledDate` for min/max; "Hôm nay" sets `dayjs()` clamped. |
| PICK-06 | `showTime` + date-range (RangePicker replacement) | §Pattern 5 — same embedding hosts `showTime` footer and `RangePicker`; range commits on "Xong" (D-09). |
| PICK-07 | `SheetActionMenu` full-width rows, destructive red, separate "Hủy" | §Pattern 6 (grouped action sheet). Pure rendering + `onClick` dispatch; `danger` flag → red. |
| PICK-08 | All pickers bind to AntD `Form` via `value`/`onChange`/`id`/`status` | §Pattern 1 + §Architecture (Form.Item child-cloning). Verified: `SmartFormItem` is a thin pass-through to `AntForm.Item`. Form-binding test per picker (D-12). |
</phase_requirements>

## Summary

Phase 8 builds four controlled, AntD-`Form`-bindable picker components on top of the Phase 7 native `<Sheet>`. The work is **pure React + AntD composition — zero new runtime dependencies** (locked by `.planning/research/SUMMARY.md` and CONTEXT Deferred Ideas). Every hard part the pickers need already exists in the codebase: the `Sheet` host (grabber, drag-to-dismiss, safe-area, focus trap, z-index stacking, `maskClosable`), the `SheetActions` sticky row, AntD `Checkbox`/`Input`/`DatePicker`/`Calendar`, and the `viVN` + `dayjs.locale('vi')` config wired once in `App.tsx`.

The single highest-leverage finding is the **Form binding mechanism (PICK-08)**: AntD `Form.Item` clones its single child and injects `value`, `onChange`, `id`, and `status`. A component that (a) reads `value` from props, (b) emits via `onChange`, (c) forwards `id` to its trigger, and (d) renders an error ring when `status === 'error'` is automatically form-bound with no rule changes. This is verified in-repo: `src/Components/SmartForm/SmartFormItem/SmartFormItem.tsx` is a thin pass-through to `AntForm.Item`, and `SmartFormItem.types.ts` re-exports `useStatus`. The pickers must be controlled — they hold no committed state except the multi-select/range **draft**, which is local-only and discarded on cancel.

The second key finding is the **calendar-embedding approach (D-08)**. The recommended, lowest-risk path is to render AntD's own `<DatePicker>`/`<RangePicker>` with `open` forced true and `getPopupContainer` pointing at the sheet body element, so AntD's real panel (with `disabledDate`, `showTime`, range, `viVN` locale all intact) mounts inside the sheet. This is verified-feasible: AntD 5.16's picker passes `open`, `getPopupContainer`, `panelRender`, and `popupClassName` straight through to `rc-picker` 4.3.0 (confirmed in `rc-picker/es/interface.d.ts`). Hand-rolling a grid is explicitly rejected by D-08.

**Primary recommendation:** Build a shared `SheetTrigger` primitive + a shared `useSheetPickerField` hook (normalizes injected `value`/`onChange`/`id`/`status` + open/close state), then layer the four pickers on top. Reuse `Sheet` + `SheetActions` verbatim; never pass explicit `zIndex`. Embed the date panel via forced-`open` + `getPopupContainer` into the sheet body, overriding the inherited `z-index:4200` popup so the panel stays inside the sheet. Test with jsdom units (selection/search/draft/clamp/destructive) + one Form-submit test per picker + a touch e2e on the existing `mobile-safari` Playwright project.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Picker open/close + gesture dismiss | Browser/Client (Sheet base) | — | Phase 7 `Sheet` owns drag, focus trap, scroll-lock, z-index. Pickers only toggle `open`. |
| Form value collection & validation | Browser/Client (AntD Form runtime) | — | `Form.Item` clones child + injects `value`/`onChange`/`id`/`status`; pickers consume, never re-implement validation. |
| Option label resolution / selected-summary | Browser/Client (picker component) | — | Mirror `Form/Select.tsx` helpers (`_getSelectedOptionDisplays`, `_renderOptionLabel`). |
| Calendar rendering + date constraints | Browser/Client (AntD DatePicker panel) | — | D-08: host AntD's panel; `disabledDate`/`showTime`/range/locale come from AntD. |
| Diacritic-insensitive filter | Browser/Client (picker component) | — | Tiny inline `String.normalize('NFD')` normalize; no library. |

This phase is entirely client-tier (a local-first PWA). No backend, persistence, or routing changes — confirmed by CONTEXT "No call-site, store, or routing wiring this phase."

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | 18.2.0 | Components, controlled state, `cloneElement` consumption | Project baseline [VERIFIED: package.json] |
| antd | 5.16.1 | `Form`/`Form.Item`, `Checkbox`, `Input`, `DatePicker`, `Calendar`, `Button`, icons | Project UI library; pickers must reach parity with it [VERIFIED: package.json + `node_modules/antd/package.json`] |
| dayjs | 1.11.10 | Date value type for `SheetDatePicker` (AntD 5 is dayjs-native) | AntD 5 DatePicker emits `Dayjs`; value type must match [VERIFIED: package.json + `node_modules/dayjs/package.json`] |
| @components/Sheet | in-repo | Host shell (`Sheet`, `SheetActions`) | Phase 7 deliverable; all four pickers render inside it [VERIFIED: `src/Components/Sheet/index.ts`] |

### Supporting (transitive, already installed — for reference only, do NOT add)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| rc-picker | 4.3.0 | AntD's underlying picker panel engine | Only relevant to understand `open`/`getPopupContainer`/`panelRender` pass-through; do not import directly unless the `getPopupContainer` approach proves insufficient [VERIFIED: `node_modules/rc-picker/package.json`] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| AntD `<DatePicker open getPopupContainer>` | `rc-picker` `PickerPanel` (publicly exported) | PickerPanel renders a bare panel but requires manually wiring `generateConfig` (dayjs) + `locale` that AntD normally injects — more code, more parity risk. Use only as fallback. [VERIFIED: `rc-picker/es/index.d.ts` exports `PickerPanel`] |
| AntD `<DatePicker>` panel | AntD `<Calendar>` | `Calendar` is a month/year *display* surface (fullscreen toggle), lacks `showTime` and range; wrong tool for a date *input*. [VERIFIED: `node_modules/antd/es/calendar/generateCalendar.d.ts`] |
| In-sheet AntD `Checkbox` rows | Custom checkbox markup | AntD `Checkbox` carries a11y (`aria-checked`) for free; PITFALLS §E requires `aria-checked` on rows. |

**Installation:** None. Zero new runtime dependencies (locked). No `npm install` step in any plan.

## Architecture Patterns

### System Architecture Diagram

```
                         AntD <Form>
                             │  (validation rules, getFieldsValue)
                             ▼
                      <Form.Item name=…>
                             │  React.cloneElement injects:
                             │  value, onChange, id, status
                             ▼
        ┌────────────────────────────────────────────────┐
        │  SheetPicker component (CONTROLLED)              │
        │  useSheetPickerField({value,onChange,id,status}) │
        │     ├─ open state (local)                        │
        │     └─ draft state (multi/range only, local)     │
        │                                                  │
        │   ┌──────────────┐        ┌────────────────────┐ │
        │   │ SheetTrigger │ tap →  │ open=true          │ │
        │   │ (closed box, │ ◀──────│                    │ │
        │   │  shows label,│ focus  │  <Sheet>           │ │
        │   │  id, status) │ return │   body:            │ │
        │   └──────────────┘        │    option rows /   │ │
        │                           │    AntD date panel │ │
        │                           │   <SheetActions>   │ │
        │                           │    Xong / Hủy      │ │
        │                           └─────────┬──────────┘ │
        │                                     │ commit      │
        │         onChange(newValue) ◀────────┘             │
        └────────────────────────────────────────────────┘
                             │
                             ▼
                  Form collects value unchanged
```

Single-select / date-single: row tap → `onChange(v)` → close (auto-dismiss, D-05/D-08).
Multi-select / range: edits draft → "Xong" → `onChange(draft)` → close; "Hủy"/drag-dismiss → discard draft, no `onChange` (D-06/D-09).

### Recommended Project Structure
```
src/Components/SheetPicker/
├── index.ts                       # barrel → export { SheetSelect, SheetMultiSelect, SheetDatePicker, SheetActionMenu } + types
├── shared/
│   ├── SheetTrigger.tsx           # closed-state input-styled button (D-03): id, status ring, disabled, clear ×, label/placeholder
│   ├── useSheetPickerField.ts     # normalize value/onChange/id/status + open/close; draft helpers
│   ├── optionLabel.ts             # label resolution mirroring Form/Select helpers (D-04)
│   └── normalizeDiacritics.ts     # NFD strip for VN-insensitive filter (D-07)
├── SheetSelect/
│   ├── SheetSelect.tsx
│   └── SheetSelect.test.tsx
├── SheetMultiSelect/
│   ├── SheetMultiSelect.tsx
│   └── SheetMultiSelect.test.tsx
├── SheetDatePicker/
│   ├── SheetDatePicker.tsx        # + RangePicker sub-export (D-01)
│   └── SheetDatePicker.test.tsx
└── SheetActionMenu/
    ├── SheetActionMenu.tsx
    └── SheetActionMenu.test.tsx
```
Folder = PascalCase, barrel `index.ts`, co-located `*.test.tsx` — matches `src/Components/Sheet/` and CONVENTIONS.md. `@components/SheetPicker` resolves via the existing `@components/*` mapping in `tsconfig.json` + `craco.config.js` + jest `moduleNameMapper` (`package.json` line 69) — **no alias config change needed** (D-11) [VERIFIED: package.json jest.moduleNameMapper].

### Pattern 1: Controlled Form-bound child (the PICK-08 mechanism)
**What:** AntD `Form.Item` clones its single child and injects `value`, `onChange`, `id`, and `status`. A controlled child that honors all four is automatically form-bound.
**When to use:** Every picker. This is the core contract.
**Verified in-repo:** `SmartFormItem` is `({...props}) => <AntForm.Item {...props} />` — a pure pass-through, so the injection behavior is stock AntD with no project-specific wrapper to satisfy [VERIFIED: `src/Components/SmartForm/SmartFormItem/SmartFormItem.tsx`].

```typescript
// Each picker accepts the injected props alongside its own API (D-01/D-02).
type SheetSelectProps = {
  value?: SelectValue;                 // injected by Form.Item (controlled)
  onChange?: (value: SelectValue) => void; // injected by Form.Item
  id?: string;                         // injected by Form.Item → forward to trigger
  status?: 'error' | 'warning' | '';   // injected by Form.Item → red ring when 'error'
  options?: OptionType[];
  showSearch?: boolean;
  allowClear?: boolean;
  placeholder?: React.ReactNode;
  disabled?: boolean;
};
// The trigger element receives id + status; the SHEET never carries the form binding.
// On single-select commit: onChange(next); setOpen(false). Form collects `next` unchanged.
```
- `status` can also be read with `Form.Item.useStatus()` (re-exported as `SmartFormItem.useStatus`) if a child needs it without prop injection — but prop injection is the simpler, locked path (D-02).

### Pattern 2: Single-select option rows + auto-dismiss (PICK-01/02, D-05)
**What:** Tap a row → checkmark on that row → `onChange(value)` → `setOpen(false)`. `allowClear` renders a leading "Bỏ chọn" row that emits `onChange(undefined)` and closes.
**When to use:** `SheetSelect`.
- Rows are real `<button>`/`role="option"` with `aria-selected` (PITFALLS §E — checkmark-only is not AT-accessible).
- Label resolution reuses the shape of `Form/Select.tsx` `_getSelectedOptionDisplays`/`_renderOptionLabel` so the closed trigger summary (D-04) matches what AntD shows today.
- Build rows to ≥44px now (IOS-03 lands in Phase 9, but the bar is known).

### Pattern 3: Draft + commit/revert state machine (PICK-03/04, D-06)
**What:** A local `draft` seeded from `value` when the sheet opens. Checkbox toggles mutate `draft` only. "Xong (N)" → `onChange(draft)` + close. "Hủy" / drag-dismiss / backdrop → discard `draft`, never call `onChange`.
**When to use:** `SheetMultiSelect`, and `SheetDatePicker` range mode (D-09).
**Critical interaction with Phase 7 (D-04):** While the draft differs from the opened value (dirty), pass `maskClosable={false}` to `<Sheet>`. Phase 7's `dragDecision` short-circuits to spring-back when `maskClosable === false` (verified in `FastOverlay.tsx` `endDrag` → `dragDecision`), so an accidental drag-dismiss cannot silently lose edits. The explicit "Hủy" button still closes (it calls `onClose` directly, not gated by `maskClosable`).

```typescript
// Seed draft on each open; do not persist across opens.
const [draft, setDraft] = React.useState<Key[]>(() => toArray(value));
React.useEffect(() => { if (open) setDraft(toArray(value)); }, [open]); // re-seed from latest value
const dirty = !sameSet(draft, toArray(value));
// <Sheet maskClosable={!dirty}> ; commit: onChange(draft); setOpen(false)
// cancel: setOpen(false)  // draft is dropped by the open-effect on next open
```

### Pattern 4: Diacritic-insensitive Vietnamese filter (PICK-02, D-07)
**What:** Normalize both query and option label by NFD-decomposing and stripping combining marks, then `includes`. No library — grep confirmed no existing normalize helper in `src/` to reuse.
**When to use:** `SheetSelect`/`SheetMultiSelect` search field (auto-shown when `options.length` ≳ 8-10 or `showSearch`).

```typescript
// normalizeDiacritics.ts — strips Vietnamese tone/diacritic marks AND đ/Đ.
export const normalizeDiacritics = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
// filter: normalizeDiacritics(label).includes(normalizeDiacritics(query))
```
- `đ`/`Đ` do NOT decompose under NFD, so they need the explicit replace — easy to miss (warning sign: searching "do" fails to match "đỏ").
- Search field stays at the **top** of the sheet body (PITFALLS §A: iOS keyboard shoves `position:fixed` sheets; keep input near top, the Sheet already scroll-locks the body).

### Pattern 5: Embed AntD's calendar panel inside the sheet (PICK-05/06, D-08)
**What:** Render AntD `<DatePicker>` (or `<DatePicker.RangePicker>`) with `open` forced to the sheet's open state and `getPopupContainer={() => sheetBodyRef.current}` so AntD's real panel mounts inside the sheet body — keeping `disabledDate` (min/max), `showTime`, range, and `viVN` locale all working with zero re-implementation.
**When to use:** `SheetDatePicker`.
**Verified feasibility:** AntD 5.16's `PickerProps`/`RangePickerProps` extend `rc-picker`'s props, which include `open`, `onOpenChange`, `getPopupContainer`, `panelRender`, `popupClassName`, `inputReadOnly`, and `needConfirm` [VERIFIED: `node_modules/rc-picker/es/interface.d.ts` lines 240–289; `node_modules/antd/es/date-picker/generatePicker/interface.d.ts` `InjectDefaultProps<RcPickerProps>`].

```typescript
// SheetDatePicker — host AntD's own panel in the sheet (D-08).
const sheetBodyRef = React.useRef<HTMLDivElement>(null);
// inside <Sheet open={open} ...> body:
<DatePicker
  open={open}                              // force the panel visible
  value={open ? draft : value}             // single: commit immediately; range: use draft (D-09)
  onChange={handlePanelChange}
  getPopupContainer={() => sheetBodyRef.current!} // mount panel INSIDE the sheet
  popupClassName="sheet-date-popup"        // scope CSS to neutralize z-index 4200 (see Pitfall 3)
  disabledDate={disabledDate}              // min/max parity
  showTime={showTime}
  picker={picker}
  inputReadOnly                            // suppress the on-screen keyboard on the hidden input
  popupStyle={{ position: 'static', boxShadow: 'none', zIndex: 'auto' }} // de-float inside sheet
/>
```
- Single date/datetime: commit on panel `onChange` then auto-dismiss (matches D-05 single-select feel). For `showTime`, AntD shows an "OK" footer — let its confirm fire `onChange`, then close.
- Range (D-09): drive a `draft` like Pattern 3; commit only on "Xong" via `SheetActions`, so a half-picked range cannot escape. `RangePicker` is a sub-export: `export const RangePicker = ...; Object.assign(SheetDatePicker, { RangePicker })` mirroring `Form/DatePicker.tsx`.
- "Hôm nay" (D-09): a prominent `SheetActions`/row button → `dayjs()` clamped to min/max (`disabledDate(today) ? nearestAllowed : today`).
- **Value type:** emit `Dayjs` unchanged (PICK-05). Do NOT convert to moment — DateHelper is moment but conversion happens at call sites in later phases (PITFALLS §B); the picker's contract is pure Dayjs.

### Pattern 6: Grouped iOS action sheet (PICK-07, D-10)
**What:** `SheetActionMenu` takes an `actions: { key, label, icon?, danger?, onClick }[]`. Renders full-width rows in one rounded surface; `danger` → red text; "Hủy" is a separate detached button below the group (gap). Not Form-bound (it's an action menu, not a value field) — but still hosted in `<Sheet>`.
**When to use:** Replacement for ~17 AntD `Dropdown` overflow menus (Phases 10-11).
- Use `SheetActions` for the detached "Hủy".
- Each row `onClick` runs the action then closes; `danger` rows use `#ff4d4f` (AntD `colorError`) text.

### Anti-Patterns to Avoid
- **Rendering a live AntD `<Select>`/`<DatePicker>` with popup suppressed as the trigger** — D-03 forbids it; build a dedicated trigger so `id`/`status`/`disabled` forward cleanly and Phase 9 tokens can restyle it.
- **Passing explicit `zIndex` to `<Sheet>`** — breaks Phase 7's `useResolvedOverlayZIndex` token stacking (a picker opened inside another sheet must stack automatically). Verified: `FastOverlay.tsx` only token-stacks when `zIndex === undefined`.
- **Holding committed state inside the picker** — pickers are controlled (D-02); the ONLY local state is `open` + (multi/range) `draft`. A committed internal value drifts from the form value (PITFALLS §B "controlled vs uncontrolled drift").
- **Hand-rolling a calendar grid** — D-08 forbids; re-bugs `disabledDate`/`showTime`/range/locale.
- **Forgetting `đ`/`Đ` in the diacritic normalize** — NFD alone misses it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-to-dismiss, focus trap, scroll-lock, safe-area, z-index stacking | Custom sheet | Phase 7 `Sheet` (`@components/Sheet`) | All solved + tested in `FastOverlay.tsx`; re-solving reintroduces the iOS hazards in PITFALLS §A/D/E. |
| Sticky action row (Xong/Hủy) | Custom flex footer | `SheetActions` | Already equal-flex-stretches children; full-width single action (`FastOverlay.tsx` lines 642–677). |
| Calendar grid, min/max, time, range, VN month names | Custom date grid | AntD `<DatePicker>` panel via `getPopupContainer` | D-08; parity comes free from AntD + `viVN`. |
| Checkbox a11y | Custom checkbox | AntD `Checkbox` | `aria-checked` for free (PITFALLS §E). |
| Form value collection / validation wiring | Custom value plumbing | AntD `Form.Item` child-clone (value/onChange/id/status) | PICK-08; `SmartFormItem` is a verified pass-through. |
| Selected-label resolution for multi | New label logic | Mirror `Form/Select.tsx` `_getSelectedOptionDisplays` shape | Closed-trigger summary (D-04) must read identically to today's Select. |

**Key insight:** Phase 8 is composition, not invention. Every genuinely hard sub-problem (gesture, focus, calendar, form binding) is owned by an existing, tested layer. The new code is wiring + parity-matching + the small draft state machine.

## Common Pitfalls

### Pitfall 1: Form binding silently lost (the #1 risk, PITFALLS §B top-ranked)
**What goes wrong:** Picker stops validating / value missing from `form.getFieldsValue()` after a swap.
**Why it happens:** The component doesn't read injected `value`, doesn't emit via injected `onChange`, returns multiple root children (clone targets one child), or swallows `onChange`.
**How to avoid:** Single root element; consume `value`/`onChange`/`id`/`status`; the Form-submit test (D-12) asserts `onFinish` receives the picked value unchanged for each picker. `strict:false`/`es5` means the compiler will NOT catch this — the test is the only guard.
**Warning signs:** Field validation never fires; submit payload omits the field.

### Pitfall 2: Draft loss via accidental drag-dismiss (PICK-04)
**What goes wrong:** User edits a multi-select, accidentally drags the sheet down, edits vanish silently.
**Why it happens:** Default `maskClosable` lets a drag past threshold dismiss + the draft is discarded with no commit.
**How to avoid:** `maskClosable={!dirty}` (Pattern 3). Phase 7's `dragDecision` springs back when `maskClosable===false` [VERIFIED: `FastOverlay.tsx`].
**Warning signs:** e2e drag-dismiss on a dirty multi-select closes the sheet.

### Pitfall 3: Embedded date panel floats out of the sheet on z-index 4200
**What goes wrong:** The AntD date popup renders above/detached from the sheet, or escapes to `document.body`.
**Why it happens:** `App.tsx` sets `components.DatePicker.zIndexPopup: 4200` and `token.zIndexPopupBase: 4000` globally [VERIFIED: `src/App.tsx`]; the default popup also portals to `body`.
**How to avoid:** `getPopupContainer={() => sheetBodyRef.current}` (mount inside sheet) + `popupStyle={{ position:'static', zIndex:'auto', boxShadow:'none' }}` and/or a scoped `popupClassName` to neutralize the 4200/absolute positioning so the panel flows inline in the sheet body.
**Warning signs:** Calendar appears at the top-left of the viewport or above the sheet backdrop.

### Pitfall 4: iOS keyboard shoves the sheet when the search/time field focuses (PITFALLS §A)
**What goes wrong:** Focusing the search input (or time input) pushes/floats the `position:fixed` sheet, keyboard covers the field.
**Why it happens:** iOS Safari + `position:fixed` + virtual keyboard.
**How to avoid:** Keep the search field at the top of the sheet body; the Sheet body already scrolls (`overflow-y:auto`) and is scroll-locked behind. For the date panel, prefer `inputReadOnly` so tapping doesn't summon the keyboard. Phase 8 builds to this; deep `visualViewport` handling is a Phase 9 polish if needed.
**Warning signs:** Search field hidden behind keyboard on a real device.

### Pitfall 5: DatePicker value-type mismatch (PITFALLS §B)
**What goes wrong:** Date saved as wrong type downstream.
**Why it happens:** Mixing moment (DateHelper) and dayjs.
**How to avoid:** `SheetDatePicker` emits `Dayjs` and nothing else (PICK-05). Conversion to moment is a *call-site* concern in Phases 10-11, not this layer's.
**Warning signs:** A test asserting `dayjs.isDayjs(emitted)` fails.

### Pitfall 6: Checkmark-only selection invisible to AT (PITFALLS §E)
**What goes wrong:** Screen readers can't tell which row is selected.
**How to avoid:** `aria-selected` on single-select rows, `aria-checked` (via AntD `Checkbox`) on multi rows — not just a visual glyph.

## Validation Architecture

`workflow.nyquist_validation` is `true` in `.planning/config.json` — section included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework (unit) | Jest + React Testing Library via `react-scripts test` (CRA preset) [VERIFIED: package.json `test` script + `@testing-library/react@13.4.0`, `@testing-library/jest-dom@5.17.0`] |
| Framework (e2e) | Playwright `@playwright/test@1.60.0`, project `mobile-safari` (iPhone 13, hasTouch+isMobile) [VERIFIED: `playwright.config.ts`] |
| Config file (unit) | none standalone — CRA preset + `jest.moduleNameMapper` in `package.json` (maps `@components/*`) |
| Config file (e2e) | `playwright.config.ts` (testDir `./tests/e2e`) |
| Quick run command | `CI=true npx react-scripts test --watchAll=false src/Components/SheetPicker` |
| Full suite command | `CI=true npx react-scripts test --watchAll=false` then `npm run test:e2e` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PICK-01 | tap row → check → dismiss + commit | unit | `react-scripts test SheetSelect` | ❌ Wave 0 |
| PICK-02 | search filters (diacritic-insensitive) + "Bỏ chọn" clears | unit | `react-scripts test SheetSelect` | ❌ Wave 0 |
| PICK-03 | checkbox draft + "Xong (N)" commits + count | unit | `react-scripts test SheetMultiSelect` | ❌ Wave 0 |
| PICK-04 | "Hủy"/dismiss reverts to value-on-open | unit | `react-scripts test SheetMultiSelect` | ❌ Wave 0 |
| PICK-05 | Dayjs value, min/max via disabledDate, "Hôm nay" clamps | unit | `react-scripts test SheetDatePicker` | ❌ Wave 0 |
| PICK-06 | showTime + range (commit on Xong) | unit | `react-scripts test SheetDatePicker` | ❌ Wave 0 |
| PICK-07 | full-width rows, danger red, detached "Hủy" | unit | `react-scripts test SheetActionMenu` | ❌ Wave 0 |
| PICK-08 | each picker in `<Form>` → submit collects value unchanged | unit (RTL `<Form onFinish>`) | `react-scripts test SheetPicker` | ❌ Wave 0 |
| PICK-01/03/04 | real tap-to-commit + Xong/Hủy gesture | e2e | `npm run test:e2e -- --project=mobile-safari` (new spec, fixture route) | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `CI=true npx react-scripts test --watchAll=false src/Components/SheetPicker/<PickerInProgress>`
- **Per wave merge:** `CI=true npx react-scripts test --watchAll=false src/Components/SheetPicker`
- **Phase gate:** full unit suite green + the new `mobile-safari` e2e spec green before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `src/Components/SheetPicker/SheetSelect/SheetSelect.test.tsx` — PICK-01/02
- [ ] `src/Components/SheetPicker/SheetMultiSelect/SheetMultiSelect.test.tsx` — PICK-03/04
- [ ] `src/Components/SheetPicker/SheetDatePicker/SheetDatePicker.test.tsx` — PICK-05/06
- [ ] `src/Components/SheetPicker/SheetActionMenu/SheetActionMenu.test.tsx` — PICK-07
- [ ] A Form-binding test per picker (PICK-08) — can be one `*.formbind.test.tsx` per folder or a section in each file
- [ ] `tests/e2e/sheet-picker.spec.ts` + a fixture route (mirror `src/Routing/SheetGestureFixture.screen.tsx` + `tests/e2e/native-sheet.spec.ts`) on the `mobile-safari` project — the pickers are unused by real screens this phase (CONTEXT), so a test-only fixture route is required to drive them, exactly as Phase 7 did
- [ ] No framework install needed (Jest + RTL + Playwright all present)

**jsdom note (mirror Phase 7):** jsdom does not carry `clientY` on constructed PointerEvents and `setPointerCapture` throws (already swallowed in `FastOverlay.tsx`). Keep *gesture* assertions in the Playwright e2e; keep *selection/draft/filter/clamp/destructive/form-binding* logic in jsdom units. AntD `Form` + RTL `fireEvent.click` + `onFinish` spy is the verified pattern for PICK-08.

## Security Domain

`workflow.security_enforcement` is `true`, `security_asvs_level: 1`. This phase is a client-side UI component layer in a local-first PWA with no auth, no network, no persistence, no user-supplied HTML. Applicability is minimal.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth in this phase or app. |
| V3 Session Management | no | No sessions. |
| V4 Access Control | no | Local-first, single device. |
| V5 Input Validation | partial | Search input is filter-only (never eval'd, never rendered as HTML); option labels are `ReactNode` rendered by React (auto-escaped). No `dangerouslySetInnerHTML`. |
| V6 Cryptography | no | No crypto. |

### Known Threat Patterns for React/AntD client components
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via option label / search echo | Tampering | Render through JSX (React auto-escapes); never `dangerouslySetInnerHTML`; never build DOM from the search string. |
| ReDoS in diacritic filter | DoS | Use `String.includes` after normalize — no user-controlled regex. |

No high-severity threats introduced. No security blocker for this phase.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| AntD 4 DatePicker = moment | AntD 5 DatePicker = dayjs-native | AntD v5 | `SheetDatePicker` value is `Dayjs` (PICK-05); no moment in the picker. [VERIFIED: `antd/es/date-picker/index.d.ts` `DatePickerProps<ValueType = Dayjs>`] |
| `dropdownRender`/`dropdownStyle` | `popupRender`/`popupClassName` (dropdown* deprecated) | AntD 5.13+ | The existing `Form/Select.tsx` still uses `dropdownRender`/`dropdownStyle` (deprecated-but-working). The pickers don't use AntD Select's popup at all (D-03 dedicated trigger), so this deprecation doesn't affect Phase 8. [VERIFIED: `antd/es/date-picker/generatePicker/interface.d.ts` line 47 deprecation note] |
| Custom bottom-sheet libs (vaul) | Reuse in-repo `Sheet` | this milestone | Zero new deps (locked). |

**Deprecated/outdated:** none introduced by Phase 8.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `getPopupContainer` + `popupStyle`/`popupClassName` fully neutralizes the inherited `z-index:4200` so AntD's date panel renders inline in the sheet body | Pattern 5 / Pitfall 3 | LOW — if inline positioning fights AntD's absolute popup, fall back to `rc-picker` `PickerPanel` (publicly exported, verified) for a truly bare panel. Both are within D-08. Resolve during the SheetDatePicker spike. |
| A2 | Diacritic normalize via NFD + explicit `đ`/`Đ` replace is sufficient for the VN option labels in use | Pattern 4 | LOW — worst case a few labels filter imperfectly; trivially extendable. No data loss. |
| A3 | The Form-submit RTL pattern (`<Form onFinish>` + `fireEvent`) drives each picker's `onChange` correctly under jsdom without real gestures | Validation Architecture | LOW — selection commit is a plain `onClick`, not a gesture, so jsdom handles it; gestures are covered by e2e. |

All other claims are `[VERIFIED]` against installed source or in-repo files.

## Open Questions

1. **Exact de-floating recipe for the embedded date panel (A1).**
   - What we know: AntD/rc-picker accept `open`, `getPopupContainer`, `panelRender`, `popupClassName`, `popupStyle` [VERIFIED]; the global `zIndexPopup:4200` is set in `App.tsx`.
   - What's unclear: whether `popupStyle:{position:'static'}` alone makes the panel flow inline, or a small scoped CSS override (`.sheet-date-popup .ant-picker-dropdown { position: static; }`) is also needed.
   - Recommendation: a 30-minute spike at the start of the SheetDatePicker plan; the fallback (rc-picker `PickerPanel`) is verified-available if the popup route resists. Either way stays inside D-08.

2. **`showTime`/range commit ergonomics.**
   - What we know: D-09 says range commits on "Xong"; AntD's own `showTime` panel has an "OK" footer.
   - What's unclear: whether to suppress AntD's internal OK footer in favor of the unified `SheetActions` "Xong", or let both coexist.
   - Recommendation: prefer the single `SheetActions` "Xong" for a consistent sheet feel; suppress/ignore AntD's footer where it appears. Claude's discretion per D-08/D-09.

## Sources

### Primary (HIGH confidence — codebase + installed source, verified this session)
- `src/Components/FastOverlay/FastOverlay.tsx` — `Sheet`, `SheetActions`, `useResolvedOverlayZIndex`, `maskClosable`→`dragDecision`, focus trap, scroll-lock
- `src/Components/Sheet/index.ts` — barrel pattern to mirror
- `src/Components/Sheet/Sheet.test.tsx` — jsdom test pattern (PointerEvent shim, Vietnamese labels)
- `tests/e2e/native-sheet.spec.ts` + `playwright.config.ts` — `mobile-safari` project, fixture-route e2e pattern
- `src/Components/Form/Select/Select.tsx` — parity surface (`mode`/`showSearch`/`allowClear`, label-resolution helpers, z-index 4200 hack)
- `src/Components/Form/DatePicker/DatePicker.tsx` — parity surface + `RangePicker` sub-export + `popupStyle` z-index hack
- `src/Components/SmartForm/SmartFormItem/SmartFormItem.tsx` + `.types.ts` — verified thin pass-through to `AntForm.Item` (PICK-08 mechanism)
- `src/App.tsx` — `viVN` locale, `dayjs.locale('vi')`, `zIndexPopupBase:4000`, `DatePicker.zIndexPopup:4200`
- `node_modules/antd/es/date-picker/index.d.ts`, `.../generatePicker/interface.d.ts`, `node_modules/rc-picker/es/interface.d.ts`, `.../PickerPanel/index.d.ts`, `node_modules/antd/es/calendar/generateCalendar.d.ts` — picker prop pass-through (`open`/`getPopupContainer`/`panelRender`/`popupClassName`), `Dayjs` value type, `PickerPanel` public export
- `package.json` — versions (antd 5.16.1, dayjs 1.11.10, react 18.2.0, @playwright/test 1.60.0), `jest.moduleNameMapper` alias, test scripts
- `.planning/research/SUMMARY.md`, `.planning/research/PITFALLS.md` — zero-new-deps mandate, ranked hazards (Form-binding, scroll/drag, value-type, stacking, a11y)
- `.planning/codebase/CONVENTIONS.md` — folder/barrel naming, VN copy, match-file indentation, union literals

### Secondary (MEDIUM confidence)
- AntD 5 deprecation of `dropdown*` → `popup*` (noted in installed `.d.ts`; not load-bearing for Phase 8 since pickers use a dedicated trigger, not AntD Select's popup)

### Tertiary (LOW confidence)
- none

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified against installed `node_modules` + zero new deps locked
- Architecture: HIGH — Form-binding mechanism verified in-repo (`SmartFormItem` pass-through); Sheet host already shipped + tested in Phase 7
- Pitfalls: HIGH — drawn from codebase-verified PITFALLS.md and confirmed against installed source (z-index 4200 in App.tsx, `maskClosable`→dragDecision in FastOverlay)
- Calendar embedding (D-08): MEDIUM-HIGH — prop pass-through verified; exact de-floating CSS recipe needs a short spike (A1), with a verified fallback (rc-picker PickerPanel)

**Research date:** 2026-06-29
**Valid until:** 2026-07-29 (stable — pinned deps, no fast-moving external surface)
