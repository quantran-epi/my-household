# Stack Research

**Domain:** Native-iOS-feel sheet-picker conversion for an existing local-first meal-planning PWA (React 18 + Ant Design 5 + RTK, CRACO, Workbox, GitHub Pages, iOS-focused)
**Researched:** 2026-06-19
**Confidence:** HIGH (codebase-verified; existing Sheet/FastOverlay primitive read in full)

> **Headline: add ZERO runtime dependencies.** The existing `@components/Sheet` (a `createPortal` bottom-anchored overlay in `src/Components/FastOverlay/FastOverlay.tsx`) already provides backdrop, z-index stacking tokens, body-scroll-lock, escape-close, and a CSS keyframe entrance animation. Drag-to-dismiss, snap points, a grabber handle, and safe-area insets are all achievable with React pointer events + CSS `env()` — no gesture/animation library is justified for a PWA where bundle size is a stated constraint. The date picker is the only place a small library is even worth *considering*, and the recommendation is still to avoid one.

## Recommended Stack

### Core Technologies (all already installed)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | 18.2 | Pointer-event handlers (`onPointerDown/Move/Up`) drive drag-to-dismiss + snap; `setPointerCapture` keeps drag tracking off-element | Already the runtime; Pointer Events unify mouse/touch and work in iOS Safari 13+ |
| Ant Design | 5.16 | Source of the components being replaced (`Select`, `DatePicker`, `Dropdown`) and the `Form` the new pickers must bind to | Constraint: no re-platform. New pickers replace AntD controls but keep AntD `Form` validation |
| dayjs | 1.11 | AntD 5's native date type. `SheetDatePicker` value type MUST stay `Dayjs` to be a drop-in for AntD `DatePicker` | AntD 5 already uses dayjs internally; staying on it avoids a value-type mismatch at every call site |
| CSS `env(safe-area-inset-*)` + `100dvh`/`100svh` | native | iOS safe-area insets (notch/home indicator) and the iOS-Safari URL-bar viewport bug | Zero-dependency, the iOS-correct approach; requires `<meta viewport ... viewport-fit=cover>` |
| TypeScript | 4.9 | Typed picker props | Note: `strict:false`, `target:es5` (see PITFALLS — null-safety not compiler-enforced) |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none required) | — | — | The conversion needs no new runtime dep. Resist adding one. |
| @use-gesture/react | 10.x (`/pmndrs/use-gesture`) | Richer drag/inertia binding | ONLY if hand-rolled pointer-drag proves insufficient for momentum/inertia (it won't for tap-to-select sheets). ~5–8KB gz. Deferred. |
| vaul | 1.x | Pre-built React drag-to-dismiss bottom sheet | Considered and rejected: a parallel sheet implementation that would duplicate/fight the existing FastOverlay portal + z-index stacking. Adopting it means re-doing v1.0's Sheet work. |

### Development Tools (already configured)

| Tool | Purpose | Notes |
|------|---------|-------|
| Playwright (e2e) | The safety net for a ~118-site conversion | Existing specs in `tests/e2e/`; add per-picker-type interaction specs before mass migration |
| Jest + RTL | Component-level proof for the new picker layer | `Sheet.test.tsx` is the existing pattern to follow |
| CRACO / react-scripts 5 | Build | No config change needed for pointer events or `env()` CSS |

## Picker-by-picker stack decision

| Replacing | Count (tags) | New component | Underlying tech |
|-----------|-------|---------------|-----------------|
| `<Select>` single | ~80 total `<Select` | `SheetSelect` | Sheet + scrollable option list, tap row → check |
| `<Select mode="multiple"/"tags">` | (subset of above) | `SheetMultiSelect` | Sheet + checkbox rows + "Xong" confirm |
| `<DatePicker>` | ~23 | `SheetDatePicker` | Sheet hosting AntD inline calendar (or native `<input type=date>`); value stays `Dayjs` |
| `<Dropdown>` (overflow/action menus) | ~15 | `SheetActionMenu` | Sheet + action rows + destructive styling + separate "Hủy" |

## Date/time picker — the one real decision

The app has BOTH `moment` (used in `src/Common/Helpers/DateHelper.ts`) and `dayjs` (AntD 5's type). **`SheetDatePicker` must accept/emit `Dayjs`** to match AntD `DatePicker` call sites; do NOT introduce a third date idiom. Three viable hosts inside the sheet, in preference order:

1. **AntD `DatePicker` rendered `open` + inline inside the sheet body** (`getPopupContainer` → the sheet) — reuses AntD's dayjs calendar, zero new dep, preserves min/max/format props. *Recommended.*
2. **Native `<input type="date">` / `datetime-local`** — true iOS wheel UI for free, but value is a string (needs `dayjs()` parse/format at the boundary) and loses AntD format/locale control.
3. A JS wheel-picker library — rejected (new dep, another date model).

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Hand-rolled pointer-drag on existing Sheet | `@use-gesture/react` + react-spring | Only if you later need flick/inertia physics; overkill for select/action sheets |
| Extend existing `@components/Sheet` | `vaul` bottom-sheet library | Never here — would duplicate FastOverlay and re-litigate z-index stacking |
| AntD inline calendar in a sheet | Native `<input type=date>` | If you want the literal iOS system wheel and can absorb string↔Dayjs conversion |
| CSS `env()` safe-area | JS-measured insets | Never — `env()` is the supported, repaint-free path |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `vaul` / `react-spring-bottom-sheet` | Parallel sheet stack; duplicates FastOverlay portal + z-index singletons built in v1.0 | Extend `@components/Sheet` |
| A JS date-wheel library | Third date model on top of moment+dayjs; new bundle weight | AntD inline calendar (Dayjs) inside the sheet |
| `100vh` for full-height sheets | iOS Safari URL bar makes `100vh` overflow under the toolbar | `100dvh` with `min(85dvh, …)`; `svh` fallback |
| Adding `framer-motion` | ~30KB+ for animations the CSS keyframes already cover; motion polish is OUT OF SCOPE this milestone | Existing `@keyframes` in FastOverlay + CSS transitions |
| Migrating `moment`→`dayjs` as part of this milestone | Big risky cross-cutting change unrelated to pickers | Keep DateHelper on moment; new pickers speak Dayjs (matches AntD) |

## Stack Patterns by Variant

**If a picker is inside an AntD `Form.Item` (SmartForm):**
- The new control must expose `value` + `onChange` (and ideally accept `id`, `status`) so `Form.Item` binds it like any custom control.
- Because `SmartFormItem` is a thin pass-through to `AntForm.Item`, no SmartForm change is needed — only the picker must honor the controlled contract.

**If a picker is standalone (not Form-bound):**
- Same `value`/`onChange` contract; the call site owns state. Most ScheduledMeal/ShoppingList pickers are this shape.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| antd@5.16 | dayjs@1.11 | AntD 5 date components are dayjs-native; keep `SheetDatePicker` on Dayjs |
| react@18.2 | Pointer Events | `onPointerDown/Move/Up` + `setPointerCapture` work in iOS Safari 13+ |
| CRACO/react-scripts 5 | CSS `env()` / `dvh` | No build change; `dvh`/`svh` need iOS 15.4+ (acceptable for iOS-focused PWA), keep `vh` fallback |

## Sources

- `src/Components/FastOverlay/FastOverlay.tsx` — read in full: Sheet/Modal/Drawer shells, z-index stacking tokens, body-scroll-lock, escape-close, keyframe animations (HIGH confidence)
- `src/Components/Form/DatePicker/DatePicker.tsx`, `src/Components/Form/Select/Select.tsx` — existing AntD wrappers, popup z-index 4200 (HIGH)
- `package.json` — antd 5.16, dayjs 1.11, moment 2.30, react 18.2, typescript 4.9 (HIGH)
- `tsconfig.json` — target es5, strict false (HIGH)
- `/pmndrs/use-gesture` (Context7) — gesture library exists if ever needed; not recommended now
- iOS Safari `env(safe-area-inset-*)`, `dvh`/`svh` — standard web platform behavior

---
*Stack research for: native iOS sheet-picker conversion*
*Researched: 2026-06-19*
