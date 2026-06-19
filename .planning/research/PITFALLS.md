# Pitfalls Research

**Domain:** Building gesture-driven iOS bottom-sheet pickers and converting ~118 AntD picker sites in a large React + AntD PWA
**Researched:** 2026-06-19
**Confidence:** HIGH (codebase-verified hazards); MEDIUM (iOS-Safari edge timing)

> **Dominant risk class: silent behavior regression across ~118 heterogeneous picker sites**, several living in 1,300–2,000-line files, with `strict:false`/`target:es5` so the compiler will NOT catch null/value-type mistakes. Second risk class: iOS-Safari touch/viewport quirks that make a hand-rolled drag sheet feel broken. The roadmap must front-load a tested base + picker layer, then migrate whole screens at a time.

## A. iOS Safari / PWA gotchas (building the sheet base)

| Pitfall | Warning sign | Prevention | Owning phase |
|---------|-------------|------------|--------------|
| Momentum scroll vs sheet-drag conflict | Dragging the sheet also scrolls its list, or list won't scroll | Only begin sheet-drag when the scroll container `scrollTop === 0` and the gesture is downward; otherwise let native scroll win | Foundation (Sheet base) |
| `100vh` URL-bar bug | Full-height sheet hides content under the Safari toolbar / clips Done button | Use `100dvh` (with `svh`/`vh` fallback); sheet already uses `min(85vh,720px)` — switch to `dvh` | Foundation |
| `position: fixed` + virtual keyboard | Search field focus pushes/floats the sheet, keyboard covers input | Focus-scroll the input into view; consider `visualViewport` resize handling; keep search at sheet top | Picker layer (search) |
| `touch-action` / passive listeners | `preventDefault` warnings; drag jitter | Set `touch-action: none` on the grabber; use pointer events with `setPointerCapture`; non-passive only where needed | Foundation |
| Body scroll bleed behind sheet | Background scrolls under the open sheet | Already handled by `useBodyScrollLock` — keep it; verify on iOS (overflow:hidden can be weak on iOS, may need position-fix fallback) | Foundation |
| `-webkit-overflow-scrolling` / rubber-band | Sheet content rubber-bands and triggers drag-close | Constrain overscroll (`overscroll-behavior: contain`) on the scroll container | Foundation |
| Safe-area not applied | Done button sits under the home indicator | `padding-bottom: env(safe-area-inset-bottom)`; needs `viewport-fit=cover` meta | Foundation / shell |
| `prefers-reduced-motion` | Drag/animation ignores accessibility setting | FastOverlay already honors it — keep drag transition inside that guard | Foundation |

## B. AntD-specific traps (replacing Form-bound controls)

| Pitfall | Warning sign | Prevention | Owning phase |
|---------|-------------|------------|--------------|
| Losing Form validation binding | Field stops validating / value not in `form.getFieldsValue()` after swap | New control MUST accept injected `value`/`onChange`/`id`/`status` and render a single child; test a Form submit per picker type | Picker layer |
| Losing `Select` features | `showSearch`, `mode="multiple"`, `mode="tags"`, `allowClear`, `labelInValue`, `OptGroup` silently dropped | Inventory each Select's props before converting; SheetSelect/MultiSelect must cover search, multi, clear, groups; document any `tags`/`labelInValue` site that needs special handling | Picker layer + migration |
| DatePicker value-type mismatch | Date saved as wrong type → runtime crash or invalid stored date | AntD 5 DatePicker emits **Dayjs**. SheetDatePicker MUST emit `Dayjs`. But `DateHelper.ts` uses **moment** — never pass a Dayjs into a moment-expecting helper without conversion. Audit each date site's downstream consumer | Picker layer + migration |
| `RangePicker` complexity | Range sites break when naively converted | Defer RangePicker conversion to last; keep AntD RangePicker until a dedicated range sheet exists | Long-tail migration |
| `getPopupContainer`/z-index 4200 leftover | Converted screen still has a floating AntD popup above the sheet | Convert ALL pickers on a screen together; remove the 4200 popup hack only after the wrapper is unused | Migration + cleanup |
| Controlled vs uncontrolled drift | Picker shows stale value or won't update | Always controlled (`value` from props); never hold an internal source-of-truth except the multi-select draft | Picker layer |

## C. Migration risk (~118 sites, big files, loose TS)

