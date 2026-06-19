---
phase: 06-differentiator-enhancements
verified: 2026-06-19T11:40:00Z
status: human_needed
score: 5/5 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 2/6 (UAT)
  gaps_closed:
    - "Cook-now results show all three groups (Nấu ngay, Cần mua thêm ít, Dự phòng), no longer collapsing to the middle bucket"
    - "Clearing remembered defaults asks for confirmation; remembered-defaults hint stacks title above its two actions"
    - "Each portions-step member renders as a full-width card with name, health status, and short description"
    - "Adding missing ingredients offers a brand-new shopping list target even when an open list exists"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Cook-now three-bucket grouping (UAT test 4 re-test)"
    expected: "With cook-now enabled and real inventory + servingCount > 2, results show Nấu ngay, Cần mua thêm ít, and Dự phòng as appropriate, never collapsing to one group"
    why_human: "Real-pipeline unit test pins the three-bucket distribution, but the visible end-to-end result against live household inventory data needs a human run"
  - test: "Member portions card layout (UAT test 1 re-test)"
    expected: "Each member is a full-width card with name, health-status tag, and short description; selected state uses #7436dc accent; tap targets feel comfortable on a phone"
    why_human: "Visual layout quality and full-width stretch on a 390px viewport cannot be confirmed by grep"
  - test: "Clear-defaults confirmation + stacked hint (UAT test 2 re-test)"
    expected: "Clicking 'Xóa lựa chọn đã nhớ' shows a confirm dialog (danger ok) before deleting; the hint reads title above the two action buttons"
    why_human: "Modal appearance and stacked layout are visual; confirm-flow interaction needs a human click-through"
  - test: "Brand-new shopping list selector (UAT test 6 re-test)"
    expected: "When an open list exists, the missing-ingredient sheet offers existing-vs-new; choosing 'new' reveals the name input and creates a fresh list with the selected ingredients"
    why_human: "Selector interaction and the resulting new-list contents need a human run; note review finding WR-02 below — verify the new list contains all expected ingredients, not just the ones missing from the old list"
---

# Phase 6: Differentiator Enhancements Verification Report

**Phase Goal:** After the base journey is validated, add optional steps and conveniences that deepen the journey, reusing the same selectors and components.
**Verified:** 2026-06-19T11:40:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure (plans 06-04, 06-05) for the 4 UAT gaps

## Goal Achievement

This is a gaps-only re-verification. UAT found 4 issues (tests 1, 2, 4, 6); tests 3 and 5 passed. Plans 06-04 (cook-now grouping) and 06-05 (three wizard UI gaps) closed all four. Every gap is confirmed resolved in the codebase below.

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can set "who's eating?" portions, reusing household config | ✓ VERIFIED | `WizardServingsStep.widget.tsx` reads `selectHouseholdMembers`/`selectHouseholdHealthProfiles`; members render as full-width cards (line 82-113, `width:100%`, padding 16, minHeight 44, `#7436dc` accent); `WizardResult.widget.tsx:435-440` consumes `memberIds`/`servingCount` with household-profile fallback |
| 2 | User can optionally filter to "can cook now" using current inventory | ✓ VERIFIED | `answers.cookNowOnly` toggle (WizardResult:445); `DishScorer.groupCookNow` (line 406-428) now buckets on `baseReady` / missing-count, producing all three groups; real-pipeline test passes (DishScorer.test.ts:284-315) |
| 3 | From the result, user can add a missing ingredient to Đi chợ inline | ✓ VERIFIED | `wizard-add-missing-{dish.id}` (WizardResult:210); `confirmAddMissingIngredients` (331-) dispatches `addShoppingList` + `addIngredientGroupsToShoppingList`; existing-vs-new selector (577-595) lets user target a brand-new list |
| 4 | The wizard remembers last session's answers as defaults | ✓ VERIFIED | `WizardReducer.ts`: `lastCompletedAnswers` saved on advance/complete (54, 78), prefilled on restart (65), cleared via `clearWizardDefaults` (75); `Wizard.screen.tsx:58-68` gates clear behind `modal.confirm` |
| 5 | Each suggestion shows a one-line "why this dish" reason | ✓ VERIFIED | `wizard-reason-{dish.id}` (WizardResult:147) and `wizard-reason-detail-{dish.id}` (157); `DishScorer` produces cook-now/standard reasons |

