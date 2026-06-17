---
phase: 05-mobile-tuning-copy-rollout
plan: 04
subsystem: ui
tags: [copy-migration, app-copy, sheet, mobile, vietnamese, shopping-list, mob-01, mob-02, mob-03, copy-03]

# Dependency graph
requires:
  - phase: 01-copy-infrastructure
    provides: typed AppCopy module + CopyKey union + glossary (the namespace this plan extends)
  - phase: 05-mobile-tuning-copy-rollout (plan 05-03)
    provides: AppCopy.shell namespace + Sheet adoption baseline (FastDrawerShell + PIN/Backup as Sheets)
provides:
  - AppCopy.shoppingList namespace (detail-widget + screen-level keys, ~80 leaves; named-arg interpolation for counts/dates/names)
  - ShoppingListDetail.widget reading all user-facing copy from AppCopy
  - ShoppingList.screen reading all user-facing copy from AppCopy
  - Detail-widget meal/completion-review/bought-info Modals -> Sheet
  - Screen delete-confirm Modal -> Sheet (case b: danger CTA in body)
  - Screen template-apply Modal -> Sheet (case a: body CTA stack)
  - Screen regenerate confirm imperative modal.confirm -> state-driven Sheet (case c, single shared toggle reused by dropdown + post-add-more-dishes flow)
  - Primary CTAs in this plan full-width Button size="large" minHeight 44 (MOB-01/02)
