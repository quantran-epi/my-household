# Phase 9: iOS Visual Baseline & Safe-Area Shell - Context

**Gathered:** 2026-06-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Define a lightweight iOS token baseline (spacing, corner radius, type scale, sheet surface) and wire it through the Phase 7/8 sheet + sheet-picker layer; convert the app shell to a true `viewport-fit=cover` safe-area layout so sticky bottom chrome (bottom nav, cooking pill, in-sheet CTAs) clears the home indicator app-wide; and enforce the ≥44px thumb-zone bar on every converted picker trigger and sheet row. Covers IOS-01, IOS-02, IOS-03.

**In scope:**
- A single source-of-truth token module the sheet/picker layer (and shell chrome) reads from (IOS-01).
- Safe-area correctness for the shell: bottom nav, cooking pill, content height math, sticky CTAs (IOS-02).
- A ≥44px enforcement pass on picker triggers and sheet rows built in Phase 8 (IOS-03).

**Out of scope:**
- Per-screen visual polish of Home/wizard/shopping/scheduled-meal/dishes/ingredient — that rides along with the Phase 10 (high-traffic) and Phase 11 (long-tail) conversions, not a separate skin pass here.
- Picker/call-site migrations (Phases 10-11). This phase touches the *shell* and the *shared picker layer*, not feature screens' picker sites.
- Full iOS system-aesthetic reskin (system fonts, segmented controls, inset-grouped tables) — explicitly out of v1.1 per PROJECT.md.
- Haptics / spring-motion (deferred milestone).
- `viewport-fit=cover` meta tag — already shipped in Phase 7 (`public/index.html:7`); this phase consumes it, does not re-add it.

</domain>

<decisions>
## Implementation Decisions

The user instructed "do what you think is best" for this phase. The decisions below are Claude's calls, grounded in the scouted codebase (inline-styles-everywhere, no CSS-modules, AntD `ConfigProvider` as the only existing theming surface, Phase 7/8 sheet aesthetic already locked).

### Token baseline format & location (the highest-leverage call)
- **D-01:** Ship the iOS baseline as a **typed TS constants module** (e.g. `src/Theme/iosTokens.ts` exported via an `@theme`/existing-alias barrel), NOT a CSS-variables file and NOT a CSS-modules system. Rationale: the entire codebase styles via inline `React.CSSProperties` objects (FastOverlay, BottomTabNavigator, Content, SheetPicker all do this) — a TS token object is directly consumable by every existing call site with zero new build/tooling, and is greppable/type-checked. A parallel CSS-variable layer would be a second source of truth nothing currently reads.
- **D-02:** The token module is the **single source of truth**; the existing Phase 7/8 magic numbers (sheet surface `linear-gradient(180deg,#f5f0ff 0%,#ffffff 42%)`, `borderRadius: 18`, primary `#7436dc`/hover `#8f46f7`/active `#5e2bbf`, ease `cubic-bezier(0.16,1,0.3,1)`) are **promoted into named tokens**, then the sheet + sheet-picker layer is refactored to read them. Do NOT invent a new visual language — codify what Phases 7/8 already shipped so it's reusable, consistent, and tunable in one place.
- **D-03:** Token categories to define (keep it lightweight — YAGNI): **spacing** scale, **radius** scale (incl. the 18px sheet top-radius and trigger/row radii), **type scale** (sizes/weights/line-heights; base font is already 18px via AntD `fontSize`), **touch-target** constants (the 44px bar + comfortable row height), **surface** tokens (sheet gradient, backdrop, card bg, hairline border color), and **z-index** references (reuse the existing token stacking, do not fork it). No color-system overhaul beyond promoting the purple primary set already in `App.tsx`.
- **D-04:** Feed the **core scalar tokens that AntD already owns** (primary color set, base font size, radius) into the `ConfigProvider` `theme.token` in `App.tsx` from the same module, so AntD-rendered surfaces (incl. the hosted calendar panel inside SheetDatePicker, D-08 of Phase 8) and our hand-built sheet chrome stay visually aligned from one definition. Tokens AntD has no slot for (sheet gradient, safe-area, touch-target) live only in the TS module.

