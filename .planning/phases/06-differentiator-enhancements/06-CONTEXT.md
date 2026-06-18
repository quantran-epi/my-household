# Phase 6: Differentiator Enhancements - Context

**Gathered:** 2026-06-18
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase adds the post-validation v2 differentiators to the existing meal wizard. It deepens the already-built mobile journey with optional portions, cook-now ranking, inline shopping-list help, remembered defaults, and one-line suggestion reasons. It must reuse the existing route-hosted wizard, selectors, bottom-sheet pattern, persisted `personal` root, and `AppCopy` source of truth.

It delivers:

1. A skippable "Who's eating?" portion step that reuses household members when available and falls back to serving count.
2. An optional "nấu được ngay" cook-now mode that ranks/groups results using current inventory instead of strictly hiding dishes.
3. An inline result-card action to add selected missing ingredients to Đi chợ.
4. Remembered wizard defaults from the last completed session.
5. A natural one-line "why this dish" reason on every suggestion, with a small detail affordance.

**In scope:** WIZ2-01, WIZ2-02, WIZ2-03, WIZ2-04, WIZ2-05.

**Explicitly NOT in scope:** the deferred time/effort step, desktop protection, new meal-planning domains, raw scoring UX, per-person portion controls, and a rewrite of existing wizard architecture.

</domain>

<decisions>
## Implementation Decisions

### Who's Eating? Portions (WIZ2-01)
- **D-01:** Add a skippable portions step after ingredients and before preferences. The step defaults from remembered answers or household size.
- **D-02:** When household members exist, the primary UI is selecting who is eating. The selected members derive total servings.
- **D-03:** Include a small `+ / -` serving adjust for guests, leftovers, or simple corrections.
- **D-04:** If no household members exist, fall back to a simple serving-count control. Do not require household setup.
- **D-05:** Do not expose per-person portion controls in this phase. Keep the mobile UI simple.
- **D-06:** When scheduling a result dish, carry selected `memberIds` when available. Use the serving count for guest/no-member fallback and dish serving data.
- **D-07:** Portion count may influence ranking and ingredient amounts where data exists, but it must not aggressively hide dishes.

### Can Cook Now Filter (WIZ2-02)
- **D-08:** Cook-now mode is an optional wizard toggle/chip, not an always-on hidden behavior and not a strict filter.
- **D-09:** When cook-now mode is on, rank and group results instead of hiding near-matches. Use up to three groups: `Nấu ngay`, `Cần mua thêm ít`, and `Dự phòng`.
- **D-10:** Prioritize cookability first inside cook-now mode, then sort by preference/taste within the groups.
- **D-11:** Result cards should show a short availability label and missing count, such as `Nấu ngay` or `Thiếu 2 món`.
- **D-12:** If inventory data is empty or stale, still show the cook-now control, but communicate that the signal is weak rather than blocking the flow.
- **D-13:** Always show fallback groups when ready-to-cook results are few. Avoid empty/dead-end results.
- **D-14:** Remember the cook-now toggle state as part of wizard defaults.

### Add Missing Ingredient To Đi chợ (WIZ2-03)
- **D-15:** From a result card, `Thêm vào Đi chợ` opens a bottom sheet listing the missing ingredients for that dish. The user selects which ingredients to add.
- **D-16:** Missing ingredients are preselected by default. Each row shows ingredient name, needed amount when known, and a selected checkbox. If amount is uncertain, show only the name.
- **D-17:** Add selected ingredients to the current active Đi chợ list when one exists. If no active list exists, open a choose/create-list bottom sheet.
- **D-18:** After adding, keep the user on the result page with inline success state and undo. Do not navigate away to Đi chợ.
- **D-19:** Skip duplicates already on the shopping list and show an already-added state. Do not blindly increase quantities.
- **D-20:** After ingredients are added, the card shows an added/manage/undo state rather than repeating the same ambiguous add action.
- **D-21:** Bottom-sheet actions follow the accepted Phase 5 pattern: one action stretches full width; two or more actions are horizontal and aligned across the sheet.

