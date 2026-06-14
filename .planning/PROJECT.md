# my-household

## What This Is

A local-first household management PWA (package name `my-recipes`) that helps a Vietnamese family decide what to cook, track ingredients and inventory, build shopping lists, and run cooking sessions. All data lives in the browser (IndexedDB); GitHub is used only for publishing shared data (admin) and backing up personal data (Gist). It ships as an offline-capable PWA to GitHub Pages.

## Core Value

A local Vietnamese household member can open the app and go from "what do we eat?" to a planned meal quickly, in familiar language, without it feeling like an admin tool.

## Requirements

### Validated

<!-- Inferred from existing codebase (.planning/codebase/). These ship today. -->

- ✓ Manage dishes (create/edit/list) — existing (`Dishes` module)
- ✓ Manage ingredients — existing (`Ingredient` module)
- ✓ Track inventory / household health state — existing (selectors + config)
- ✓ Build and manage shopping lists — existing (`ShoppingList` module)
- ✓ Schedule meals — existing (`ScheduledMeal` module)
- ✓ Suggest dishes to cook — existing (`DishSuggester` module)
- ✓ Run cooking sessions (cooking pill in shell) — existing (`CookingSession` reducer)
- ✓ Home dashboard — existing (`Home` module)
- ✓ Offline-first persistence via IndexedDB + redux-persist — existing
- ✓ Admin publish of shared data to GitHub — existing (`useSharedPublish`)
- ✓ Personal backup/restore via GitHub Gist — existing (`useGistBackup`)
- ✓ Cross-device shared-data sync — existing (`useSharedDataSync`)
- ✓ PWA install + offline caching (Workbox) — existing (`service-worker.ts`)
- ✓ Client-side admin mode (PIN gate) — existing (`useAdminMode`)
- ✓ Vietnamese locale (Ant Design `viVN`) — existing (`App.tsx`)

### Active

<!-- First milestone: UI/UX refactor. Hypotheses until shipped. -->

- [ ] Reframe the app from "admin tool" to a guided customer journey
- [ ] Turn meal planning ("what to cook") into a step-by-step guided wizard flow
- [ ] A first-time user can reach a scheduled meal without touching anything that feels like admin
- [ ] App-wide pass on labels, descriptions, and empty-states so all user-facing copy reads natural to a local Vietnamese user (no English/jargon leftovers)
- [ ] The guided flow works smoothly on mobile (phone-first PWA)
- [ ] Preserve all existing capability — reframe entry points, don't remove features

### Out of Scope

- Adding a backend / user accounts — app is intentionally local-first; auth is a client-side PIN only
- Replacing the tech stack (React/RTK/Ant Design) — refactor is UX/copy-led, not a rewrite
- New domain features beyond what exists — this milestone reframes existing capability, it doesn't add new domains
- Multi-language support beyond Vietnamese — Vietnamese is the target audience

## Context

- Brownfield project. Existing codebase mapped under `.planning/codebase/` (ARCHITECTURE, STACK, STRUCTURE, CONVENTIONS, INTEGRATIONS, TESTING, CONCERNS).
- Stack: React 18, Redux Toolkit, React Router 6, Ant Design 5, TypeScript, CRACO build, Workbox PWA. UI is built on local wrappers in `src/Components` over Ant Design.
- Feature modules (vertical slices) live in `src/Modules`: Dishes, Ingredient, ShoppingList, ScheduledMeal, DishSuggester, Home.
- App shell + navigation chrome is `src/Routing/MasterPage.tsx` — flagged in CONCERNS as oversized (>1300 lines) holding shell, drawer, data-backup, cooking pill, and bottom nav. UI refactor work will likely touch this heavily.
- Existing locale is already Vietnamese (`viVN`), but copy/labels/terminology are not consistently friendly/familiar to local users — that is the primary gap this milestone addresses.
- Phone-first: it's a PWA intended for mobile use.

## Constraints

- **Tech stack**: Must stay on React + Redux Toolkit + Ant Design — refactor is UX/copy-led, not a rewrite. Why: working app, no appetite to re-platform.
- **Compatibility**: Must not break offline-first persistence or existing IndexedDB/persist roots (`shared`, `personal`). Why: users have local data that must survive.
- **No capability loss**: All existing features stay reachable. Why: reframing entry points, not cutting scope.
- **Audience**: Local Vietnamese household users. Why: copy and journey decisions optimize for familiarity, not generality.
- **Deployment**: Static SPA to GitHub Pages from `docs/`. Why: existing deploy flow.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Adopt GSD to plan/track future changes | Existing app needs structured, tracked evolution | — Pending |
| First milestone = UI/UX refactor (not new features) | App is feature-rich but not intuitive/friendly enough | — Pending |
| Meal planning ("what to cook") is the first journey to make intuitive | It's the journey that hurts most today | — Pending |
| Use a guided wizard flow as the "customer journey" model | Reframes admin-style screens into ask-and-answer steps | — Pending |
| App-wide Vietnamese copy pass this milestone (not just meal planning) | Friendly, familiar language is a cross-cutting need | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-14 after initialization*
