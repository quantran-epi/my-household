# Stack Research

**Domain:** UI/UX refactor of an existing local-first household/meal-planning PWA (React 18 + Ant Design 5 + Redux Toolkit). Focus: guided mobile wizard, single-locale (Vietnamese) copy management, mobile-first interaction patterns.
**Researched:** 2026-06-14
**Confidence:** HIGH

> **Scope note:** This milestone is a UX/copy refactor on a FIXED stack. The headline recommendation is **add almost nothing** — the existing stack already contains everything the three goals need. New dependencies are the exception, not the rule. Where this doc lists a "technology," it is most often an existing primitive (antd `Steps`, antd `Drawer`, RTK slice, `ConfigProvider` tokens) being applied to a new purpose, not a new install.

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Ant Design `Steps` | 5.16.1 (already installed) | Visual step indicator for the meal-planning wizard | First-party, already themed via `ConfigProvider`. Supports `items[]`, `current`, `onChange`, `responsive` (auto-switches to vertical <532px — ideal mobile fallback), `type="inline"`, `size="small"`, and `progressDot` for compact phone display. No new dependency, no theming drift. |
| Ant Design `Drawer` (`placement="bottom"`) | 5.16.1 (already installed) | Mobile bottom-sheet for pickers, confirmations, step detail overlays | The canonical antd 5 bottom-sheet. `placement="bottom"` + `height` prop (default 378, accepts number/string) gives a native-feeling sheet. Already used across the shell, so behavior/theming is consistent. |
| RTK slice (wizard state) | `@reduxjs/toolkit` 2.2.3 (already installed) | Orchestrate wizard step/answers, persist & resume offline | Reuse the existing `personal` persisted root so a half-finished "what to cook" flow survives reload/offline — a real win for a PWA. Matches the existing `createSlice` + selector convention exactly. No new library. |
| Centralized strings module (plain TS) | n/a (new source file, no dependency) | Single source of truth for Vietnamese user-facing copy | For a single-locale app, a typed `const` strings object is the right tool. Matches the codebase's "PascalCase Helper object with camelCase members" convention (e.g. `DateHelpers`). Type-safe, zero runtime cost, zero new dependency, trivially greppable. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Ant Design `Segmented` | 5.16.1 (installed) | Large-touch single-choice toggles inside wizard steps (e.g. "bữa sáng / trưa / tối") | When a step offers 2–4 mutually exclusive options. Bigger touch target and clearer state than radio buttons on mobile. |
| Ant Design `FloatButton` / `FloatButton.Group` | 5.16.1 (installed) | Persistent primary action ("Bắt đầu nấu", "Tiếp tục") | When the hero CTA must stay reachable with a thumb during scroll. |
| Ant Design `Result` | 5.16.1 (installed, already wrapped in `@components/Result`) | Wizard completion / empty-state screens | End-of-wizard "đã lên thực đơn" confirmation and friendly empty states. Already wrapped locally. |
| Ant Design `App` context (`message`/`modal`/`notification`) | 5.16.1 (installed, already wired in `App.tsx`) | Step feedback toasts | Already in the provider stack — reuse, don't add a toast lib. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| TypeScript `const`-assertion + keyof types | Compile-time safety for the strings module | Type the strings object `as const` and derive a `CopyKey` union so missing/typo'd keys fail at build (`enableTypeChecking: true` is already on in `craco.config.js`). No tooling install. |
| Existing path alias (`@common/*`) | Home for the strings module | Place copy under `src/Common/Constants` or `src/Common/Copy` to match the SCREAMING_SNAKE/Helper conventions and keep imports alias-based. |

## Installation

```bash
# Core: NOTHING to install. All three goals are met with the existing stack.
# (antd 5.16.1, @reduxjs/toolkit 2.2.3, react-redux 9.1.0 are already present.)

# Supporting: NOTHING to install.

# Dev dependencies: NOTHING to install.
```

