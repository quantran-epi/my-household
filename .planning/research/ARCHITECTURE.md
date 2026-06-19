# Architecture Research

**Domain:** Integrating a reusable sheet-picker layer into an existing React 18 + RTK + Ant Design 5 local-first PWA
**Researched:** 2026-06-19
**Confidence:** HIGH (Sheet/FastOverlay/Select/DatePicker/SmartForm sources read)

> **Integration, not rewrite.** The new picker layer is built ON the existing `@components/Sheet` (re-exported from `@components/FastOverlay`). It reuses the FastOverlay `createPortal` + z-index stacking singletons + body-scroll-lock + escape-close that v1.0 already shipped. No new persisted root, no new global state, no AntD removal. The four components are drop-in-shaped replacements that keep the AntD `Form` validation contract.

## Where the new code lives

```
src/Components/
  FastOverlay/FastOverlay.tsx   # EXISTING — extend Sheet base with grabber + drag + safe-area
  Sheet/index.ts                # EXISTING re-export
  SheetPicker/                  # NEW — the picker layer
    SheetSelect.tsx
    SheetMultiSelect.tsx
    SheetDatePicker.tsx
    SheetActionMenu.tsx
    SheetPicker.shared.tsx      # shared row/checkmark/search/header primitives
    index.ts                    # barrel → exported via @components alias
  Form/
    Select/Select.tsx           # EXISTING AntD wrapper — call sites migrate AWAY from this
    DatePicker/DatePicker.tsx   # EXISTING AntD wrapper — call sites migrate away
```

The `@components` path alias is already in use (`@components/Sheet`, `@components/FastOverlay`). Add `@components/SheetPicker`.

## Component API design (drop-in contract)

Each component honors a controlled `value` / `onChange` so it slots into both standalone call sites and AntD `Form.Item`.

```ts
// SheetSelect — replaces <Select>
type SheetSelectProps<T> = {
  value?: T;
  onChange?: (value: T) => void;       // Form.Item injects this
  options: { label: ReactNode; value: T; disabled?: boolean; group?: string }[];
  placeholder?: ReactNode;
  showSearch?: boolean;
  allowClear?: boolean;
  disabled?: boolean;
  id?: string;                          // Form.Item injects
  status?: 'error' | 'warning';         // Form.Item injects via useStatus
  title?: ReactNode;                    // sheet header
  'data-testid'?: string;
};

// SheetMultiSelect — replaces <Select mode="multiple"|"tags">
//   value: T[]; onChange: (T[]) => void; draft committed on "Xong"

// SheetDatePicker — replaces <DatePicker>
//   value?: Dayjs; onChange?: (Dayjs | null) => void;  // MUST stay Dayjs
//   disabledDate?, showTime?, format?

// SheetActionMenu — replaces <Dropdown> overflow menus
//   actions: { key; label; icon?; danger?; disabled?; onSelect: () => void }[]
//   trigger element + open state (or render-prop trigger)
```

The visible part of a picker is a **trigger** (a button/field showing the current value) plus the Sheet it opens. Migration replaces the AntD control with `<SheetSelect .../>`; the trigger renders the chosen label like AntD's collapsed select box.

## Form / SmartForm integration

- `SmartFormItem` is a thin pass-through to `AntForm.Item` (verified: it just spreads props). AntD `Form.Item` clones its single child and injects `value`, `onChange`, `id`, and (via `useStatus`) status. **No SmartForm change needed** — the picker just has to accept those props and render a single controlled child.
- For Form-bound date fields, `onChange(Dayjs)` matches what `Form.Item` expects from AntD `DatePicker` today, so validation rules (`required`, date range) keep working unchanged.
- Standalone (non-Form) sites already own state and pass `value`/`onChange` — same contract.

## Reuse of the existing overlay system

- **Portal + backdrop + z-index:** `SheetPicker` components render `<Sheet>`; they inherit `useResolvedOverlayZIndex` stacking (base 1200, +20 per stacked overlay). A picker opened from inside another sheet (e.g. a Select inside a meal-edit sheet) stacks correctly via the same token mechanism — no manual z-index.
- **Body scroll lock & escape:** inherited from Sheet (`useBodyScrollLock`, `useEscapeClose`).
- **Important conflict to retire:** the existing AntD `Select`/`DatePicker` wrappers force `zIndex: 4200` on their popups (above the 1200-base overlays). Once a site converts to a Sheet picker, that popup z-index hack is gone — but during migration, an unconverted AntD popup opened from inside a Sheet could float above it. Convert per-screen to avoid mixed-stack artifacts.