### Remember Last Answers (WIZ2-04)
- **D-22:** Starting the wizard again silently prefills from the last completed wizard session, with an easy reset/start-fresh action.
- **D-23:** Remember wizard preference answers: selected eaters/servings, selected ingredients as intent, cook-now toggle, preferred tags, avoided tags, and existing time/cost fields if present.
- **D-24:** Do not remember one-off result actions such as added-to-shopping-list state.
- **D-25:** Save remembered defaults when the user reaches the result step. Half-finished step changes should not overwrite useful defaults.
- **D-26:** Show a subtle "using last choices" hint with reset. Avoid a prominent banner or a gate before the wizard.
- **D-27:** Persist remembered defaults across app restart/browser refresh using the existing `personal` root.
- **D-28:** Reset/start-fresh clears the current wizard run only. It does not delete stored defaults.
- **D-29:** A permanent clear-defaults action should exist, but as a secondary action outside the main flow.
- **D-30:** If remembered ingredients conflict with current inventory, keep selected ingredients as user intent while cook-now scoring reflects current inventory.

### Why This Dish Reason (WIZ2-05)
- **D-31:** Every suggestion card shows the best available one-line reason.
- **D-32:** The card reason uses natural household Vietnamese, not scoring jargon. Examples of the desired tone: `ít phải mua thêm`, `hợp món nhà mình`, `đủ phần cho bữa này`.
- **D-33:** Prioritize the most practical reason first: inventory/cook-now fit, then preference/tag match, then household/serving fit.
- **D-34:** Negative reasons must be helpful, not punitive. Prefer `Cần mua thêm 2 món`; reserve stronger warnings like avoided tags for details when needed.
- **D-35:** Allow truthful repetition across cards, but vary wording lightly so the list does not feel robotic.
- **D-36:** Place a small `?` detail button beside the reason line. It opens a bottom sheet.
- **D-37:** The detail sheet explains matched ingredients, missing ingredients, preference/avoid tags, serving fit, and why the dish ranked the way it did. It should be precise but non-numeric: no raw score numbers unless a future phase explicitly asks for them.
- **D-38:** The detail sheet may include only relevant actions. If there are missing ingredients, include add-to-Đi chợ; otherwise only close/confirm. Use the same bottom-sheet action layout rule from D-21.