> If the team later decides true multi-locale is in scope (currently **out of scope** per PROJECT.md), revisit i18next — see "Alternatives Considered."

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Centralized typed strings module | `i18next` 26.3.1 + `react-i18next` 17.0.8 | Only if real multi-locale (e.g. add English) becomes a requirement, OR you need ICU pluralization/interpolation across hundreds of keys with translator tooling. For a single Vietnamese locale this is overhead: extra deps, a provider, async namespace loading, and JSON files that lose TS type-safety — all to solve a problem (runtime language switching) you don't have. |
| RTK slice for wizard orchestration | `react-use-wizard` 2.3.0 | If you want a ready-made `useWizard()` (next/prev/goto/active) and don't need persistence. **Caveat:** last published Feb 2024 (low maintenance signal) and its in-memory state would NOT survive reload — losing the offline-resume benefit. Reasonable only for a throwaway/ephemeral flow. |
| RTK slice for wizard state | `useReducer` + Context (local) | Fine if the wizard is fully self-contained, never needs to resume after reload, and no other screen reads its state. Simpler, but you give up redux-persist resume and the established selector pattern. |
| antd `Drawer placement="bottom"` | `react-spring-bottom-sheet` / `vaul` | Only if you need gesture-driven snap points and velocity physics. Adds a dependency and a second styling system that won't inherit `ConfigProvider` tokens. Not worth it for picker/confirm sheets. |
| antd `Steps` | `react-step-wizard`, custom CSS stepper | If you need an exotic visual the antd `Steps` variants (`default`/`dot`/`inline`/`navigation`) can't express. Unlikely here. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `antd-mobile` | It is a **separate component library** from `antd`, not an add-on. Mixing it with antd 5 means two theming systems, two design languages, duplicated bundle weight, and inconsistent components. The app already standardizes on antd 5 + `ConfigProvider` tokens + local wrappers. | antd 5's own mobile-capable primitives: `Drawer placement="bottom"`, `Steps responsive`, `Segmented`, `FloatButton`, plus responsive layout + larger control-height tokens. |
| `i18next` / `react-i18next` (for this milestone) | Multi-language is explicitly out of scope (PROJECT.md). A full i18n runtime adds a provider, async loading, and untyped JSON for a single-locale app — pure overhead with no payoff. | Typed centralized strings module (`as const` + derived key union). |
| `react-use-wizard` | Unmaintained signal (last publish Feb 2024) and in-memory only — a reload mid-flow loses progress, which contradicts the offline-first PWA goal. | RTK slice persisted in the `personal` root + antd `Steps` for the indicator. |
| Adding `formik` / `react-hook-form` | The app already has a typed form abstraction (`SmartForm`/`useSmartForm`) over antd Form. A second form library fragments patterns. | Reuse `SmartForm` for per-step inputs; antd `Form` instance per step or one form spanning steps. |
| New CSS/styling system (styled-components, Tailwind, CSS Modules) for touch targets | The app themes via antd `ConfigProvider` token overrides + Less. Introducing another styling layer fragments the design system. | Tune `ConfigProvider` tokens (`controlHeight`, `controlHeightLG`, `sizeStep`, `fontSize`) and use antd `size="large"` on interactive controls. |
| Replacing/duplicating the date lib | `moment` and `dayjs` already coexist; adding a third or swapping is churn unrelated to UX. | Match the date lib already used in the file you touch (convention). |

## Stack Patterns by Variant

**If the wizard must resume after reload/offline (recommended default for this PWA):**
- Use a dedicated RTK slice (e.g. `MealPlanWizardReducer.ts`) in the `personal` persisted root, with selectors in `Selectors.ts`.
- antd `Steps` reads `current` from the slice; step components dispatch answer actions.
- Because `serializableCheck` is already disabled and selectors defensively default missing slices (`?? {}`), a new slice is migration-safe against older persisted blobs.

**If the wizard is intentionally ephemeral (no resume):**
- `useReducer` + Context inside the wizard route subtree.
- Still drive the antd `Steps` indicator from that local state.

**For mobile step layout:**
- Phone-first: render one step per full screen; use `Steps type="dot"`/`progressDot` or `size="small"` as a slim top progress indicator rather than a wide horizontal stepper.
- Rely on `Steps responsive` (auto-vertical <532px) only as a fallback; prefer the compact dot indicator for hero flows.
- Put secondary pickers (date, member count, dish choice) in a bottom `Drawer` so the primary question stays in view.

**For touch-target sizing:**
- Set `size="large"` on `Button`, `Select`, `Input`, `Segmented` inside the wizard.
- Bump `ConfigProvider` tokens (`controlHeightLG`) so the existing local wrappers inherit larger targets without per-component edits. Target ~44px minimum touch height.

**For the Vietnamese copy pass:**
- One `Copy`/strings module per domain or one app-wide module with nested namespaces, typed `as const`.
- Keep keys semantic (`mealWizard.startCta`), values Vietnamese. This makes the cross-cutting copy audit a single-file review and prevents English/jargon leftovers from hiding in JSX.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| antd 5.16.1 | React 18.2 | Already running in production. `Steps`, `Drawer placement="bottom"`, `Segmented`, `FloatButton`, `Result` all available in 5.16.x. (Note: antd docs site now shows v6.x — do NOT follow v6 prop changes like `orientation`/`size` height semantics; stay on the 5.x API: `direction`, `progressDot`, `Drawer height`.) |
| @reduxjs/toolkit 2.2.3 | redux-persist 6.0.0, react-redux 9.1.0 | Existing wiring; a new wizard slice plugs into the established `personal` persisted root with no version work. |
| TypeScript 4.9.5 | `as const` strings + `keyof typeof` | Const assertions and key-union derivation fully supported; build-time type checking already enabled in CRACO. |
| (if ever adopted) react-i18next 17.0.8 | i18next 26.3.1, React 18 | Compatible, but out of scope — listed only for the future multi-locale contingency. |

## Sources

- Ant Design v5 `Drawer` docs (`5x.ant.design/components/drawer`) — verified `placement="bottom"`, `height` prop (default 378, string|number) — HIGH
- Ant Design v5 `Steps` docs (`5x.ant.design/components/steps`) — verified `items`, `current`, `direction`, `progressDot`, `responsive` (<532px vertical), `type` (default/navigation/inline), `size`, `onChange` — HIGH
- npm registry (live query) — antd 5.16.1 (installed), i18next 26.3.1, react-i18next 17.0.8, zustand 5.0.14, react-use-wizard 2.3.0 (last modified 2024-02-19, peer React >=16.8) — HIGH
- Existing codebase docs: `.planning/codebase/STACK.md`, `ARCHITECTURE.md`, `CONVENTIONS.md`, `.planning/PROJECT.md` — fixed stack, conventions, out-of-scope constraints — HIGH

---
*Stack research for: UI/UX refactor — guided wizard + Vietnamese copy + mobile-first patterns on React 18 / antd 5 / RTK*
*Researched: 2026-06-14*
