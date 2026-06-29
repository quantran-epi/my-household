# Phase 8: Sheet-Picker Component Layer - Context

**Gathered:** 2026-06-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the reusable `@components/SheetPicker` layer — **SheetSelect**, **SheetMultiSelect**, **SheetDatePicker**, **SheetActionMenu** — on top of the Phase 7 native `<Sheet>`. Each picker is AntD-`Form`-bindable and reaches full behavior parity with the AntD picker it will eventually replace. Covers PICK-01..08.

**In scope:** the four picker components, their in-sheet content (option rows, calendar host, action rows), AntD `Form` binding (`value`/`onChange`/`id`/`status`), and isolated unit + e2e tests proving each works standalone.

**Out of scope:** migrating any real call site (Phases 10-11), the iOS token baseline / app-shell safe-area (Phase 9), removing the old AntD `Form/Select` + `Form/DatePicker` wrappers and their `z-index: 4200` hacks (Phase 11, CONV-05). Pickers ship in Phase 8 but stay unused by feature screens until Phase 10.
</domain>

<decisions>
## Implementation Decisions

Requirements PICK-01..08 lock the *behavior* (tap→check→dismiss, draft+commit multi-select, `Dayjs` values, red destructive actions, `Form` binding). The decisions below lock the *how* — the choices that were left open. These are Claude's UI/UX/usability calls, made per the user's instruction to "do what you think is best."

### API shape & conversion strategy (the highest-leverage call)
- **D-01:** Each picker mirrors the **existing AntD wrapper prop API** (`Form/Select`, `Form/DatePicker`) as closely as possible — `value`/`onChange`/`options`/`mode`/`showSearch`/`allowClear`/`placeholder`/`disabled` for selects; `value`/`onChange`/`picker`/`showTime`/`disabledDate`/`format` for dates; `RangePicker` as a sub-export. Rationale: Phases 10-11 convert ~80 Select + 17 DatePicker + 17 Dropdown sites. A prop-compatible surface turns most conversions into near drop-in import swaps (`Form/Select` → `SheetPicker/SheetSelect`) instead of per-site rewrites — by far the biggest downstream-effort lever. Do NOT invent a novel picker API.
- **D-02:** Accept and respect the props AntD `Form.Item` injects when it clones its child — `value`, `onChange`, `id`, and `status` (`'error' | 'warning'`). The trigger renders the AntD error ring/aria when `status==='error'` so existing `Form` validation rules keep working with zero rule changes (PICK-08). Each picker is a **controlled** component (reads `value`, emits via `onChange`); it holds no committed state of its own.

### Trigger element (the closed, tappable control)
- **D-03:** Render a **dedicated trigger** styled to match the current AntD input box (same height, border, radius, placeholder/value text, clear "×" affordance, disabled look), NOT the live AntD `<Select>`/`<DatePicker>` with its popup suppressed. Rationale: a real input button we own is the clean way to forward `id`/`status`/`disabled`, attach the open handler, and be restyled by the Phase 9 iOS tokens — and it sidesteps the AntD popup/z-index machinery entirely (which Phase 11 is removing anyway). Tapping the trigger opens the sheet; the trigger is the focus-return target the Sheet restores to on close.
- **D-04:** Closed-state trigger shows the **selected value's label** (single), a **count + first label / "N đã chọn"** (multi), or the **formatted date / range** (date), and the localized placeholder when empty — matching what each AntD control shows today so converted screens read identically.

