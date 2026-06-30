# Phase 9: iOS Visual Baseline & Safe-Area Shell - Research

**Researched:** 2026-06-30
**Domain:** iOS-feel design tokenization (typed TS constants) + CSS safe-area / `dvh` shell correctness in a React 18 + AntD 5 PWA
**Confidence:** HIGH (codebase-verified; the one load-bearing external fact — `dvh` + `env()` interaction — confirmed against MDN/spec behavior)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Token baseline format & location**
- **D-01:** Ship the iOS baseline as a **typed TS constants module** (e.g. `src/Theme/iosTokens.ts` exported via an `@theme`/existing-alias barrel), NOT a CSS-variables file and NOT a CSS-modules system. Rationale: the entire codebase styles via inline `React.CSSProperties` objects — a TS token object is directly consumable by every existing call site with zero new build/tooling, and is greppable/type-checked. A parallel CSS-variable layer would be a second source of truth nothing currently reads.
- **D-02:** The token module is the **single source of truth**; the existing Phase 7/8 magic numbers (sheet surface `linear-gradient(180deg,#f5f0ff 0%,#ffffff 42%)`, `borderRadius: 18`, primary `#7436dc`/hover `#8f46f7`/active `#5e2bbf`, ease `cubic-bezier(0.16,1,0.3,1)`) are **promoted into named tokens**, then the sheet + sheet-picker layer is refactored to read them. Do NOT invent a new visual language — codify what Phases 7/8 already shipped.
- **D-03:** Token categories to define (keep it lightweight — YAGNI): **spacing** scale, **radius** scale (incl. the 18px sheet top-radius and trigger/row radii), **type scale** (sizes/weights/line-heights; base font already 18px via AntD `fontSize`), **touch-target** constants (the 44px bar + comfortable row height), **surface** tokens (sheet gradient, backdrop, card bg, hairline border color), and **z-index** references (reuse the existing token stacking, do not fork it). No color-system overhaul beyond promoting the purple primary set already in `App.tsx`.
- **D-04:** Feed the **core scalar tokens that AntD already owns** (primary color set, base font size, radius) into the `ConfigProvider` `theme.token` in `App.tsx` from the same module, so AntD-rendered surfaces (incl. the hosted calendar panel inside SheetDatePicker) and hand-built sheet chrome stay aligned from one definition. Tokens AntD has no slot for (sheet gradient, safe-area, touch-target) live only in the TS module.

**Safe-area shell strategy**
- **D-05:** Replace the **hardcoded layout math** in `Content.tsx` (`HEADER_HEIGHT = 76`, `BOTTOM_NAV_HEIGHT = 80`, mixed `100vh`/`100dvh`) with token-driven heights that **subtract `env(safe-area-inset-top/bottom)`** and use `dvh` as the primary unit (`vh` fallback only). The two height rules must agree. Core IOS-02 fix.
- **D-06:** Fix the **CookingPill**: `position: fixed; bottom: 76` with **no safe-area inset** — on a notched device it rides into the home indicator and can collide with the bottom nav. Rebase its `bottom` offset on bottom-nav height **plus** `env(safe-area-inset-bottom)` from tokens. BottomTabNavigator is the reference implementation.
- **D-07:** Establish a **single safe-area convention** (a `safeAreaInset*` token / tiny helper returning the `calc(... + env(safe-area-inset-*))` strings) and route all sticky chrome through it. One pattern, applied consistently. Bottom is the priority for IOS-02; left/right where horizontally-pinned elements exist.

**≥44px thumb-zone enforcement**
- **D-08:** Treat IOS-03 as a **verification + token-application pass**, not new components. Pin the 44px bar as a token (`touchTarget.min = 44`), apply it to SheetPicker trigger height and sheet-row min-height, add a **test/assertion**. Surface the bar to bottom-nav buttons too (already `height: 52` — confirm via token).
- **D-09:** Scope the 44px guarantee to **the shared picker layer + shell chrome built/owned in Phases 7-9** (triggers, sheet rows, nav buttons, action-sheet rows). Per-feature-screen tap targets audited in Phases 10-11 — not retro-swept app-wide here.

### Claude's Discretion
- Exact token *values* (the spacing/radius/type ramps, the precise comfortable row height above 44px, the named-token vocabulary) — anchor them to the iOS HIG (8pt-ish spacing rhythm, 44pt min touch target) and to the values Phases 7/8 already shipped so nothing visually regresses. **The UI-SPEC has now locked the concrete ramp — see below; treat UI-SPEC values as authoritative over this latitude.**
- Module/alias naming (`src/Theme/` vs `src/Tokens/`, `@theme` vs `@tokens`) and whether the safe-area helper is a function vs a set of string constants — match existing barrel/alias conventions (`@components/*`).
- Whether `App.css`'s `min-height: 100vh` and the `ErrorBoundary` `100vh` get upgraded to `dvh`+inset (low-risk consistency wins; do them if cheap).