**Score:** 5/5 truths verified (all supported by passing tests; visual/interaction confirmation routed to human below)

### Gap Closure Detail (the 4 UAT gaps)

| UAT Gap | Severity | Closure | Status |
|---------|----------|---------|--------|
| Test 4: cook-now collapses to middle group | major | 06-04: `baseReady` (unscaled) drives group 0; `<=2 missing` middle, else backup; removed `cookNowScore >= 0.58` clause | ✓ CLOSED (real-pipeline test pins three buckets) |
| Test 2: clear-defaults no confirm + cramped hint | major | 06-05: `modal.confirm` danger gate (Wizard.screen:58-68); hint `flexDirection: column`, title above buttons (73-108) | ✓ CLOSED |
| Test 1: member layout not a card | cosmetic | 06-05: full-width card with name + `HouseholdHealthStatusTag` + description (WizardServingsStep:82-113) | ✓ CLOSED |
| Test 6: no brand-new shopping list option | minor | 06-05: `missingTargetMode` state + Radio selector (WizardResult:280, 577-595); mode-aware `confirmAddMissingIngredients` | ✓ CLOSED |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `DishScorer.ts` | cook-now grouping decoupled from serving-scaled readiness | ✓ VERIFIED | `baseReady` field (213) computed unscaled (180-184); `groupCookNow` reads it (416) |
| `DishScorer.test.ts` | real scoreCookNow→groupCookNow test, servingCount > baseServings | ✓ VERIFIED | Test at 284-315, servingCount 4 vs baseServings 2; asserts all three labels + bucket placement |
| `Wizard.screen.tsx` | confirm-gated clear + stacked hint | ✓ VERIFIED | `useModal().confirm` (59-67); column hint (77) |
| `WizardServingsStep.widget.tsx` | full-width member cards w/ status + description | ✓ VERIFIED | Card + `HouseholdHealthStatusTag` (106) + `buildMemberDescription` (80) |
| `WizardResult.widget.tsx` | existing-vs-new shopping-list selector | ✓ VERIFIED | `missingTargetMode` (280), Radio.Group (578), mode-aware confirm (337) |
| `FastOverlay.tsx` / `Sheet/index.ts` | SheetActions defined + exported | ✓ VERIFIED | Component at FastOverlay:395, re-exported Sheet/index:1 (resolves deferred build break) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `groupCookNow` | `baseReady` | reads field set in `scoreInventoryDishes` | ✓ WIRED | line 416 reads 213 |
| `Wizard.screen` clear button | `clearWizardDefaults` | `modal.confirm` onOk dispatch | ✓ WIRED | 66 |
| `WizardServingsStep` card | `HouseholdHealthStatusTag` | `selectHouseholdHealthProfiles[member.id]?.status` | ✓ WIRED | 106 |
| `confirmAddMissingIngredients` | `addShoppingList`+append | `missingTargetMode` branch | ✓ WIRED | 337-359 |
| `WizardResult` import | `SheetActions` | `@components/Sheet` re-export | ✓ WIRED | now resolves (was TS2305) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Cook-now three-bucket pipeline test | `yarn test DishScorer.test.ts` | 8 passed | ✓ PASS |
| Wizard screen test (renders WizardResult) | `yarn test Wizard.screen.test.tsx` | 6 passed | ✓ PASS |
| Full suite | `yarn test --watchAll=false` | 7 suites / 33 passed | ✓ PASS |
| Type check | `npx tsc --noEmit` | exit 0 | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| WIZ2-01 | 06-01, 06-05 | "Who's eating?" portion step (reuses household config) | ✓ SATISFIED | Truth 1; full-width member cards |
| WIZ2-02 | 06-02, 06-04 | Optional inventory "can cook now" filter | ✓ SATISFIED | Truth 2; cook-now three-bucket fix |
| WIZ2-03 | 06-03, 06-05 | Inline add missing ingredient to Đi chợ | ✓ SATISFIED | Truth 3; existing-vs-new selector |
| WIZ2-04 | 06-01, 06-05 | Remember last session's answers | ✓ SATISFIED | Truth 4; confirm-gated clear |
| WIZ2-05 | 06-02 | One-line "why this dish" reasoning | ✓ SATISFIED | Truth 5; reason + detail sheet |