### Safe-area shell strategy
- **D-05:** Replace the **hardcoded layout math** in `src/Components/Layout/Content/Content.tsx` (`HEADER_HEIGHT = 76`, `BOTTOM_NAV_HEIGHT = 80`, mixed `100vh`/`100dvh`) with token-driven heights that **subtract `env(safe-area-inset-top/bottom)`** and use `dvh` as the primary unit (`vh` fallback only). Today the content box can sit under the iOS toolbar/home indicator and the two height rules disagree — this is the core IOS-02 fix.
- **D-06:** Fix the **CookingPill** (`src/Routing/Shell/CookingPill.tsx`): it is `position: fixed; bottom: 76` with **no safe-area inset** — on a notched device it rides into the home indicator and can collide with the bottom nav. Rebase its `bottom` offset on the bottom-nav height **plus** `env(safe-area-inset-bottom)` from tokens. The bottom nav already handles its own inset (`BottomTabNavigator.tsx:37`) and is the reference implementation to match.
- **D-07:** Establish a **single safe-area convention** (a `safeAreaInset*` token / tiny helper returning the `calc(... + env(safe-area-inset-*))` strings) and route all sticky chrome through it — bottom nav, cooking pill, and any sticky in-sheet/in-page bottom CTA. One pattern, applied consistently, rather than per-file `env()` literals (which currently vary: `8px+`, `16px+`, `92px+`, etc.). Left/right insets covered where horizontally-pinned elements exist (e.g. landscape), but bottom is the priority for IOS-02.

### ≥44px thumb-zone enforcement
- **D-08:** Treat IOS-03 as a **verification + token-application pass**, not new components: Phase 8 already built picker rows "to the ≥44px bar." This phase pins that bar as a token (`touchTarget.min = 44`), applies it to the SheetPicker trigger height and sheet-row min-height, and adds a **test/assertion** that triggers and rows meet it. Surface the bar to the bottom-nav buttons too (current side buttons are `height: 52` — already compliant; just confirm via token).
- **D-09:** Scope the 44px guarantee to **the shared picker layer + shell chrome built/owned in Phases 7-9** (triggers, sheet rows, nav buttons, action-sheet rows). Per-feature-screen tap targets are audited as those screens convert in Phases 10-11 — not retro-swept app-wide here (that would be scope creep into the conversion phases).

### Claude's Discretion
- Exact token *values* (the spacing/radius/type ramps, the precise comfortable row height above 44px, the named-token vocabulary) are Claude's call — anchor them to the iOS HIG (8pt-ish spacing rhythm, 44pt min touch target) and to the values Phases 7/8 already shipped so nothing visually regresses. The `/gsd:ui-phase` UI-SPEC will lock the concrete ramp.
- Module/alias naming (`src/Theme/` vs `src/Tokens/`, `@theme` vs `@tokens`) and whether the safe-area helper is a function vs a set of string constants are Claude's call — match existing barrel/alias conventions (`@components/*`).
- Whether `App.css`'s `min-height: 100vh` and the `ErrorBoundary` `100vh` get upgraded to `dvh`+inset is Claude's discretion (low-risk consistency wins; do them if cheap).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` §"Phase 9: iOS Visual Baseline & Safe-Area Shell" — phase goal + 3 success criteria.
- `.planning/REQUIREMENTS.md` §IOS (IOS-01, IOS-02, IOS-03) — the three requirements this phase delivers. (CONV-* picker conversions are Phases 10-11 — do NOT pull forward.)

### Phases 7 & 8 this baseline must codify (read before defining tokens)
- `.planning/phases/07-native-sheet-foundation/07-CONTEXT.md` — Phase 7 decisions: D-07 added `viewport-fit=cover` meta (already shipped) and scoped app-shell/nav safe-area explicitly to *this* phase (IOS-02); the sheet surface aesthetic + `dvh` switch this phase tokenizes.
- `.planning/phases/08-sheet-picker-component-layer/08-CONTEXT.md` — Phase 8 decisions: pickers built "to the ≥44px bar pending Phase 9" (IOS-03 lands here), and the Phase 7 aesthetic constants the pickers inherit (which D-02 promotes to tokens).

### v1.1 research (technical guardrails — already locked, do not re-litigate)
- `.planning/research/SUMMARY.md` — **no new runtime deps**; CSS `env()` + `100dvh` for layout is the locked safe-area approach; build on React + AntD primitives already present.
- `.planning/research/PITFALLS.md` §A (iOS Safari/PWA) — `100vh` URL-bar bug (use `dvh`), safe-area insets, why the shell math must not assume a fixed viewport.

### Code under change (shell + shared layer)
- `src/Components/Layout/Content/Content.tsx` — hardcoded `HEADER_HEIGHT=76`/`BOTTOM_NAV_HEIGHT=80` + mixed `vh`/`dvh` height math; D-05 target.
- `src/Routing/Shell/CookingPill.tsx` — `position:fixed; bottom:76` with NO safe-area inset; D-06 target.
- `src/Routing/Shell/BottomTabNavigator.tsx` — already uses `env(safe-area-inset-bottom)` (line 37) and ≥44px buttons (line 79, `height:52`); the **reference implementation** for the safe-area convention (D-07) and the source of the magic numbers to tokenize.
- `src/App.tsx` — `ConfigProvider theme.token` (primary `#7436dc`, hover/active, `fontSize:18`, `zIndexPopupBase:4000`, per-component `zIndexPopup:4200`); D-04 feeds core tokens here.
- `src/Components/FastOverlay/FastOverlay.tsx` — sheet surface gradient, `borderRadius:18`, `env(safe-area-inset-bottom)` padding (line 140), `dvh` usage; the aesthetic D-02 promotes to tokens; the sheet layer that must read from them.
- `src/Components/SheetPicker/` (Phase 8) — trigger height + sheet-row min-height get the 44px token (D-08).
- `public/index.html:7` — `viewport-fit=cover` already present; do NOT re-add (read-only reference).