### Deferred Ideas (OUT OF SCOPE)
- **Per-screen iOS visual polish** (Home, wizard, shopping, scheduled-meal, dishes, ingredient): applied as those screens convert — Phases 10/11, not here.
- **App-wide tap-target retro-sweep** of existing feature-screen controls: audited per-screen during conversion (Phases 10-11), not a blanket pass this phase (D-09).
- **Full iOS system-aesthetic reskin** (system fonts, segmented controls, inset-grouped tables): out of v1.1 entirely.
- **Haptics & spring-motion transitions**: deferred milestone (MOTION-01/02).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| IOS-01 | A lightweight iOS token baseline (spacing, corner radius, type scale, sheet surface) is defined and applied to the sheet-picker layer | UI-SPEC locks the concrete ramps (Spacing/Radius/Typography/Color/Surface tables). Architecture Pattern 1 (typed TS token module) + Pattern 4 (AntD ConfigProvider feed) show how to define it and wire the existing call sites (FastOverlay, SheetTrigger, SheetSelect, App.tsx). Code Examples give the module shape and a refactor diff. |
| IOS-02 | The app shell sets `viewport-fit=cover` and applies safe-area insets so sticky bottom chrome (nav, CTAs) clears the home indicator app-wide | `viewport-fit=cover` already shipped (`public/index.html:7` — verified). Pattern 2 (safe-area helper) + Pattern 3 (Content height math) + the `dvh`+`env()` confirmed behavior drive the Content.tsx (D-05) and CookingPill.tsx (D-06) fixes. Pitfalls 1-3 cover the double-count and unit traps. |
| IOS-03 | Every converted picker trigger and sheet row meets the ≥44px thumb-zone touch-target bar | Already-44 literals located: `SheetTrigger:29`, `SheetSelect:47`, `SheetActionMenu:39,63`; nav `52` at `BottomTabNavigator:79`. Validation Architecture maps the jsdom row-height assertions (pattern already exists in `SheetActionMenu.test.tsx:24`) + the WebKit/iPhone Playwright `mobile-safari` project for home-indicator clearance. |
</phase_requirements>

## Summary

This is a **brownfield codification phase, not a design phase**. Every value to be tokenized already ships in Phase 7/8 source; the deliverable is centralizing duplicated literals into one typed TS module (`src/Theme/iosTokens.ts`), feeding the AntD-owned scalars into the existing `ConfigProvider`, and fixing two concrete safe-area bugs in the shell. There are **zero new runtime dependencies** (locked by milestone research SUMMARY.md) and **zero new tooling** — the inline-`React.CSSProperties`-everywhere convention means a plain TS object of values and string fragments is directly consumable at every call site. `viewport-fit=cover` is already present in `public/index.html:7` (verified) and must not be re-added.

The technically load-bearing finding is the **`dvh` + `env(safe-area-inset-*)` relationship**, which governs the D-05 Content.tsx fix. With `viewport-fit=cover` set, `100dvh` spans the *entire* display including the region behind the home indicator and notch; it does NOT auto-subtract the safe area. So the correct content height is `calc(100dvh - headerHeight - bottomNavHeight - env(safe-area-inset-top) - env(safe-area-inset-bottom))` — and crucially the current code's bug is twofold: (1) the `height` rule uses `100vh` while `maxHeight` uses `100dvh` (they disagree, and `vh` includes the URL bar so content clips under the Safari toolbar), and (2) neither subtracts any inset, so on a notched device content sits under the toolbar/home-indicator. The fix establishes one `dvh`+`env()` convention and routes Content, CookingPill, and the bottom nav through it.

The 44px work (IOS-03) is the lowest-risk: the bar is *already met* at every in-scope call site (verified by grep). The phase pins it as a token, swaps the literals to read the token, and adds DOM-measurable assertions (jsdom for row min-height — a pattern that already exists in `SheetActionMenu.test.tsx`) plus a WebKit/iPhone Playwright check for real home-indicator clearance on the existing `mobile-safari` project.

**Primary recommendation:** Create `src/Theme/iosTokens.ts` as a typed `as const` object grouped by category (spacing/radius/type/color/surface/touchTarget/layout/safeArea/zIndex-refs); add an `@theme` alias to BOTH `tsconfig.json` paths AND `craco.config.js` webpack alias AND `package.json` jest `moduleNameMapper` (all three are required — see Pitfall 5); refactor App.tsx ConfigProvider + FastOverlay + SheetTrigger + SheetSelect + Content + CookingPill + BottomTabNavigator to read from it; implement a `safeAreaInset.bottom(base)` helper returning `calc(${base}px + env(safe-area-inset-bottom))` and route all sticky bottom chrome through it.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| iOS token baseline (TS constants) | Browser / Client (build-time module) | — | Pure compile-time constants consumed by React inline styles; no server involvement. This is a SPA/PWA with no SSR. |
| AntD `ConfigProvider theme.token` feed | Browser / Client | — | Runtime React context provider; theming applied client-side at render. |
| Safe-area insets (`env()`) + `dvh` height math | Browser / Client (CSS) | — | Resolved entirely by the WebKit/Safari layout engine from the `viewport-fit=cover` meta; no JS computation, no server. |
| Sticky chrome positioning (nav, pill, CTAs) | Browser / Client (CSS `position:fixed` + `calc/env`) | — | Pure CSS layout; reads inset values the UA exposes. |
| 44px touch-target enforcement + verification | Browser / Client (CSS) | — | Min-heights are static CSS; verification is DOM measurement (jsdom) + real-device layout (Playwright WebKit). |

