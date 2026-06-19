# Milestones

## v1.0 UI/UX Refactor (Shipped: 2026-06-19)

**Phases completed:** 6 phases, 27 plans, 63 tasks

**Key accomplishments:**

- Typed Vietnamese AppCopy module (common/wizard/emptyStates) with a derived leaf-only CopyKey union, named-arg interpolation functions, a review-only COPY_GLOSSARY, and a @common/Copy barrel carrying the Phase 5 ripgrep migration recipe.
- Top-level React class error boundary that swaps a render crash for a themed Vietnamese reload fallback instead of white-screening the app, mounted around RootRouter inside ConfigProvider and proven by an e2e render-throw spec.
- `@components/Sheet` bottom-anchored overlay built on the existing FastOverlay portal system, sharing the drawer/modal z-index stacking singletons, with a jest/RTL mount/unmount/onClose smoke proof.
- Moved three top-level shell pieces and a shared style constant out of the 1366-line MasterPage.tsx into src/Routing/Shell/ as a behavior-identical extraction, proven by the unchanged 02-01 e2e baseline staying green.
- SidebarDrawer moved intact and the dead DataBackup preserved + flagged into src/Routing/Shell/, collapsing MasterPage to a thin composition root over five Shell pieces, with the full e2e baseline passing unchanged as the FND-02 identity proof.
- Persisted wizard state model and RTK reducer with per-step answer durability and reducer-level behavior tests
- Deterministic golden tests pin all five DishScorer methods before wizard-result wiring
- Wizard state is persisted under the existing personal root and exposed through defensive selector-only reads
- MealPlanning route surface (/meal-planning/wizard) plus two controlled wizard step widgets — ingredient picker (Sheet) and single preferred-tags question — each skippable with a "Tùy bạn" default.
- WizardResult widget with the WIZ-04 fallback ladder (empty-catalog route → scored matches → full-catalog fallback) and WIZ-05 single-tap add-to-meal wiring through the existing addScheduledMeal action plus completeWizard.
- WizardScreen container that maps the persisted wizard step-key to the matching step widget, a WizardProgress chrome (segmented indicator + conditional neutral back), and the /meal-planning/wizard route element wired into RootRouter.
- Home hero gains a dominant "Hôm nay ăn gì?" CTA and the bottom-nav center button routes into /meal-planning/wizard, with the in-place suggester preserved via its sidebar entry.
- Proves the milestone metric end-to-end — a first-timer reaches a scheduled meal through the wizard — and locks the nav reachability gate (suggester via /dish-suggester, global search unaffected) with passing Playwright E2E.
- Every meal-planning wizard string now reads from the typed AppCopy source of truth, friendly empty-states are wired from AppCopy.emptyStates, and journey touch targets meet the >=44px phone-first bar.
- Swept the non-cluster long-tail single-step pickers/confirmations across ShoppingList, ScheduledMeal, Dishes, and Ingredient onto `@components/Sheet`, lifting two imperative/inline confirms to declarative Sheets, and recorded an auditable app-wide MOB-03 inventory disposition.
- Every high-traffic shell/nav string in MasterPage and SidebarDrawer now reads from the typed AppCopy.shell namespace, the SidebarDrawer PIN and Backup confirmations open as bottom sheets while the FastDrawerShell nav stays intact, and the shell controls this plan touched meet the >=44px phone-first bar.
- ShoppingList detail widget and list screen now read all Vietnamese copy from `AppCopy.shoppingList`, every picker/confirmation renders as a `@components/Sheet`, and primary CTAs are full-width thumb-zone size=large minHeight 44.
- ScheduledMealList screen and ScheduledMealAdd widget now read all Vietnamese copy from `AppCopy.scheduledMeal`, every Modal in this cluster renders as a `@components/Sheet`, and the named worst-offender footer CTA is full-width thumb-zone size=large minHeight 44.
- The final high-traffic list cluster now reads migrated copy from `AppCopy`, uses Sheets for the remaining single-step list confirmations/hosts, preserves the `/dish-suggester` route, and has touch-sized primary add affordances.
- `AppCopy.ts` now carries the refined Vietnamese copy pass for the migrated Phase 5 surface, with keys and interpolation signatures unchanged so every consumer receives the update through the central copy source.
- The meal wizard now remembers completed answers and includes a skippable household member / serving-count step before preferences.
- Wizard results now support optional cook-now grouping and every result card explains its recommendation with a natural, non-numeric detail affordance.
- Wizard result cards can add selected missing ingredients to Đi chợ inline, with duplicate protection and no forced navigation.
- Cook-now results no longer collapse to the middle bucket — an unscaled `baseReady` signal drives "Nấu ngay" and a missing-count split routes low-readiness dishes to "Dự phòng", pinned by a real-pipeline test.
- Confirm-gated clear-defaults with stacked hint, full-width member status cards on the portions step, and an existing-vs-new shopping-list selector for missing ingredients — plus the previously-missing SheetActions component restored.

**Known deferred items at close:** 10 (see STATE.md Deferred Items) — 5 open debug sessions, 2 phases with pending UAT scenarios (03, 06), 3 verification gaps awaiting human sign-off (02, 04, 06). Acknowledged as tech debt at milestone close.

---