affects: [05-05, 05-06, 05-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - shoppingList namespace continues the AppCopy convention from Phase 1 (PascalCase as-const, named-arg arrow fns for interpolation, direct object access at call sites)
    - Imperative modal.confirm sites lift to a single toggle + body-CTA Sheet, then both the dropdown and the post-flow funnel through the same toggle (no duplicated confirm body)

key-files:
  created: []
  modified:
    - src/Common/Copy/AppCopy.ts
    - src/Modules/ShoppingList/Screens/ShoppingListDetail.widget.tsx
    - src/Modules/ShoppingList/Screens/ShoppingList.screen.tsx

key-decisions:
  - "shoppingList namespace seeded by Task 1 (detail-widget keys) and extended additively by Task 2 (screen-level keys); single namespace covers both files to keep ShoppingList copy in one place"
  - "Single toggleReloadConfirm shared between the dropdown 'Tải lại' action and the post-add-more-dishes onDone flow — replaces two separate modal.confirm invocations with one declarative Sheet"
  - "Template-apply Modal converted to Sheet despite okText/okButtonProps being a single field-form pattern: it is a single-step picker (case a) and the screen-wide acceptance grep mandates 0 onOk= / okButtonProps= matches"
  - "Delete-confirm Sheet keeps `Button type=\"primary\" danger` (T-05-08 mitigation): destructive action stays visually deliberate behind an explicit primary tap, no implicit confirm"

patterns-established:
  - "Pattern: `toggle*Confirm` Sheet with body-CTA stack — primary `size=\"large\"` minHeight 44, secondary cancel below; replaces both antd `Modal onOk` and imperative `modal.confirm`"
  - "Pattern: shared confirmation toggle when multiple call sites converge on the same confirm body (regenerate dropdown + post-add-dishes both use toggleReloadConfirm)"

requirements-completed: [COPY-03, MOB-03, MOB-01, MOB-02]

# Metrics
duration: 22min
completed: 2026-06-17
---

# Phase 5 Plan 4: ShoppingList Copy + Sheet + Touch CTAs Summary

**ShoppingList detail widget and list screen now read all Vietnamese copy from `AppCopy.shoppingList`, every picker/confirmation renders as a `@components/Sheet`, and primary CTAs are full-width thumb-zone size=large minHeight 44.**

## Performance

- **Duration:** ~22 min (Task 1 prior commit + Task 2 this session)
- **Started:** 2026-06-17T19:00:00Z (Task 1)
- **Completed:** 2026-06-17T (Task 2 commit + SUMMARY)
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Task 1 (commit `f6623c7`): seeded `AppCopy.shoppingList` namespace covering ~36 detail-widget strings (tabs, completion review, audit, cost summary, bought-info, ingredient pills, shared small actions). Migrated `ShoppingListDetail.widget.tsx` (1546 LOC) end-to-end. Converted meal-detail / completion-review / bought-info Modals to `@components/Sheet`. Brought completion-review and review-cancel CTAs to full-width `size="large"` minHeight 44.
- Task 2 (commit `505fd21`): extended `AppCopy.shoppingList` with ~45 screen-level keys (screen title, status filters, row pills, dropdown labels, regenerate/delete/template confirms). Migrated `ShoppingList.screen.tsx` (655 LOC) end-to-end. Converted delete-confirm Modal to a danger-CTA Sheet (case b). Converted template-apply Modal to a body-CTA Sheet (case a). Lifted both `modal.confirm` "Tải lại danh sách nguyên liệu?" sites onto a single shared `toggleReloadConfirm` Sheet (case c).
- All `data-testid`s preserved across both migrations; no IndexedDB / persist-root changes.

## Task Commits

1. **Task 1: ShoppingListDetail.widget — copy migration + picker/confirm Sheet swap + CTA touch sizing** — `f6623c7` (feat)
2. **Task 2: ShoppingList.screen — copy migration + delete-confirm Sheet swap + CTA touch sizing** — `505fd21` (feat)

**Plan metadata:** _docs commit follows this SUMMARY_

## Files Created/Modified

- `src/Common/Copy/AppCopy.ts` — added `shoppingList` namespace (~80 leaves total across both tasks: detail-widget + screen)
- `src/Modules/ShoppingList/Screens/ShoppingListDetail.widget.tsx` — 36 inline literals → `AppCopy.shoppingList.*`; 3 Modals → Sheet; CTA layout tuning
- `src/Modules/ShoppingList/Screens/ShoppingList.screen.tsx` — 22+ inline literals → `AppCopy.shoppingList.*` / `AppCopy.common.*`; delete-confirm + template-apply Modals → Sheet; 2 imperative `modal.confirm` sites → 1 shared `toggleReloadConfirm` Sheet; `useModal` import dropped; CTA layout tuning

## Decisions Made

- **One namespace per module surface, not per file.** `shoppingList` covers both the detail widget and the list screen so consumers never have to guess which file owns a key. Task 1 seeded it; Task 2 extended additively.
- **Shared `toggleReloadConfirm` toggle instead of two parallel Sheets.** Both the dropdown "Tải lại" action and the post-add-more-dishes onDone flow now `toggleReloadConfirm.show()` and run the same Sheet body — replaces two `modal.confirm` calls with a single declarative confirmation surface.
- **Template-apply Modal converted to Sheet.** Plan acceptance criteria require `rg "onOk=|okButtonProps"` on the screen file to return 0. The template-apply was a single-step picker (case a) with a body field-form, so the swap was clean: body keeps the Select + DatePicker + preview text, footer becomes a Stack with primary `size="large"` Create CTA + secondary Cancel. `okButtonProps={{ disabled: ... }}` is preserved as `disabled={...}` on the new primary Button.
- **Glossary compliance.** No `Tạo mới` / `Thêm mới` introduced (`rg 'Tạo mới|Thêm mới' src/Common/Copy/AppCopy.ts` returns 0). Existing user-authored "Tạo lịch mua từ mẫu" and "Tạo lịch mua" use the canonical `Tạo` verb in domain context (creating a date-bound shopping list, not the generic add action) — preserved verbatim per migrate-only rule (rewording is 05-07).

## Deviations from Plan

None - plan executed exactly as written. The plan explicitly authorised the modal.confirm state-lift (D-06 case c) and the template-apply swap is a direct consequence of the screen-wide `onOk=|okButtonProps` zero-match acceptance criterion. Both fall inside scope.

## Issues Encountered

None. Build green on both task commits with no new warnings introduced in either migrated file (the eslint warnings in the build output all originate in unrelated files: `ShoppingListAdd.widget.tsx`, `ShoppingListEdit.widget.tsx`, `SmartMealPlanner.screen.tsx` — pre-existing, out of scope per execute-plan boundary rule).

## User Setup Required

None - no external service configuration required.

## Verification

- `yarn build` green at both commit points (Task 1 `f6623c7`, Task 2 `505fd21`).
- Acceptance grep on `ShoppingList.screen.tsx`:
  - `rg -n "onOk=|okButtonProps" src/Modules/ShoppingList/Screens/ShoppingList.screen.tsx` → 0 matches.
  - `rg -n "danger" src/Modules/ShoppingList/Screens/ShoppingList.screen.tsx` → 2 matches (dropdown delete `danger: true` + Sheet body `Button type="primary" danger`).
  - `rg -n "modal\.confirm" src/Modules/ShoppingList/Screens/ShoppingList.screen.tsx` → 0 matches.
  - Post-migration diacritic grep (double-quote, single-quote, JSX-text passes) → 0 user-facing literals.
- Acceptance grep on `ShoppingListDetail.widget.tsx` (Task 1, recorded for completeness):
  - `rg -n "modal\.confirm" src/Modules/ShoppingList/Screens/ShoppingListDetail.widget.tsx` → 0 unannotated matches.
  - Post-migration diacritic grep → 0 user-facing literals outside comments.
- `rg -n 'Tạo mới|Thêm mới' src/Common/Copy/AppCopy.ts` → 0 matches.

## Next Phase Readiness

- ShoppingList copy + sheet rollout complete; `AppCopy.shoppingList` is the canonical namespace for any future ShoppingList screen work (export widget, calendar widget, edit widget) — those files were not in this plan's scope but can extend the same namespace when their plans run.
- The shared `toggleReloadConfirm` pattern (one toggle, multiple call sites, single Sheet) is the model for any future "two paths to the same confirm" cluster in the long-tail picker sweep.

---
*Phase: 05-mobile-tuning-copy-rollout*
*Completed: 2026-06-17*

## Self-Check: PASSED

- FOUND: src/Common/Copy/AppCopy.ts (shoppingList namespace extended)
- FOUND: src/Modules/ShoppingList/Screens/ShoppingListDetail.widget.tsx (migrated)
- FOUND: src/Modules/ShoppingList/Screens/ShoppingList.screen.tsx (migrated)
- FOUND: commit f6623c7 (Task 1)
- FOUND: commit 505fd21 (Task 2)
- FOUND: .planning/phases/05-mobile-tuning-copy-rollout/05-04-SUMMARY.md