## Gesture / drag state ownership

- Drag-to-dismiss and snap state is **local to the Sheet base component** (a `translateY` in component state driven by `onPointerDown/Move/Up` on the grabber+header), NOT in Redux and NOT in the FastOverlay stack singletons.
- On release past a threshold → call the existing `onClose`. This keeps the FastOverlay close lifecycle authoritative; drag is just a new way to trigger `onClose`.
- The scroll-vs-drag disambiguation (only drag when the scroll container is at `scrollTop===0`) lives in the same base component.

## iOS visual tokens

- **Recommendation: a thin CSS-variable layer + targeted AntD `ConfigProvider` token extension**, not a full theme rewrite.
  - Define `--ios-radius`, `--ios-gap`, type-scale, and sheet-surface vars in a single tokens file (e.g. `src/Common/Styles/iosTokens.ts` or a CSS file imported once).
  - Where AntD components remain, extend the existing `ConfigProvider theme.token` (border radius, control height ≥44, font sizes) so AntD and the new pickers look consistent.
- **Safe-area is applied at two levels:** (1) shell-level — the app shell / sticky bottom-nav already from v1.0 gets `env(safe-area-inset-bottom)`; (2) per-sheet — the Sheet base adds bottom safe-area padding so sticky Done/CTA buttons clear the home indicator. Requires `<meta name="viewport" content="...,viewport-fit=cover">` (check/添加 in `public/index.html`).

## Suggested build order (avoids big-bang risk over ~118 sites)

1. **Foundation — extend the Sheet base.** Add grabber, drag-to-dismiss, scroll/drag disambiguation, safe-area padding, snap (optional) to `FastOverlay` Sheet. Prove with Jest + an e2e drag/dismiss spec. No call-site changes yet.
2. **Picker layer.** Build SheetSelect, SheetMultiSelect, SheetDatePicker, SheetActionMenu + shared primitives, each with Form-binding tests. Still no mass migration.
3. **iOS tokens + safe-area shell.** Land the token layer and viewport-fit/safe-area shell padding once, app-wide.
4. **Migrate high-traffic modules** (wizard, Home, ScheduledMeal, ShoppingList) screen-by-screen, converting all pickers per screen together so no screen has a mixed old/new stack. e2e per screen.
5. **Long-tail migration** (Dishes, Ingredient, DishSuggester, admin/backup/settings) — the remaining Select/DatePicker/Dropdown sites.
6. **Cleanup** — once no call site imports the old AntD `Select`/`DatePicker` wrappers, remove the z-index 4200 popup hacks and dead wrapper code.

Keeping old and new working during migration is automatic: both render through the same portal/z-index system; converting whole screens at a time prevents intra-screen stacking conflicts.

## Integration points (summary)

| Integration point | New vs Modified | Notes |
|--------------------|-----------------|-------|
| `FastOverlay` Sheet base | Modified | Add grabber/drag/safe-area/snap |
| `src/Components/SheetPicker/*` | New | The four picker components + shared primitives |
| AntD `Form.Item` binding | Reused | value/onChange/id/status contract; no SmartForm change |
| FastOverlay z-index singletons | Reused | Nested-sheet stacking already handled |
| `ConfigProvider theme.token` | Modified | Radius/control-height/type tokens for AntD-consistency |
| `public/index.html` viewport | Modified | `viewport-fit=cover` for safe-area |
| Old `Form/Select` + `Form/DatePicker` wrappers | Deprecated → removed | After all call sites migrate |

## Sources

- `src/Components/FastOverlay/FastOverlay.tsx` — Sheet/Modal/Drawer shells, z-index stacking, scroll-lock, escape (HIGH)
- `src/Components/SmartForm/SmartFormItem/*` — confirmed thin pass-through to AntForm.Item (HIGH)
- `src/Components/Form/Select/Select.tsx`, `Form/DatePicker/DatePicker.tsx` — existing wrappers, popup z-index 4200 (HIGH)
- `.planning/codebase/ARCHITECTURE.md`, `CONVENTIONS.md` — feature-module + selectors-only + component-wrapper conventions

---
*Architecture research for: sheet-picker layer integration*
*Researched: 2026-06-19*