### Selection & commit semantics
- **D-05:** **SheetSelect** = tap a row → checkmark on that row → sheet auto-dismisses and commits immediately (PICK-01). `allowClear` renders a "Bỏ chọn" row/affordance that sets value to `undefined` and dismisses (PICK-02).
- **D-06:** **SheetMultiSelect** = checkbox rows, sheet **stays open**, edits a local **draft**; a sticky bottom **"Xong (N)"** primary button commits the draft via `onChange` and dismisses; **"Hủy"** (or drag/backdrop dismiss) **reverts** to the value the sheet had on open — the draft is discarded (PICK-03, PICK-04). Use the Phase 7 `SheetActions` row for the sticky Xong/Hủy footer.
- **D-07:** **Search** (`showSearch`) auto-appears for long lists; default to showing the in-sheet search/filter field when option count is large (threshold ~8-10, Claude's discretion) and always when a site passes `showSearch`. Filter is client-side over option labels, diacritic-insensitive where practical for Vietnamese.

### SheetDatePicker engine
- **D-08:** **Host AntD's own calendar panel inside the sheet** rather than hand-rolling a calendar grid. Rationale: lowest parity risk — `disabledDate` (min/max), `showTime`, range selection, and locale/`viVN` month-week rendering all come from AntD already in use; a custom grid would re-implement and re-bug all of it. Value stays a **`Dayjs`** (PICK-05). Time selection (`showTime`, PICK-06) and date-range (RangePicker replacement, PICK-06) are hosted in the same sheet.
- **D-09:** A **"Hôm nay"** quick-action sits as a prominent row/button in the date sheet, setting the value to today (clamped to min/max) (PICK-05). For range mode, the sheet commits on a "Xong" action like multi-select (start+end chosen) rather than auto-dismiss, so a half-picked range can't escape.

### SheetActionMenu layout
- **D-10:** **iOS grouped action-sheet** styling: action rows grouped in one rounded surface, **full-width** tappable rows, **destructive actions in red** (PICK-07), an optional leading icon per row, and **"Hủy" as a separate, visually detached button below the group** (gap between the action card and Cancel) — the canonical iOS action-sheet shape, which best serves the "native iOS feel" milestone goal. Replaces the ~17 AntD `Dropdown` overflow menus in Phases 10-11.

### Packaging & tests
- **D-11:** Live under `src/Components/SheetPicker/` — one folder per picker (`SheetSelect/`, `SheetMultiSelect/`, `SheetDatePicker/`, `SheetActionMenu/`) each with co-located `*.test.tsx`, plus a barrel `index.ts` exported as `@components/SheetPicker` (mirrors the existing `@components/Sheet` barrel pattern). New alias `@components/SheetPicker` resolves through the existing `@components/*` mapping — no craco/tsconfig change needed.
- **D-12:** Test each picker **in isolation** (no real site): jsdom unit tests for selection/search/draft-commit-revert/Hôm-nay/destructive-styling, plus a **Form-binding test** that wraps each picker in an AntD `<Form>` and asserts a submit validates and collects the picker's value unchanged (PICK-08). Follow the Phase 7 pattern — pure logic in units; a touch e2e (reusing the Phase 7 touch-capable Playwright project) proves tap-to-commit and Xong/Hủy on a real gesture.

### Claude's Discretion
- Exact search-field appearance threshold, row height (will be ≥44px per IOS-03 in Phase 9 but Phase 8 should already build to that bar), checkmark/checkbox iconography, "Xong"/"Hủy"/"Hôm nay"/"Bỏ chọn" exact copy (Vietnamese, friendly-familiar tone), and how AntD's calendar panel is embedded (inline panel render vs `getPopupContainer` into the sheet body) are Claude's call — match the Phase 7 sheet aesthetic (purple-tinted surface `linear-gradient(180deg,#f5f0ff 0%,#ffffff 42%)`, 18px top radius, `cubic-bezier(0.16,1,0.3,1)` ease, primary `#7436dc`).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` §"Phase 8: Sheet-Picker Component Layer" — phase goal + 4 success criteria.
- `.planning/REQUIREMENTS.md` §PICK (PICK-01..08) — the eight picker requirements this phase delivers. (IOS-* and CONV-* are later phases — do NOT pull them forward.)

### Phase 7 base this layer builds on (read before designing the pickers)
- `src/Components/FastOverlay/FastOverlay.tsx` — the `Sheet` export (native grabber, drag-to-dismiss, safe-area, focus trap) and `SheetActions` (sticky action row, use for Xong/Hủy footers). `useResolvedOverlayZIndex` already stacks a sheet-opened-from-a-form-inside-a-sheet correctly — do NOT pass explicit `zIndex`.
- `src/Components/Sheet/index.ts` — public barrel (`Sheet`, `SheetActions`, types). The SheetPicker barrel mirrors this shape.
- `.planning/phases/07-native-sheet-foundation/07-CONTEXT.md` — Phase 7 decisions (D-03 default-on native, D-04 `maskClosable` semantics, D-08 pure-logic + touch-e2e test approach) that the pickers inherit.

### Parity targets (the AntD wrappers the pickers must match, then later replace)
- `src/Components/Form/Select/Select.tsx` — current Select wrapper: `mode` (multiple/tags), `showSearch`, `allowClear`, selected-options panel, responsive tag placeholder, `z-index:4200` popup hack. SheetSelect/SheetMultiSelect must preserve these capabilities (D-01).
- `src/Components/Form/DatePicker/DatePicker.tsx` — current DatePicker wrapper + `RangePicker` sub-export, `popupStyle` z-index hack. SheetDatePicker must preserve `picker`/`showTime`/range/`Dayjs` value (D-08).

### v1.1 research (locks the technical guardrails)
- `.planning/research/SUMMARY.md` — **no new runtime deps**; build on React + AntD primitives already present.
- `.planning/research/PITFALLS.md` §A (iOS Safari/PWA) + §E (a11y) — scroll/drag conflict, focus trap, body-scroll-lock; the pickers inherit these from the Phase 7 Sheet, so don't re-solve, but the in-sheet calendar/search must not reintroduce them.

### Conventions
- `.planning/codebase/CONVENTIONS.md` — naming (PascalCase component folders + barrel `index.ts`), Vietnamese user-facing copy, `select`-prefixed selectors, match-the-file indentation, union string literals over enums.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Sheet` (`FastOverlay.tsx`): the host for all four pickers — grabber, drag-to-dismiss, safe-area, focus trap, Escape-close come free. Respects `maskClosable` (set `maskClosable={false}` on SheetMultiSelect/range while a draft is dirty so an accidental drag-dismiss can't lose edits — Phase 7 D-04 makes this automatic).
- `SheetActions` (`FastOverlay.tsx`): sticky horizontal action row — use for the **"Xong"/"Hủy"** footer (multi-select, range) and the ActionMenu's detached "Hủy".
- `useResolvedOverlayZIndex`: token-stacked z-index — a date sheet opened from a form already inside a sheet stacks above it automatically. Don't pass `zIndex`.
- AntD `Calendar`/`DatePicker` panel + `viVN` locale (already configured in `App.tsx`, `dayjs.locale('vi')`): embed for SheetDatePicker (D-08) instead of a custom grid.
- `Form/Select.tsx` helpers (`renderResponsiveTagPlaceholder`, selected-options panel logic): reference for how multi-select labels/counts are derived; the trigger's closed-state summary (D-04) can reuse the same label-resolution shape.

### Established Patterns
- Component = folder + implementation `.tsx` + barrel `index.ts`, imported via `@components/<Name>` (craco + tsconfig aliases already map `@components/*`). SheetPicker follows this exactly.
- Sheets render via `createPortal` with inline styles + an injected `<style>` block for things the `style` prop can't express — match this; no CSS modules.
- AntD `Form.Item` clones its single child injecting `value`/`onChange`/`id`/`status` — a controlled child that honors those is automatically form-bound (the mechanism behind PICK-08).
- Co-located `*.test.tsx` under jsdom (e.g. `Sheet.test.tsx`, `dragDecision.test.ts`); touch e2e under `tests/e2e/` on the Phase 7 touch-capable Playwright project.

### Integration Points
- New barrel `src/Components/SheetPicker/index.ts` exported as `@components/SheetPicker` — the single import surface Phases 10-11 will swap call sites onto.
- No call-site, store, or routing wiring this phase — the layer is built and tested standalone, then consumed in Phase 10.
- `@components/Sheet` for the base import; AntD (`antd`) for `Checkbox`, `Input` (search), `Calendar`/`DatePicker` panel, icons.
</code_context>

<specifics>
## Specific Ideas

- Target the **native iOS picker feel**: tapping a single-select row checks it and the sheet slides away (no extra "done" tap); multi-select feels like iOS settings (checkbox rows + an explicit commit); the action menu is the classic grouped iOS action-sheet with a detached red-aware Cancel.
- **Parity-first, polish-later:** Phase 8 reaches behavior + capability parity and builds rows to the ≥44px thumb bar; the cohesive iOS visual token pass lands in Phase 9. Don't block Phase 8 on visual tokens that don't exist yet — match the Phase 7 sheet surface for now.
- **Drop-in conversion is the prize:** every API decision (D-01, D-02) optimizes for making Phases 10-11 mechanical, low-risk swaps rather than rewrites.
</specifics>

<deferred>
## Deferred Ideas

- **Migrating real picker sites** (wizard, Home, ScheduledMeal, ShoppingList, Dishes, Ingredient, admin) — Phases 10 (high-traffic) and 11 (long-tail). Phase 8 only builds + tests the layer in isolation.
- **iOS token baseline + app-shell `viewport-fit=cover` safe-area + ≥44px audit** — Phase 9 (IOS-01..03). Phase 8 builds to the thumb-zone bar but the cohesive token system is Phase 9's.
- **Removing old AntD `Form/Select` + `Form/DatePicker` wrappers and `z-index:4200` popup hacks** — Phase 11 (CONV-05). They must keep working in parallel until every site is converted.
- **Multi-detent snapping / haptics / spring physics** — out of v1.1 (Phase 7 D-01 + deferred motion milestone). Pickers use the dismiss-only Sheet as-is.

None of the above is scope creep into Phase 8 — all are already mapped to later phases in ROADMAP.md.
</deferred>

---

*Phase: 8-Sheet-Picker Component Layer*
*Context gathered: 2026-06-29*
