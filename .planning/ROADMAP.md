# Roadmap: my-household (UI/UX Refactor Milestone)

## Overview

This milestone reframes existing capability — it does not build a new app. The order front-loads two zero-dependency, cross-cutting foundations (a typed Vietnamese copy module, then a crash-contained and decomposed shell) so every later screen is written in the new voice on a stable base. From there it builds the wizard's state layer in isolation, then the guided "Hôm nay ăn gì?" journey that takes a first-timer from Home to a scheduled meal, then tunes the journey for phones and completes the app-wide copy pass without regressing desktop. A final post-validation phase carries the v2 differentiators (tracked, not part of v1 coverage). The named success metrics — a first-timer reaches a meal, copy reads natural in Vietnamese, smooth on mobile, no capability lost — are gated across Phases 4 and 5.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Copy Infrastructure** - Typed `AppCopy` source of truth + glossary, before any rewording (completed 2026-06-14)
- [x] **Phase 2: Shell Safety & Extraction** - Error boundary, decompose `MasterPage.tsx`, route reachability inventory, `Sheet` wrapper (completed 2026-06-15)
- [x] **Phase 3: Wizard State Slice** - Resume-safe RTK slice in the `personal` root, selectors, scorer characterization tests (completed 2026-06-16)
- [x] **Phase 4: Wizard UI & Hero Entry** - Guided journey from Home to a scheduled meal, nav reframe with no lost routes (completed 2026-06-16)
- [ ] **Phase 5: Mobile Tuning & Copy Rollout** - Phone-first journey + journey/high-traffic Vietnamese copy migration (phone-only; desktop no longer gated)
- [ ] **Phase 6: Differentiator Enhancements** - Post-validation v2 steps and conveniences (deferred)

## Phase Details

### Phase 1: Copy Infrastructure

**Goal**: A single typed source of truth for user-facing Vietnamese copy exists and enforces consistent terminology, so every later screen is written through it instead of hand-editing ~408 inline strings twice.
**Depends on**: Nothing (first phase)
**Requirements**: COPY-01, COPY-02
**Success Criteria** (what must be TRUE):

  1. A typed `AppCopy` module is the source of truth for user-facing Vietnamese strings, with a derived key union that fails the build on an unknown key.
  2. Interpolated strings are exposed as functions so dynamic values cannot be dropped during migration.
  3. A glossary defines one Vietnamese term per concept, and reviewing it surfaces any synonym conflicts before screens are reworded.

**Plans**: 1 plan
Plans:

- [x] 01-01-PLAN.md — Typed `AppCopy` module (nested namespaces, derived `CopyKey` union, named-arg interpolation), review-only `COPY_GLOSSARY`, `@common/Copy` barrel + ripgrep migration recipe + build-gate proof

### Phase 2: Shell Safety & Extraction

**Goal**: The app shell is crash-contained and decomposed so journey, nav, and mobile work can proceed without destabilizing the whole app — separating "pure move, verified identical" from any behavior change.
**Depends on**: Phase 1 (sequenced; no hard dependency)
**Requirements**: FND-01, FND-02
**Success Criteria** (what must be TRUE):

  1. A top-level error boundary catches a thrown render error and shows a recovery UI instead of white-screening the whole app.
  2. The bottom-tab navigator, cooking pill, and data backup are extracted from `MasterPage.tsx` into `src/Routing/Shell/`, with pill, nav, drawer, search, and backup behaving identically to before.
  3. A reachability inventory lists every pre-refactor route and its entry path, ready to gate later nav changes.
  4. A `@components/Sheet` wrapper over antd `Drawer placement="bottom"` is available for pickers and confirmations.

**Plans**: 5 plans
Plans:
**Wave 1**