**Note:** This is a single-tier client-only PWA (React 18 + RTK + AntD, served as static assets from `docs/`). There is no SSR/API/DB tier in scope. All Phase 9 work is Browser/Client.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.2.0 (installed) | Component/inline-style host for tokens | Already the app framework; tokens are plain TS consumed by `React.CSSProperties`. |
| antd | 5.16.1 (installed) | `ConfigProvider theme.token` is the only existing theming surface (D-04) | AntD 5's design-token system accepts `colorPrimary`, `fontSize`, `borderRadius`, etc.; feeding scalars here aligns AntD-rendered surfaces (incl. SheetDatePicker's calendar) with hand-built chrome. |
| typescript | 4.9.5 (installed) | `as const` typed token module | Gives greppable, type-checked tokens with no build step. Note `strict:false`/`target:es5` (see Pitfall 6). |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @playwright/test | 1.60.0 (installed) | WebKit/iPhone home-indicator-clearance + ≥44px real-device e2e | The `mobile-safari` project (`devices['iPhone 13']`, hasTouch+isMobile) already exists in `playwright.config.ts`. |
| react-scripts test (Jest + RTL + jsdom) | react-scripts 5.0.1 / @testing-library/react 13.4.0 | DOM-measurable token-application assertions | jsdom can read `el.style.minHeight === '44px'`; pattern already used in `SheetActionMenu.test.tsx:24-34`. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Typed TS constants module (D-01) | CSS custom properties (`--ios-*`) | **REJECTED by D-01.** Would be a second source of truth nothing inline-styles read; the codebase has no CSS-modules/Tailwind/PostCSS pipeline. Do NOT propose. |
| Typed TS constants module (D-01) | shadcn / Tailwind design system | **REJECTED by D-01 + UI-SPEC shadcn gate.** No `components.json`/Tailwind config present; initializing contradicts the locked decision. Do NOT propose. |
| Manual `calc(... + env())` strings per file | `safeAreaInset.bottom(base)` helper (D-07) | Helper is the locked single-convention; per-file literals are the current bug (insets vary: `8px+`, `16px+`, none). |

**Installation:** None. Zero new packages this phase (SUMMARY.md: "add zero runtime dependencies" — locked).

## Architecture Patterns

### System Architecture Diagram

```
                         src/Theme/iosTokens.ts  (single source of truth, D-02)
                         ┌─────────────────────────────────────────────────┐
                         │ spacing · radius · type · color · surface ·       │
                         │ touchTarget · layout(headerHeight/bottomNavHeight)│
                         │ safeAreaInset.bottom(base)/top(base)  · zIndexRef │
                         └───────────────┬──────────────────┬───────────────┘
            core scalars (D-04)          │                  │  full token object (inline styles)
   colorPrimary/Hover/Active, fontSize,  │                  │
   borderRadius, colorBorderSecondary    │                  ├──────────────┬─────────────┬──────────────┐
                         ▼               │                  ▼              ▼             ▼              ▼
            App.tsx ConfigProvider       │          FastOverlay     SheetTrigger   SheetSelect    BottomTabNavigator
            theme.token  ───────────────▶│          (sheet gradient, (44 min-h,    (44 row min-h) (52 btn, safe-area
              │                          │           18px radius,     6px radius)                   ref impl, D-07)
              │ themes AntD surfaces     │           ease, backdrop)
              ▼                          │
   SheetDatePicker calendar panel,       │   safe-area convention (D-07)
   all AntD inputs/popups                │   ┌──────────────────────────────────────┐
                                         └──▶│ calc(base + env(safe-area-inset-*))    │
                                             └───────┬───────────────┬───────────────┘
                                                     ▼               ▼
                                              Content.tsx       CookingPill.tsx
                                              (D-05 height       (D-06 bottom offset
                                               = dvh − header −   = bottomNavHeight +
                                               nav − insets)      env(inset-bottom))
                                                     ▲
                              public/index.html viewport-fit=cover (Phase 7, already shipped)
                              makes env(safe-area-inset-*) resolve to nonzero on notched devices
```

### Recommended Project Structure
```
src/
├── Theme/                  # NEW (Claude's discretion: Theme vs Tokens — Theme chosen, see Open Q)
│   ├── iosTokens.ts        # the typed `as const` token object (D-01/D-02/D-03)
│   ├── safeArea.ts         # safeAreaInset.bottom/top helpers (D-07) — or inline into iosTokens.ts
│   ├── iosTokens.test.ts   # token shape + value assertions (Wave 0)
│   └── index.ts            # barrel: re-export tokens + helpers → consumed via `@theme`
├── App.tsx                 # ConfigProvider theme.token fed from @theme (D-04)
├── Components/
│   ├── FastOverlay/        # promote sheet gradient/radius/ease/backdrop literals → @theme
│   ├── SheetPicker/shared/SheetTrigger.tsx   # radius/44/fontSize → @theme
│   ├── SheetPicker/SheetSelect/SheetSelect.tsx # row 44 → @theme
│   └── Layout/Content/Content.tsx            # D-05 height math
└── Routing/Shell/
    ├── BottomTabNavigator.tsx  # reference safe-area impl; magic numbers → @theme
    └── CookingPill.tsx         # D-06 bottom offset fix
```