| Pitfall | Warning sign | Prevention | Owning phase |
|---------|-------------|------------|--------------|
| Big-bang conversion | One giant PR touching 118 sites, unreviewable, regressions everywhere | Phase it: base → layer → tokens → high-traffic screens → long tail. Whole-screen units, atomic commits | All migration phases |
| Giant files hide pickers | A `<Select>` buried in `SmartMealPlanner.screen.tsx` (1997 lines) missed or mis-wired | Grep-driven inventory (`<Select`, `<DatePicker`, `<Dropdown`) with a checklist; tick each site as converted | Planning + migration |
| `strict:false` / `es5` masks null bugs | `value` is `undefined` and the picker throws only at runtime on a real device | Defensive prop handling (normalize `undefined`); add per-screen e2e; consider local `strictNullChecks` on new files | Picker layer |
| `any` casts around legacy data | Option values typed `any`; wrong key compared | Type SheetSelect generically `<T>`; avoid `any` in the new layer even though the codebase tolerates it | Picker layer |
| Lost capability = milestone failure | A converted screen can no longer search a long list / pick a range | "No capability loss" is a hard gate (matches project constraint); per-screen UAT against the original behavior | Verification |
| Test net too thin for a refactor | Conversion "looks fine" but breaks an untested flow | Add interaction e2e for each picker TYPE up front; reuse v1.0 e2e baselines per screen | Foundation + migration |

## D. Stacking / nesting (the FastOverlay system)

| Pitfall | Warning sign | Prevention | Owning phase |
|---------|-------------|------------|--------------|
| Picker-in-sheet stacking | A SheetSelect opened from inside a meal-edit Sheet renders behind it | Use the existing `useResolvedOverlayZIndex` token stacking (don't pass explicit zIndex); verify a nested-sheet e2e | Foundation |
| Drag-close wrong layer | Dragging the top sheet closes the one beneath | Drag state is local per Sheet instance; `onClose` only affects that instance | Foundation |
| Multiple sheets + scroll-lock restore | Closing an inner sheet wrongly unlocks body scroll while outer still open | Verify `useBodyScrollLock` ref-counts or is per-instance idempotent; test stacked open/close | Foundation |

## E. Accessibility / focus

| Pitfall | Warning sign | Prevention | Owning phase |
|---------|-------------|------------|--------------|
| Focus not trapped in sheet | Tab moves to background controls | Sheet has `role="dialog" aria-modal` — add focus trap + initial focus | Foundation |
| Checkmark-only selection state | Screen reader can't tell selected | `aria-selected`/`aria-checked` on rows, not just a visual check | Picker layer |
| Grabber not labeled | Drag affordance invisible to AT | Grabber decorative; provide a real close button (already exists) + Done | Foundation |

## Top risks ranked

1. **Value-type / Form-binding regressions** (B) — most likely to cause real, shipped bugs because the compiler won't catch them. Mitigation: tested picker layer with explicit Form-submit + value-type tests BEFORE any migration.
2. **Scroll-vs-drag disambiguation on iOS** (A) — the behavior most likely to feel "broken/janky." Mitigation: get it right in the Foundation phase with a device/e2e test; don't migrate screens until the base feels native.
3. **Big-bang migration over giant files** (C) — process risk. Mitigation: grep inventory + whole-screen atomic conversion + per-screen e2e.

## Sources

- `src/Components/FastOverlay/FastOverlay.tsx` — current scroll-lock, escape, z-index stacking, `min(85vh)` height, no drag/safe-area yet (HIGH)
- `src/Components/Form/Select/Select.tsx` — showSearch/multiple/tags/allowClear/OptGroup surface to preserve; popup z-index 4200 (HIGH)
- `src/Components/Form/DatePicker/DatePicker.tsx` — AntD DatePicker (Dayjs), popup z-index 4200 (HIGH)
- `src/Common/Helpers/DateHelper.ts` — uses **moment**, the moment/dayjs split hazard for date conversion (HIGH)
- `.planning/codebase/CONCERNS.md` — 800–2000-line files, dual moment+dayjs, `strict:false`/`es5`, 69 `any` casts (HIGH)
- iOS Safari `dvh`/`svh`, `env(safe-area-inset-*)`, `visualViewport`, `overscroll-behavior` — web platform behavior

---
*Pitfalls research for: iOS sheet-picker build + 118-site conversion*
*Researched: 2026-06-19*
