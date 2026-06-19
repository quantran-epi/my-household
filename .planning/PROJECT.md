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
- ✓ Typed copy foundation — Phase 1 (`@common/Copy`, `CopyKey`, glossary)
- ✓ Resume-safe wizard state foundation — Phase 3 (`wizard` RTK slice under `personal`, `selectWizard*` selectors)
- ✓ Guided meal-planning journey — Phase 4 (Home hero, persisted wizard UI, add-to-meal result flow, route reachability)
- ✓ Phone-first high-traffic copy rollout — Phase 5 (journey/shell/shopping/scheduled-meal/dish-suggester/dishes/ingredient surfaces migrated to `AppCopy` and Sheet patterns; native-speaker copy UAT remains follow-up)

<!-- v1.0 UI/UX Refactor requirements — shipped 2026-06-19 -->

- ✓ Reframe the app from "admin tool" to a guided customer journey — v1.0 (NAV-01)
- ✓ Step-by-step guided meal-planning wizard (one question per screen, progress, back, skippable) — v1.0 (WIZ-01..05)
- ✓ First-time user reaches a scheduled meal unaided from empty data — v1.0 (WIZ-07, cold-start E2E)
- ✓ Phone-first journey layout with thumb-zone CTAs and ~44px touch targets, bottom-sheet pickers — v1.0 (MOB-01..03)
- ✓ High-traffic Vietnamese copy migration with friendly empty-states — v1.0 (COPY-03..05)
- ✓ Top-level error boundary + shell decomposition out of `MasterPage.tsx` — v1.0 (FND-01, FND-02)
- ✓ All pre-refactor routes stay reachable; global search + bottom-nav center into wizard — v1.0 (NAV-02..04)
- ✓ v2 differentiators (portions, cook-now filter, inline shopping, remembered defaults, "why this dish") — v1.0 Phase 6 (WIZ2-01..05)

### Active

<!-- v2 milestone not yet scoped — define via /gsd-new-milestone -->

- [ ] Native Vietnamese household-user copy sign-off (Phase 5 follow-up UAT — automated clean, human tone review outstanding)
- [ ] Close out v1.0 deferred quality items: 5 open debug sessions, Phase 03/06 UAT scenarios, Phase 02/04/06 human verification (see STATE.md Deferred Items)

### Out of Scope

- Adding a backend / user accounts — app is intentionally local-first; auth is a client-side PIN only
- Replacing the tech stack (React/RTK/Ant Design) — refactor is UX/copy-led, not a rewrite
- New domain features beyond what exists — this milestone reframes existing capability, it doesn't add new domains
- Multi-language support beyond Vietnamese — Vietnamese is the target audience

## Context

- **v1.0 UI/UX Refactor shipped 2026-06-19** — 6 phases, 27 plans, 63 tasks over 197 commits (2026-06-14 → 2026-06-19). The app is reframed from an admin-style tool into a guided "Hôm nay ăn gì?" journey: Home hero CTA → step-by-step skippable wizard → scheduled meal, all phone-first with bottom-sheet pickers and migrated Vietnamese copy. Closed with 10 acknowledged tech-debt items (see STATE.md Deferred Items).
- Phase 1 complete (2026-06-14): typed `AppCopy` copy foundation under `src/Common/Copy/` (`@common/Copy`) — source of truth, build-gated `CopyKey` union, review-only glossary. App-wide copy *migration* is Phase 5.
- Phase 3 complete (2026-06-16): wizard progress/answers persist under the existing `personal` redux-persist root through a `wizard` RTK slice, with `selectWizard*` as the defensive read path and DishScorer characterization tests pinning result behavior before UI wiring.
- Phase 5 complete (2026-06-17): phone-first journey polish and high-traffic Vietnamese copy migration are automated-verified; `AppCopy` final key count is 476 after a review-time wrapper subtitle fix; native Vietnamese household-user sign-off remains the main follow-up risk.
- Phase 6 complete (2026-06-19): v2 differentiators landed — remembered wizard defaults, skippable servings/member step, optional cook-now grouped results with one-line reasons, and inline add-missing-ingredient to Đi chợ.
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
| Adopt GSD to plan/track future changes | Existing app needs structured, tracked evolution | ✓ Good — drove v1.0 to ship across 6 tracked phases |
| First milestone = UI/UX refactor (not new features) | App is feature-rich but not intuitive/friendly enough | ✓ Good — shipped v1.0 |
| Meal planning ("what to cook") is the first journey to make intuitive | It's the journey that hurts most today | ✓ Good — guided wizard validated by cold-start E2E |
| Use a guided wizard flow as the "customer journey" model | Reframes admin-style screens into ask-and-answer steps | ✓ Good — Phases 4-6 |
| App-wide Vietnamese copy pass this milestone (not just meal planning) | Friendly, familiar language is a cross-cutting need | ⚠️ Revisit — high-traffic scope migrated (D-01), native-speaker tone UAT still outstanding |
| Typed `AppCopy` module as single source of truth for copy (build-gated keys, named-arg interpolation, review-only glossary) | Avoids hand-editing ~408 inline strings twice; makes a bad key a build error | ✓ Built in Phase 1 |
| Keep wizard state under the existing `personal` persisted root and expose it through selectors | Preserves local user data and avoids a new persist root while making Phase 4 UI reload-safe | ✓ Built in Phase 3 |
| Treat Phase 5 native-speaker copy review as follow-up UAT, not a deploy blocker | The user explicitly requested deployment in this run; automated copy/build/e2e gates passed, but tone still benefits from household-user review | ✓ Recorded in Phase 5 verification |
| Retire MOB-04 (desktop no-regression gate) | Phone-only user; desktop no longer protected per Phase 5 CONTEXT D-07 | ✓ Good — scope focused on phone |
| Close v1.0 with 10 open quality items acknowledged as tech debt | User requested milestone close; all phases/plans complete, gaps are UAT/verification/debug follow-ups not capability gaps | — Pending — tracked in STATE.md Deferred Items |

| Adopt a typed `AppCopy` source of truth before rewording any screens | Avoid hand-editing ~408 inline strings twice; make a bad key a build error | Validated in Phase 1: Copy Infrastructure |

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
*Last updated: 2026-06-19 after v1.0 UI/UX Refactor milestone*