### Pattern 1: Typed `as const` token module (D-01/D-02/D-03)
**What:** A plain TS object, grouped by category, exported `as const` for literal types. Values are exactly the shipped Phase 7/8 literals (UI-SPEC tables). No CSS, no classes.
**When to use:** The single source of truth for every spacing/radius/type/color/surface/touch-target value. Consumed inline as `style={{ minHeight: tokens.touchTarget.min }}`.
**Example:**
```typescript
// src/Theme/iosTokens.ts — values verbatim from UI-SPEC + verified source literals
export const iosTokens = {
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const,
  radius:  { sm: 6, md: 10, lg: 14, xl: 18, xxl: 20, pill: 999 } as const,
  type: {
    caption: { fontSize: 12, fontWeight: 400, lineHeight: 1.4 },
    control: { fontSize: 16, fontWeight: 400, lineHeight: '22px' }, // SheetTrigger:34-36, SheetSelect:53-54
    body:    { fontSize: 18, fontWeight: 400, lineHeight: 1.5 },    // AntD base, App.tsx:30
    title:   { fontSize: 18, fontWeight: 650, lineHeight: 1.3, color: '#2f2545' },
  },
  color: {
    primary: '#7436dc', primaryHover: '#8f46f7', primaryActive: '#5e2bbf', // App.tsx:25-27
    text: '#2f2545', textMuted: '#6b6478', borderIdle: '#d9d9d9', destructive: '#ff4d4f',
    accentFill: 'rgba(116,54,220,0.10)', focusRing: '0 0 0 2px rgba(116,54,220,0.12)',
  },
  surface: {
    sheetGradient:   'linear-gradient(180deg, #f5f0ff 0%, #ffffff 42%)',       // FastOverlay:331,587
    contentGradient: 'linear-gradient(180deg, #e9e3f4 0%, #f6f3fb 52%, #ffffff 100%)', // Content:20
    cardBg: '#ffffff', cardBgTranslucent: 'rgba(255,255,255,0.98)',
    backdropModal: 'rgba(16,24,40,0.36)', backdropSheet: 'rgba(16,24,40,0.30)',
    hairlineAccent: 'rgba(116,54,220,0.10)', hairlineNeutral: '#f0f2f5',
    shadowSheet: '0 -16px 48px rgba(74,48,130,0.24)',
    shadowNav: '0 14px 34px rgba(74,48,130,0.18), 0 5px 12px rgba(74,48,130,0.08)',
  },
  motion: { ease: 'cubic-bezier(0.16, 1, 0.3, 1)' }, // FastOverlay:48
  touchTarget: { min: 44, comfortable: 52 },         // SheetTrigger:29 / BottomTabNavigator:79
  layout: { headerHeight: 76, bottomNavHeight: 80, bottomNavContainerMinHeight: 88 }, // Content:6-7, Nav:36
} as const;
```

### Pattern 2: Single safe-area convention helper (D-07)
**What:** A function returning the `calc(... + env())` string so every sticky element shares one shape. Matches the working reference `BottomTabNavigator.tsx:37`.
**When to use:** Any `position:fixed`/sticky bottom (or top) chrome.
**Example:**
```typescript
// src/Theme/safeArea.ts
export const safeAreaInset = {
  bottom: (base: number) => `calc(${base}px + env(safe-area-inset-bottom))`,
  top:    (base: number) => `calc(${base}px + env(safe-area-inset-top))`,
} as const;
// BottomTabNavigator container padding becomes:
//   padding: `16px 10px ${safeAreaInset.bottom(8)}`   // === current "calc(8px + env(safe-area-inset-bottom))"
```