- [x] 02-01-PLAN.md — Wave 0: repair the stale shell e2e baseline + add cooking-pill/bottom-tab coverage so the before/after identity proof is trustworthy (FND-02)
- [x] 02-02-PLAN.md — Top-level error boundary around RootRouter with a themed Vietnamese reload fallback, proven by a render-throw e2e spec (FND-01)
- [x] 02-03-PLAN.md — `@components/Sheet` bottom-sheet wrapper on the FastOverlay system (D-09) + jest smoke proof, no consumer migration (MOB-03 build-only)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-04-PLAN.md — Pure-move extraction of PageActionsMenu, BottomTabNavigator, CookingPill + shared shellStyles into `src/Routing/Shell/`, verified identical by the 02-01 baseline (FND-02)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 02-05-PLAN.md — Move SidebarDrawer intact + dead DataBackup (flagged), collapse MasterPage to a thin composition root, write ROUTE-INVENTORY.md, full baseline re-run (FND-02)

### Phase 3: Wizard State Slice

**Goal**: Wizard progress and answers live in persisted state that survives the app's forced reloads, exposed only through selectors and testable before any UI exists.
**Depends on**: Phase 2
**Requirements**: FND-03, WIZ-06
**Success Criteria** (what must be TRUE):

  1. Wizard step and answers live in an RTK slice under the existing `personal` persisted root (no new persisted root), read via selectors with no raw state access.
  2. Each answer is committed to the slice per step, so a forced reload (Gist sync or service-worker update) mid-flow preserves prior answers.
  3. On mount the wizard rehydrates and resumes from the last committed step.
  4. Characterization tests pin current `DishScorer` output so later changes cannot silently regress suggestions.

**Plans**: 3 plans

Plans:
**Wave 1**

- [x] 03-01-PLAN.md — `WizardState` model + `WizardReducer` RTK slice (per-step commit, advance/back, resume no-op, restart, complete) + reducer unit tests (FND-03, WIZ-06)
- [x] 03-02-PLAN.md — `DishScorer` characterization tests pinning current output of all 5 methods against deterministic fixtures (WIZ-06)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 03-03-PLAN.md — Register `wizard` under `personalReducer` (no new persist root) + `selectWizard*` selector family with defensive defaults — sole read path (FND-03)

### Phase 4: Wizard UI & Hero Entry

**Goal**: A first-time user can go from Home to a scheduled meal through a guided, skippable wizard — the milestone's named success metric — while every existing route stays reachable.
**Depends on**: Phase 3
**Requirements**: WIZ-01, WIZ-02, WIZ-03, WIZ-04, WIZ-05, WIZ-07, NAV-01, NAV-02, NAV-03, NAV-04
**Success Criteria** (what must be TRUE):

  1. Home shows one obvious "Hôm nay ăn gì?" hero entry that starts meal planning, and primary entry points are reframed from admin-style screens to the guided journey.
  2. Planning runs one question per screen with visible progress and a back action, and every step is skippable with a sensible "Tùy bạn" default.
  3. The result step always yields at least one actionable dish (full-catalog fallback, or routes to "add your first dish" on an empty catalog), and the user can add the chosen dish to today's meals.
  4. A first-timer with empty data reaches a scheduled meal unaided, verified by a cold-start end-to-end run (empty IndexedDB → wizard → scheduled meal).
  5. Every pre-refactor route stays reachable within ~3 taps or via global search; the bottom-nav center action opens the wizard while the existing suggester stays reachable.

**Plans**: 5 plans
**UI hint**: yes

Plans:
**Wave 1**

- [x] 04-01-PLAN.md — MealPlanning route scaffold + ingredient & preference step widgets (WIZ-02, WIZ-03)
- [x] 04-02-PLAN.md — Result step: WIZ-04 fallback ladder + WIZ-05 add-to-meal via addScheduledMeal

**Wave 2** *(blocked on Wave 1)*

- [x] 04-03-PLAN.md — Wizard container (persisted step-key state machine) + progress chrome + RootRouter registration (WIZ-02)

**Wave 3** *(blocked on Wave 2)*

- [x] 04-04-PLAN.md — Entry-point reframe: Home hero CTA + bottom-nav center repoint, suggester stays reachable (WIZ-01, NAV-01, NAV-02, NAV-04)

**Wave 4** *(blocked on Wave 3)*

- [x] 04-05-PLAN.md — WIZ-07 cold-start E2E + dish-suggester spec migration + global-search reachability (WIZ-07, NAV-02, NAV-03, NAV-04)

### Phase 5: Mobile Tuning & Copy Rollout