### Conventions
- `.planning/codebase/CONVENTIONS.md` — inline `React.CSSProperties` styling (no CSS modules), PascalCase component folders + barrel `index.ts`, `@components/*` alias mapping (token module/alias follows this), union string literals over enums.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **BottomTabNavigator safe-area pattern** (`:37`, `padding: "16px 10px calc(8px + env(safe-area-inset-bottom))"`): the working reference for D-07's safe-area convention; the cooking pill and any sticky CTA should converge on this `calc(... + env())` shape.
- **`useResolvedOverlayZIndex`** (FastOverlay): existing token-based z-index stacking — the token module references it, does NOT fork or re-define z-index (D-03).
- **AntD `ConfigProvider theme.token`** (`App.tsx:22-40`): the single existing theming surface — core scalar tokens flow in here (D-04) so AntD-rendered surfaces (incl. SheetDatePicker's hosted calendar) match.
- **`dvh` + `env()` already in use** (FastOverlay `:140`, Content `:22`, UserGuide screens): the pattern exists; this phase makes it consistent and token-driven rather than per-file literals.

### Established Patterns
- Inline-styles-everywhere → token module MUST be a plain TS object of `React.CSSProperties`-compatible values + string fragments, not CSS classes/variables (D-01).
- Phase 7/8 aesthetic constants (`#7436dc`, `#f5f0ff→#ffffff` gradient, `18px` radius, `cubic-bezier(0.16,1,0.3,1)`) are currently duplicated as literals across FastOverlay/BottomTabNavigator/SheetPicker — D-02 centralizes them.
- Magic-number layout constants (`HEADER_HEIGHT`, `BOTTOM_NAV_HEIGHT`, pill `bottom:76`) are scattered and inconsistent — tokenizing them is the cleanup that makes the safe-area math correct.

### Integration Points
- Token module → consumed by FastOverlay, SheetPicker layer, Content, BottomTabNavigator, CookingPill, and (core scalars) App.tsx ConfigProvider.
- Safe-area helper → bottom nav (already), cooking pill (new), Content height math (new), sticky CTAs.
- Verification: reuse the Phase 7 touch-capable Playwright project for the home-indicator-clearance and ≥44px checks on a notched WebKit/iPhone descriptor; jsdom/unit assertions for token application where DOM-measurable.

</code_context>

<specifics>
## Specific Ideas

- "Lightweight" is the explicit milestone framing (PROJECT.md): a token baseline + sheet styling, NOT a wholesale visual-language swap. Resist building a full design-system; promote-what-exists is the bar.
- The native feel should be felt app-wide via the *shell* (chrome clears the home indicator, consistent thumb-zone) even before the feature screens convert in Phases 10-11.
- Anchor numeric choices to iOS HIG: ~8pt spacing rhythm, 44pt minimum touch target, comfortable list-row heights.

</specifics>

<deferred>
## Deferred Ideas

- **Per-screen iOS visual polish** (Home, wizard, shopping, scheduled-meal, dishes, ingredient): applied as those screens convert — Phases 10 (high-traffic) and 11 (long-tail), not here.
- **App-wide tap-target retro-sweep** of existing feature-screen controls: audited per-screen during conversion (Phases 10-11), not a blanket pass this phase (D-09).
- **Full iOS system-aesthetic reskin** (system fonts, segmented controls, inset-grouped tables): out of v1.1 entirely (PROJECT.md out-of-scope).
- **Haptics & spring-motion transitions**: deferred milestone (MOTION-01/02).

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 9-iOS Visual Baseline & Safe-Area Shell*
*Context gathered: 2026-06-30*