### Pattern 3: Content height that subtracts insets and agrees across both rules (D-05)
**What:** Replace the mismatched `height:100vh`/`maxHeight:100dvh` pair with ONE `dvh`-primary expression that subtracts header, nav, AND both insets. `vh` is fallback only (declared first so `dvh` wins on supporting UAs — the FastOverlay cascade pattern, `FastOverlay.tsx:132-133`).
**When to use:** The scrollable content box between fixed header and fixed bottom nav.
**Example:**
```typescript
// Content.tsx — chrome = headerHeight + bottomNavHeight (tokens). dvh primary, vh fallback.
const chrome = iosTokens.layout.headerHeight + iosTokens.layout.bottomNavHeight; // 156
const insets = 'env(safe-area-inset-top) + env(safe-area-inset-bottom)';
// Two same-key declarations (vh first as fallback, dvh second wins) — mirror FastOverlay cascade:
style={{
  height: `calc(100vh  - ${chrome}px - (${insets}))`,   // fallback
  // override on next line via a second style obj or a tiny CSS rule; inline can't double-declare.
}}
```
**IMPORTANT inline-style caveat:** a single inline `style` object CANNOT carry two `height` declarations (the `vh` fallback then the `dvh` winner) the way a CSS rule can — the second key overwrites the first in JS. FastOverlay solves this by injecting a real `<style>` block (`FastOverlay.tsx:118-140`) with two same-key lines. For Content.tsx the planner must choose one of: (a) emit a scoped `<style>`/class for the two-line `vh`→`dvh` cascade (matches FastOverlay precedent, **recommended**), or (b) use `dvh` only inline and accept that very old WebKit lacking `dvh` falls back to the browser default (acceptable — `dvh` shipped iOS 15.4+, the project's min target). See Open Question 1.

### Pattern 4: Feed AntD-owned scalars from the same module (D-04)
**What:** `App.tsx` ConfigProvider reads `colorPrimary`/`fontSize`/`borderRadius`/`colorBorderSecondary` from `iosTokens`, leaving `locale`, `zIndexPopupBase:4000`, and the per-component `zIndexPopup:4200` hacks untouched (Phase 11 removes those, not this phase).
**When to use:** Only the scalars AntD has a slot for. Sheet gradient/safe-area/touch-target stay TS-only.
**Example:**
```typescript
// App.tsx
theme={{
  token: {
    colorPrimary: iosTokens.color.primary,
    colorPrimaryHover: iosTokens.color.primaryHover,
    colorPrimaryActive: iosTokens.color.primaryActive,
    colorLink: iosTokens.color.primary,
    colorBorderSecondary: iosTokens.color.borderIdle,
    fontFamily: iosTokens.type.fontFamily, // keep existing system-ui stack
    fontSize: iosTokens.type.body.fontSize, // 18
    borderRadius: iosTokens.radius.md,      // 10 — aligns AntD inputs/popups w/ 6px trigger family (D-04 discretion)
    zIndexPopupBase: 4000,                  // UNCHANGED
  },
  components: { /* per-component zIndexPopup:4200 — UNCHANGED, Phase 11 removes */ },
}}
```

### Anti-Patterns to Avoid
- **Re-adding `viewport-fit=cover`:** Already at `public/index.html:7` (verified). Re-adding is a no-op at best, a merge-conflict risk at worst.
- **Double-subtracting OR double-counting the inset:** With `viewport-fit=cover`, `100dvh` already includes the area behind the home indicator. Subtract `env(safe-area-inset-bottom)` exactly once in the height math; do NOT also add safe-area padding to the same box. (See Pitfall 1.)
- **A second inline `height` key for the `vh`→`dvh` fallback:** JS object overwrites the first key. Use a `<style>` block/class (FastOverlay precedent) or `dvh`-only. (Pattern 3 caveat.)
- **Forking the z-index algorithm:** D-03 says reference `useResolvedOverlayZIndex`/the existing stack values; the token module *documents* them, it does not redefine them.
- **Changing AntD `zIndexPopupBase`/per-component `4200`:** Out of scope; Phase 11 owns the cleanup.
- **Introducing CSS variables or any CSS-module/Tailwind layer:** Contradicts D-01.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Detecting safe-area inset sizes | JS reading `getComputedStyle`/visualViewport math | CSS `env(safe-area-inset-*)` in `calc()` | The UA resolves insets natively once `viewport-fit=cover` is set; JS measurement is fragile and laggy. |
| Dynamic viewport height under the URL bar | JS `window.innerHeight` + resize listeners | CSS `dvh` unit (`vh` fallback) | `dvh` tracks the shrinking/growing chrome automatically; the JS approach is the classic `100vh` bug workaround that's now obsolete on iOS 15.4+. |
| `vh`→`dvh` fallback cascade | Inline double-key (impossible in JS objects) | A scoped `<style>` block, exactly as `FastOverlay.tsx:118-140` already does | Two same-property declarations need real CSS; reuse the existing precedent rather than inventing. |
| Touch-target measurement in tests | Custom geometry harness | jsdom `el.style.minHeight` assertions (existing `SheetActionMenu.test.tsx` pattern) + Playwright `boundingBox()` on `mobile-safari` | Both harnesses already exist and are used in Phase 7/8 tests. |

**Key insight:** Every hard part here is already solved either by the CSS platform (`env()`, `dvh`) or by an existing in-repo precedent (FastOverlay's style-block cascade, the `mobile-safari` Playwright project, the jsdom min-height assertion). This phase is wiring and centralization, not invention.

## Runtime State Inventory

> This is a refactor/codification phase (promoting literals → tokens, fixing CSS). It touches no datastores, services, OS registrations, secrets, or build artifacts that carry renamed runtime keys. Inventory completed below.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | **None.** Tokens are compile-time constants; no DB/localforage/redux-persist key is named after any token. The refactor renames in-code literals only. | None — verified: token names are new TS identifiers, not persisted keys. |
| Live service config | **None.** This is a static-asset PWA (deployed to `docs/`); no external service holds token values. | None. |
| OS-registered state | **None.** No launchd/systemd/scheduler entries reference these values. | None. |
| Secrets / env vars | **None.** Token values are public CSS literals (colors, sizes); the only env vars in play are Playwright's `E2E_PORT`/`PORT`/`BROWSER` (test infra, unrelated). | None. |
| Build artifacts / installed packages | **The new `@theme` alias must be registered in THREE places** (not a renamed artifact, but a build-config gap): `tsconfig.json` `paths`, `craco.config.js` webpack `resolve.alias`, and `package.json` jest `moduleNameMapper`. Missing any one breaks type-check, dev/build, or tests respectively. | Code edit (config) — see Pitfall 5. The deployed `docs/` build is regenerated by the normal build; no manual artifact surgery. |

**The canonical question — after every file is updated, what runtime systems still have an old string cached/stored/registered?** Nothing. The literals being promoted (`#7436dc`, `18`, `cubic-bezier(...)`, `44`, `76`, `80`) are inline style values, not keys read by any persistent system. The only cross-cutting risk is the build-config alias registration (3 places), captured above and in Pitfall 5.

## Common Pitfalls

### Pitfall 1: `dvh` double-counts the safe area (the central IOS-02 trap)
**What goes wrong:** Developer assumes `100dvh` already excludes the home indicator and writes `height: calc(100dvh - 156px)` without insets — content still sits under the home indicator on a notched device. OR over-corrects by subtracting the inset twice (once in height, once as padding) — leaving a visible gap.
**Why it happens:** With `viewport-fit=cover`, `100dvh` spans the FULL display including behind the notch/home-indicator; `env(safe-area-inset-*)` is the distance to subtract, exactly once. [CITED: developer.mozilla.org — confirmed `dvh` + `viewport-fit=cover` spans full display, `env()` subtracted once]
**How to avoid:** Content height = `calc(100dvh - headerHeight - bottomNavHeight - env(safe-area-inset-top) - env(safe-area-inset-bottom))`. Subtract each inset once. Do not also pad the same box.
**Warning signs:** Bottom of scroll area hidden under home indicator; or a persistent ~34px dead strip above the nav.

### Pitfall 2: `height:100vh` and `maxHeight:100dvh` disagree (the current Content.tsx bug)
**What goes wrong:** `Content.tsx:21-22` sets `height: calc(100vh - 156px)` AND `maxHeight: calc(100dvh - 156px)`. On iOS Safari `vh` includes the (transient) URL bar while `dvh` does not, so the box is taller than its own max and content clips under the toolbar when the bar is showing.
**Why it happens:** Mixed units from incremental edits; `vh` is the legacy buggy unit.
**How to avoid:** Use ONE unit family — `dvh` primary, `vh` fallback declared first in a real CSS rule (FastOverlay cascade pattern). Both the `height` and `maxHeight` (if kept) must use the same expression.
**Warning signs:** Done button / last row clipped when the Safari toolbar is visible; layout jump as the toolbar hides.

### Pitfall 3: CookingPill rides into the home indicator and collides with the nav (D-06)
**What goes wrong:** `CookingPill.tsx:57` is `bottom: 76` with no inset. The bottom nav already lifts itself by `env(safe-area-inset-bottom)` (`:37`), so on a notched device the pill (fixed at a raw 76) can overlap the raised nav and/or sit in the home-indicator zone.
**Why it happens:** The pill predates the safe-area convention and uses a raw pixel offset matching the OLD nav height assumption.
**How to avoid:** Rebase via the helper: `bottom: safeAreaInset.bottom(iosTokens.layout.bottomNavHeight)` (or nav-height-derived base) so it always clears the raised nav + indicator. Verify clearance on `mobile-safari`.
**Warning signs:** Pill overlaps nav dock on iPhone; pill text under the home indicator.

### Pitfall 4: Tokenizing changes a pixel and silently regresses the shipped look
**What goes wrong:** "Cleaning up" a value during promotion (e.g. rounding the `11px` trigger padding to `12`, or the `6px` trigger radius to the `10` control radius) shifts the Phase 7/8 aesthetic the UI-checker already approved 6/6.
**Why it happens:** Tokenization tempts normalization. UI-SPEC explicitly preserves exceptions (`11px` trigger padding, `6px` trigger radius, `10px` nav labels, grabber `5px`) as verbatim idioms.
**How to avoid:** Promote-what-exists. Each token value must equal its source literal (cross-check against the UI-SPEC tables + the line numbers in this doc). Add a token-value test asserting the exact numbers.
**Warning signs:** Visual diff against the current build; trigger/row looks subtly different.

### Pitfall 5: New `@theme` alias works in the editor but breaks build or tests
**What goes wrong:** Adding the alias to `tsconfig.json` only makes type-check/IDE happy, but `craco` (webpack) can't resolve it at dev/build time, and Jest can't resolve it in unit tests — two separate silent failures.
**Why it happens:** This repo resolves path aliases in THREE independent places (verified): `tsconfig.json` `compilerOptions.paths`, `craco.config.js` `webpack.configure` `resolve.alias`, and `package.json` `jest.moduleNameMapper`. Existing aliases (`@components`, etc.) are present in all three.
**How to avoid:** Register `@theme` (or chosen name) in all three: `tsconfig` `"@theme/*": ["./src/Theme/*"]` (or `"@theme": ["./src/Theme/index.ts"]`), craco `"@theme": path.resolve(__dirname, "src/Theme")`, jest `"^@theme/(.*)$": "<rootDir>/src/Theme/$1"` (or the `@hooks` single-file shape). Match whichever shape (wildcard vs single-file barrel) is chosen.
**Warning signs:** `Module not found: @theme` only when running `npm start`/`npm test`, not in the editor.

### Pitfall 6: `strict:false` / `target:es5` won't catch token-shape mistakes
**What goes wrong:** A typo'd token path (`iosTokens.color.primay`) or a missing key resolves to `undefined` and is happily stringified into a style — no compile error under `strict:false`.
**Why it happens:** `tsconfig` has `strict:false` (verified); `noUncheckedIndexedAccess` is off.
**How to avoid:** Export the module `as const` (gives literal types and surfaces missing-key access on direct property reads in most cases), and add a token-shape unit test that asserts presence + value of each consumed token. Prefer direct property access (`iosTokens.radius.xl`) over dynamic indexing.
**Warning signs:** `undefined` appearing in a rendered `style` attribute on device.

## Code Examples

### Promoting FastOverlay sheet literals to tokens (representative refactor)
```typescript
// BEFORE — FastOverlay.tsx:586-587 (duplicated at :330-331 for the drawer)
//   borderRadius: "18px 18px 0 0",
//   background: "linear-gradient(180deg, #f5f0ff 0%, #ffffff 42%)",
// AFTER
import { iosTokens } from '@theme';
// ...
borderRadius: `${iosTokens.radius.xl}px ${iosTokens.radius.xl}px 0 0`,
background: iosTokens.surface.sheetGradient,
// motion ease (FastOverlay.tsx:48): const overlayMotionEase = iosTokens.motion.ease;
```

### jsdom touch-target assertion (extends the existing SheetActionMenu pattern)
```typescript
// Source: existing pattern at SheetPicker/SheetActionMenu/SheetActionMenu.test.tsx:24-34
test('SheetTrigger meets the 44px touch-target token', () => {
  render(<SheetTrigger placeholder="x" onOpen={() => {}} />);
  const btn = screen.getByRole('button');
  expect(btn.style.minHeight).toBe(`${iosTokens.touchTarget.min}px`); // 44px
});
```

### Playwright home-indicator clearance on the existing mobile-safari project
```typescript
// Source: pattern from tests/e2e/native-sheet.spec.ts (safe-area padding assertion :148-152)
// Run under the `mobile-safari` project (devices['iPhone 13'], playwright.config.ts:38).
test('cooking pill clears the bottom nav + home indicator', async ({ page }) => {
  await page.goto('./');
  const pill = page.getByTestId('active-cooking-floating-button');
  const nav  = page.getByTestId('bottom-tab-navigator');
  const pillBox = await pill.boundingBox();
  const navBox  = await nav.boundingBox();
  // pill's bottom edge sits above (or at) the nav's top edge — no overlap
  expect(pillBox!.y + pillBox!.height).toBeLessThanOrEqual(navBox!.y + 1);
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `100vh` + JS innerHeight hacks for iOS URL-bar | `dvh` unit (with `vh`/`svh` fallback) | Safari 15.4 (Mar 2022) | Project min-target supports `dvh`; FastOverlay already uses it. Content.tsx is the last `vh` holdout to fix. |
| Per-file `env()` literals (`8px+`, `16px+`, raw `76`) | One `safeAreaInset.*` helper (D-07) | This phase | Consistent clearance; no drift. |
| Duplicated hex/gradient/radius literals across 6 files | One typed `iosTokens` module (D-02) | This phase | Tunable in one place; greppable; AntD-aligned via ConfigProvider. |

**Deprecated/outdated:**
- `height: 100vh` in `Content.tsx` (and any `100vh` in `App.css`/ErrorBoundary): superseded by `dvh`+inset. App.css/ErrorBoundary upgrade is Claude's discretion (low-risk).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `dvh` is safe to use as the *primary* unit (no `vh` fallback strictly required) because the project's effective iOS floor is ≥15.4 | Pattern 3, State of the Art | LOW — if a sub-15.4 WebKit must be supported, the `vh`-first CSS cascade (FastOverlay precedent) covers it; planner should keep the fallback to be safe. |
| A2 | The AntD `theme.token.borderRadius` value (D-04 discretion) should be `10` (`radius.md`) to sit between the 6px trigger and the control family | Pattern 4 | LOW — purely visual; UI-SPEC says "keep visually aligned with the 6px trigger / 10px control family," 10 is defensible. Planner/UI may pick 6 or 8. |
| A3 | `src/Theme/` + `@theme` alias chosen over `src/Tokens/`/`@tokens` | Project Structure | NONE — explicitly Claude's discretion; either is fine if registered in all 3 config places. |
| A4 | CookingPill's safe-area base should derive from `bottomNavHeight` (so it stacks above the nav) rather than a smaller base | Pitfall 3, D-06 | LOW — D-06 says "rebase on bottom-nav height plus env()"; exact base is an implementation detail to verify on device. |

**Note:** All token *values* are VERIFIED against source line numbers / UI-SPEC (not assumed). The assumptions above are implementation-latitude choices the planner can lock.

## Open Questions

1. **`vh`→`dvh` fallback for Content.tsx: scoped `<style>` block vs `dvh`-only inline?**
   - What we know: a single inline style object can't hold two `height` keys; FastOverlay already emits a `<style>` block for exactly this cascade (`:118-140`).
   - What's unclear: whether the planner wants to mirror FastOverlay's `<style>`-injection precedent for Content, or accept `dvh`-only inline (simpler, fine for iOS 15.4+).
   - Recommendation: mirror the FastOverlay `<style>`/class precedent (consistent, future-proof). If minimizing churn, `dvh`-only inline is acceptable given the target floor (A1).

2. **AntD `borderRadius` token exact value (D-04 discretion).**
   - What we know: UI-SPEC says feed `md`(10) or "lg-adjacent," aligned with the 6px trigger / 10px control family.
   - What's unclear: 6 vs 8 vs 10.
   - Recommendation: `10` (`radius.md`) — matches the existing close-button/side-icon control family; lowest visual-regression risk. Defer final pick to UI-SPEC authority if it specifies tighter.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| node / npm | build + test runner | ✓ | (project uses craco/react-scripts 5.0.1) | — |
| @playwright/test (`mobile-safari` WebKit project) | IOS-02/IOS-03 device verification | ✓ | 1.60.0 (installed) | jsdom assertions cover token min-heights if WebKit browser binary not installed; home-indicator clearance is WebKit-only |
| WebKit browser binary (Playwright) | home-indicator clearance e2e | ? (binary install not verified this session) | — | `npx playwright install webkit` if missing; otherwise jsdom + manual device check |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** WebKit Playwright binary may need `npx playwright install webkit` — planner should add a guard/install step if the `mobile-safari` project fails to launch. (The `mobile-safari` project is already defined and used by Phase 7/8 specs, so the binary is very likely present.)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + React Testing Library + jsdom (via react-scripts 5.0.1); Playwright 1.60.0 for e2e |
| Config file | `package.json` `jest` block + `src/setupTests.ts`; `playwright.config.ts` |
| Quick run command | `CI=true npx react-scripts test src/Theme src/Components/SheetPicker --watchAll=false` |
| Full suite command | `CI=true npx react-scripts test --watchAll=false` then `npm run test:e2e` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| IOS-01 | Token module exports expected categories with exact Phase 7/8 values | unit | `CI=true npx react-scripts test src/Theme/iosTokens.test.ts --watchAll=false` | ❌ Wave 0 |
| IOS-01 | FastOverlay / SheetTrigger / App ConfigProvider read tokens (no orphan literals) | unit + grep | `CI=true npx react-scripts test src/Components/SheetPicker --watchAll=false` | ⚠️ extend existing SheetTrigger.test.tsx |
| IOS-02 | Content height subtracts both insets; one unit family (regression of the `vh`/`dvh` mismatch) | unit (style assertion) | `CI=true npx react-scripts test src/Components/Layout/Content --watchAll=false` | ❌ Wave 0 |
| IOS-02 | CookingPill bottom clears nav + home indicator on notched device | e2e (WebKit) | `npx playwright test tests/e2e/cooking-pill.spec.ts --project=mobile-safari` | ⚠️ extend cooking-pill.spec.ts |
| IOS-03 | SheetTrigger min-height === 44 token | unit | `CI=true npx react-scripts test src/Components/SheetPicker/shared --watchAll=false` | ❌ Wave 0 (add to SheetTrigger.test.tsx) |
| IOS-03 | SheetSelect row + SheetActionMenu row min-height === 44 token | unit | `CI=true npx react-scripts test src/Components/SheetPicker --watchAll=false` | ✅ SheetActionMenu.test.tsx:24 exists; mirror for SheetSelect |
| IOS-03 | Trigger + rows ≥44px rendered on WebKit/iPhone | e2e (WebKit) | `npx playwright test tests/e2e/sheet-picker.spec.ts --project=mobile-safari` | ⚠️ extend with boundingBox height assertion |

### Sampling Rate
- **Per task commit:** `CI=true npx react-scripts test <changed-dir> --watchAll=false`
- **Per wave merge:** `CI=true npx react-scripts test --watchAll=false` (full unit suite)
- **Phase gate:** full unit suite green + `npm run test:e2e -- --project=mobile-safari` for the safe-area/touch specs before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/Theme/iosTokens.test.ts` — covers IOS-01 (token shape + exact values; guards Pitfall 4)
- [ ] `src/Components/Layout/Content/Content.test.tsx` — covers IOS-02 (height expression subtracts both insets, single unit family)
- [ ] Extend `src/Components/SheetPicker/shared/SheetTrigger.test.tsx` — IOS-03 trigger min-height === token
- [ ] Extend `tests/e2e/cooking-pill.spec.ts` — IOS-02 pill clearance on `mobile-safari`
- [ ] Extend `tests/e2e/sheet-picker.spec.ts` — IOS-03 boundingBox ≥44 on `mobile-safari`
- [ ] Register `@theme` alias in `tsconfig.json`, `craco.config.js`, `package.json` jest mapper (Pitfall 5) — config gate, not a test file

## Security Domain

> `security_enforcement: true`, ASVS level 1. This phase is pure client-side CSS/token refactoring with no auth, network, input handling, storage, or crypto surface.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth code touched |
| V3 Session Management | no | No session code touched |
| V4 Access Control | no | No access-control code touched |
| V5 Input Validation | no | Tokens are static constants; no user input enters this phase. SheetTrigger error-ring is visual only. |
| V6 Cryptography | no | None |

### Known Threat Patterns for {React inline-style token refactor}
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Token value injected into `style` from untrusted source | Tampering | N/A — all token values are hardcoded compile-time constants; none derive from user input or network. No mitigation needed beyond keeping them constant. |

**Conclusion:** No security-sensitive surface in Phase 9. No ASVS L1 control applies beyond confirming token values remain static constants.

## Sources

### Primary (HIGH confidence)
- Codebase, read directly this session: `src/App.tsx`, `src/Components/Layout/Content/Content.tsx`, `src/Routing/Shell/CookingPill.tsx`, `src/Routing/Shell/BottomTabNavigator.tsx`, `src/Components/SheetPicker/shared/SheetTrigger.tsx`, `src/Components/SheetPicker/SheetSelect/SheetSelect.tsx`, `src/Components/FastOverlay/FastOverlay.tsx` (grep of layout literals), `public/index.html` (viewport-fit=cover confirmed line 7), `tsconfig.json`, `craco.config.js`, `package.json`, `playwright.config.ts`, `tests/e2e/cooking-pill.spec.ts`, `tests/e2e/native-sheet.spec.ts` / `sheet-picker.spec.ts` (grep), `SheetActionMenu.test.tsx` (grep).
- `.planning/phases/09-.../09-UI-SPEC.md` (approved 6/6 — token ramps), `09-CONTEXT.md` (locked decisions), `.planning/research/SUMMARY.md` + `PITFALLS.md` (§A iOS Safari), `.planning/REQUIREMENTS.md` (§IOS).

### Secondary (MEDIUM confidence)
- developer.mozilla.org (via WebFetch) — confirmed `dvh` + `viewport-fit=cover` spans the full display behind the safe area; `env(safe-area-inset-*)` is subtracted once. (The MDN length page didn't cover it directly; answer is spec-consistent and matches the in-repo FastOverlay usage.)

### Tertiary (LOW confidence)
- None. (Built-in WebSearch returned no usable content; no search providers enabled in config — all `*_search` flags false. The one external fact was cross-checked against in-repo `dvh`/`env()` usage.)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new deps (locked); all versions read from installed `package.json`.
- Architecture: HIGH — every token value and call site verified against source line numbers; patterns mirror existing in-repo precedents (FastOverlay cascade, BottomTabNavigator safe-area, SheetActionMenu test).
- Pitfalls: HIGH for the codebase-specific ones (the `vh`/`dvh` mismatch, the 3-place alias, the un-inset pill — all directly verified); MEDIUM for the `dvh`/`env()` spec interaction (cross-checked, not from a single authoritative spec fetch).

**Research date:** 2026-06-30
**Valid until:** 2026-07-30 (stable — CSS env()/dvh are mature; AntD 5 token API stable; no fast-moving deps)