**Goal**: The guided journey is comfortable on a phone and all user-facing copy reads natural in Vietnamese (journey + high-traffic scope).
**Depends on**: Phase 4
**Requirements**: MOB-01, MOB-02, MOB-03, COPY-03, COPY-04, COPY-05 (MOB-04 retired as written — phone-only user, desktop no longer protected/regression-gated per Phase 5 CONTEXT D-07)
**Success Criteria** (what must be TRUE):

  1. Journey screens use a phone-first layout with primary CTAs in the thumb zone and interactive controls at ~44px touch targets.
  2. Pickers and confirmations use the bottom-sheet pattern (desktop no-regression superseded by D-07 — not gated).
  3. Inline user-facing strings across the journey + high-traffic modules and navigation reference `AppCopy` (scoped, not the full 566-string sweep — D-01).
  4. All labels and descriptions read natural to a local Vietnamese user, with no English or technical-jargon leftovers.
  5. Journey screens show inviting, friendly empty-states instead of blank or technical messages.

**Plans**: 7 plans
**UI hint**: yes

Plans:
**Wave 1**

- [x] 05-01-PLAN.md — Journey copy migration to AppCopy + friendly empty-states + 44px touch polish (COPY-03, COPY-05, MOB-01, MOB-02)
- [x] 05-02-PLAN.md — App-wide bottom-sheet sweep, long-tail picker/confirmation files (MOB-03)

**Wave 2** *(blocked on 05-01: shared AppCopy.ts)*

- [x] 05-03-PLAN.md — Shell + nav cluster: MasterPage/SidebarDrawer copy + PIN/Backup Modal→Sheet + chrome touch targets (COPY-03, MOB-03, MOB-01, MOB-02)

**Wave 3** *(blocked on 05-03)*

- [x] 05-04-PLAN.md — ShoppingList cluster: copy + picker/delete-confirm Sheet + thumb-zone CTAs (COPY-03, MOB-03, MOB-01, MOB-02)

**Wave 4** *(blocked on 05-04)*

- [x] 05-05-PLAN.md — ScheduledMeal cluster: copy + Modal sweep + ScheduledMealAdd footer CTA retune (COPY-03, MOB-03, MOB-01, MOB-02)

**Wave 5** *(blocked on 05-05)*

- [x] 05-06-PLAN.md — DishSuggester/Dishes/Ingredient list cluster: copy + picker Sheet + 44px targets (COPY-03, MOB-03, MOB-01, MOB-02)

**Wave 6** *(blocked on all copy-migration plans)*

- [x] 05-07-PLAN.md — Vietnamese voice refinement in AppCopy with iterative user-review loop (COPY-04)

### Phase 6: Differentiator Enhancements

**Goal**: After the base journey is validated, add optional steps and conveniences that deepen the journey, reusing the same selectors and components. Carries v2 requirements only — not part of v1 coverage; gated behind v1 validation.
**Depends on**: Phase 5
**Requirements**: WIZ2-01, WIZ2-02, WIZ2-03, WIZ2-04, WIZ2-05 (v2 — deferred, post-validation)
**Success Criteria** (what must be TRUE):

  1. User can set "who's eating?" portions, reusing household config.
  2. User can optionally filter to "can cook now" using current inventory.
  3. From the result, user can add a missing ingredient to Đi chợ inline.
  4. The wizard remembers last session's answers as defaults.
  5. Each suggestion shows a one-line "why this dish" reason. (Defer the "time/effort" step — blocked on a dish attribute that may not exist.)

**Plans**: TBD
**UI hint**: yes

Plans:

- [ ] 06-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Copy Infrastructure | 1/1 | Complete    | 2026-06-14 |
| 2. Shell Safety & Extraction | 5/5 | Complete   | 2026-06-15 |
| 3. Wizard State Slice | 3/3 | Complete    | 2026-06-16 |
| 4. Wizard UI & Hero Entry | 6/6 | Complete   | 2026-06-16 |
| 5. Mobile Tuning & Copy Rollout | 5/7 | In Progress|  |
| 6. Differentiator Enhancements | 0/TBD | Deferred | - |