### Agent's Discretion
- Exact field names and state shape for the new wizard answers and remembered defaults, as long as they stay under the existing persisted `personal` root and respect selector-only reads.
- Exact Vietnamese copy in `AppCopy`, provided it follows the natural household tone and does not expose raw scoring math.
- Exact active-shopping-list detection rule, provided the user does not have to choose a list when there is a clear current list.
- Exact threshold for grouping `Cần mua thêm ít` versus `Dự phòng`, provided ready-to-cook dishes are prioritized and fallback groups remain visible.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/ROADMAP.md` — Phase 6 goal, dependency on Phase 5, success criteria, and explicit deferral of the time/effort step.
- `.planning/REQUIREMENTS.md` — WIZ2-01 through WIZ2-05 are the complete v2 requirement set for this phase.
- `.planning/PROJECT.md` — project boundary and household meal-planning intent.
- `.planning/STATE.md` — current workflow state and recent Phase 5 UAT completion.

### Prior Phase Decisions
- `.planning/phases/03-wizard-state-slice/03-CONTEXT.md` — wizard state lives under the existing `personal` root; step keys are strings; use selector-only reads.
- `.planning/phases/04-wizard-ui-hero-entry/04-CONTEXT.md` — route-hosted wizard, skip-with-default posture, result fallback ladder, and wizard UI decisions that Phase 6 must extend rather than replace.
- `.planning/phases/05-mobile-tuning-copy-rollout/05-CONTEXT.md` — phone-first posture, natural Vietnamese copy, app-wide bottom-sheet pattern, and no desktop protection.

### Codebase Maps
- `.planning/codebase/ARCHITECTURE.md` — persisted roots, module boundaries, and Redux structure.
- `.planning/codebase/CONVENTIONS.md` — selector-only reads, `.screen`/`.widget` naming, Vietnamese copy conventions, and match-surrounding-style rules.
- `.planning/codebase/CONCERNS.md` — known risks and oversized areas; useful for planning blast radius.

### Source Files To Inspect
- `src/Store/Models/Wizard.ts` — current `WizardAnswers` shape already includes `selectedIngredientIds`, preference fields, and `extras`.
- `src/Store/Reducers/WizardReducer.ts` — `commitWizardAnswer` merges answers/extras, `restartWizard` currently clears answers, `completeWizard` marks completion.
- `src/Store/Selectors.ts` — canonical selectors for wizard, inventory, ingredients, shopping lists, household members, and household preference profile.
- `src/Store/Reducers/AppContextReducer.ts` — `HouseholdPreferenceProfile` includes serving count, preferred/avoided tags, member IDs/names, and related normalization.
- `src/Modules/MealPlanning/Screens/WizardIngredientStep.widget.tsx` — current ingredient step and selected ingredient answer path.
- `src/Modules/MealPlanning/Screens/WizardPreferenceStep.widget.tsx` — current preference step; should be extended without making the wizard heavy.
- `src/Modules/MealPlanning/Screens/WizardResult.widget.tsx` — current result screen uses `DishScorer.score`, shows top 5/fallback catalog, and schedules meals with empty `memberIds`/`dishServings`.
- `src/Modules/DishSuggester/Helpers/DishScorer.ts` — existing `scoreCookNow`, `groupCookNow`, `cookNowReasons`, preference tags, household warnings, and serving-scale support.
- `src/Store/Reducers/ShoppingListReducer.ts` — current shopping-list actions include generating ingredients from dishes/meals and adding dishes to a list, but not a dedicated selected-missing-ingredient add flow.
- `src/Store/Models/ShoppingList.ts` — shopping list ingredient group/amount model for adding selected missing items without duplicates.
- `src/Components/Sheet/SheetActions.tsx` — shared action layout already supports one full-width action and two horizontal actions.
- `src/Common/Copy/AppCopy.ts` — source of truth for new user-facing Vietnamese copy.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DishScorer.scoreCookNow(...)` already returns cook-now score, total minutes, preference matched/avoided tags, household matches/warnings, missing ingredients, and `cookNowReasons`. Use this before inventing new scoring logic.
- `DishScorer.groupCookNow(...)` already groups scored dishes into `Nấu ngay`, `Mua thêm ít`, and `Dự phòng`; Phase 6 may adjust labels/copy to match D-09.
- `WizardAnswers.extras` can carry new optional wizard fields if the planner wants a low-disruption path, but the state shape should still be explicit enough for selectors/tests.
- `Sheet` and `SheetActions` are the established bottom-sheet/action pattern. Reuse them for reason details, missing-ingredient selection, list fallback, and any relevant confirmations.
- `AppCopy` is the only place for new visible copy.

### Established Patterns
- Wizard state is persisted under `personal`; do not create a new storage domain.
- Screens should read state through selectors, not direct `state.personal.*` access.
- Bottom sheets should avoid redundant scroll/overflow and keep action rows stable.
- Phone-first mobile behavior is the protected UX; desktop is not a Phase 6 constraint.

### Integration Points
- `WizardResult` is the main result integration point: switch from the simple `score(...)` path to the richer cook-now/profile-aware scoring when needed, render grouped results, show reason lines, open details sheets, and carry `memberIds`/servings into scheduled meals.
- Wizard step ordering needs to insert the portion step after ingredients and before preferences while preserving string step keys.
- Remembered defaults likely need a separate persisted value from current `answers`, because reset/start-fresh clears only the current run while stored defaults remain.
- Shopping-list inline add likely needs a new reducer/action or helper path for selected ingredient groups; existing `generateIngredient` and `addDishesToShoppingList` are dish/list oriented and should not be stretched into unclear behavior.
- Tests should cover state persistence semantics, result grouping/fallback, duplicate skipping for shopping-list adds, and the reason/detail affordance.

</code_context>

<specifics>
## Specific Ideas

- Bottom-sheet action behavior is locked from Phase 5 and reaffirmed here: one button full width; two or more buttons horizontal, aligned across the sheet, with no redundant overflow/scroll.
- The user specifically wants natural card wording plus a small `?` button for precise, non-numeric explanation details.
- The result page should stay in place after add-to-Đi chợ actions; success/undo happens inline.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 6 scope.

</deferred>

---

*Phase: 6-Differentiator Enhancements*
*Context gathered: 2026-06-18*