All 5 phase requirement IDs accounted for; none orphaned. REQUIREMENTS.md traceability (lines 103-107) marks all five Complete for Phase 6 (v2).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none) | — | No TBD/FIXME/XXX/PLACEHOLDER in modified files | ℹ️ Info | Clean |

Code-review findings carried from `06-REVIEW.md` (none critical, not goal-blocking):
- **WR-01** (warning): cook-now group `minScore`/`maxScore` metadata is now decorative and no longer matches `baseReady`/missing-count bucketing. Misleads any consumer trusting those ranges. Quality fix, not a goal blocker.
- **WR-02** (warning): switching to "Tạo danh sách mới" does not re-seed `selectedMissingIds`, so ingredients already on the old list stay unchecked on the fresh list. Surface this in human re-test of UAT gap 6.
- **WR-03** (warning): `baseReady` can place a dish in "Nấu ngay" while it still shows a "Thiếu N" badge at higher serving counts. Documented intent — confirm UX acceptability during human cook-now re-test.

### Human Verification Required

The four closed gaps were originally surfaced by human UAT and are visual/interaction in nature. Re-confirm against the running app:

#### 1. Cook-now three-bucket grouping (UAT test 4 re-test)
**Test:** Enable cook-now with real inventory and servingCount > 2; view results.
**Expected:** Nấu ngay, Cần mua thêm ít, and Dự phòng appear as appropriate, never one group.
**Why human:** Unit test pins the distribution; live-data end-to-end needs a human run. Confirm WR-03 UX (a "Nấu ngay" dish may still badge "Thiếu N").

#### 2. Member portions card layout (UAT test 1 re-test)
**Test:** Open the portions step on a phone viewport.
**Expected:** Full-width cards with name, status tag, short description; #7436dc selected accent.
**Why human:** Visual layout/stretch quality.

#### 3. Clear-defaults confirmation + stacked hint (UAT test 2 re-test)
**Test:** On a repeat run, click "Xóa lựa chọn đã nhớ".
**Expected:** A confirm dialog (danger ok) appears before deletion; hint reads title above two buttons.
**Why human:** Modal appearance + interaction.

#### 4. Brand-new shopping list selector (UAT test 6 re-test)
**Test:** With an open list present, add missing ingredients and choose "Tạo danh sách mới".
**Expected:** Name input reveals; a fresh list is created with the selected ingredients.
**Why human:** Interaction + verify WR-02 — the new list should contain all expected ingredients, not silently drop ones that were on the old list.

### Gaps Summary

No blocking gaps. All four UAT gaps are closed in the codebase: the cook-now grouping fix is pinned by a real `scoreCookNow→groupCookNow` test (servingCount 4 > baseServings 2), and the three wizard UI gaps (confirm-gated clear with stacked hint, full-width member cards, existing-vs-new shopping-list selector) are wired with all visible strings in `AppCopy.wizard`. The previously-deferred `SheetActions` build break is resolved (tsc exits 0). Full suite green (33/33).

Status is **human_needed** because all four originally-failing checks are visual/interaction UAT items that were first found by a human; automated checks confirm the implementation exists and is correct, but the user-facing layout and flow quality (the exact dimensions the original UAT flagged) should be re-confirmed on the running app. Three non-blocking code-review warnings (WR-01/02/03) are folded into the relevant human checks.

---

_Verified: 2026-06-19T11:40:00Z_
_Verifier: Claude (gsd-verifier)_
