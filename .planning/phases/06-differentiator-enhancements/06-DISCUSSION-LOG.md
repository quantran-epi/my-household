# Phase 6: Differentiator Enhancements - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-18
**Phase:** 6-Differentiator Enhancements
**Areas discussed:** Who's eating? portions, Can cook now filter, Add missing ingredient to Đi chợ, Remember last answers, Why this dish reason

---

## Who's Eating? Portions

**Selected decisions:**
- Use household member selection plus quick serving adjust.
- If no household members exist, fall back to simple serving count.
- Carry selected `memberIds` into scheduled meals when available.
- Make the step skippable with remembered/default values.
- Use selected members to calculate total servings; do not expose per-person portion controls.
- Use a small `+ / -` serving adjust for guests/leftovers.
- Place the step after ingredients and before preferences.
- Use portion count for ranking/amounts where data exists, without aggressively hiding dishes.

**Alternatives considered:** simple serving count only; full member and serving controls; prompt/require household setup; ask again at scheduling; required step; per-member portion controls; explicit guest count; first-step or near-result placement; strict portion-fit filtering.

**Notes:** User preferred the recommended lightweight mobile path throughout. Extra discussion clarified that household data should improve defaults and scheduling, not make the wizard heavy.

---

## Can Cook Now Filter

**Selected decisions:**
- Use rank/group behavior, not strict hiding.
- Add an optional `nấu được ngay` toggle/chip in the wizard.
- In cook-now mode, prioritize cookability first, then preferences.
- Show a short availability label and missing count on result cards.
- If inventory data is empty/stale, keep the toggle but explain the weak signal.
- Use up to three groups: `Nấu ngay`, `Cần mua thêm ít`, `Dự phòng`.
- Remember the cook-now toggle as part of wizard defaults.
- Always show fallback groups when ready-to-cook results are few.

**Alternatives considered:** strict filter toggle; always-on cook-now ranking; result-page-only filter; preferences-first ranking; dense inline missing ingredients; hiding the toggle on weak inventory; two groups only; no visible groups; default-off each session; show fallbacks only after a tap.

**Notes:** User wants cook-now to guide the list without causing dead ends.

---

## Add Missing Ingredient To Đi chợ

**Selected decisions:**
- Result-card action opens a bottom sheet with missing ingredients and lets the user choose what to add.
- Add to the current active Đi chợ list when available; otherwise open a choose/create-list bottom sheet.
- Keep the user on results after adding, with inline success state and undo.
- Skip duplicates and show an already-added state.
- Bottom-sheet actions follow the existing rule: one full-width confirm action when alone; cancel/confirm horizontal when both show.
- Missing item rows show name, needed amount when known, and selected checkbox.
- Preselect all missing ingredients.
- After adding, show added/manage/undo state on the card.

**Alternatives considered:** add all missing items automatically; one ingredient at a time; always ask which list; create a new list per dish; toast only; navigate to Đi chợ; increase duplicate quantities; always show two sheet actions; inline item buttons; name-only rows; start with no selected items; permanently disable the action.

**Notes:** User reaffirmed the bottom-sheet action rule from Phase 5.

---

## Remember Last Answers

**Selected decisions:**
- Prefill last answers silently when the wizard starts, with easy reset/start-fresh.
- Remember all wizard preference answers except one-off result actions.
- Save remembered defaults when the user reaches results.
- Show a subtle `using last choices` hint plus reset.
- Persist defaults across app restart/refresh using the existing personal root.
- Reset/start-fresh clears the current run but keeps stored defaults.
- Provide permanent clear-defaults as a secondary action outside the main flow.
- If remembered ingredients conflict with current inventory, keep selected ingredients as intent while cook-now scoring uses current inventory.

**Alternatives considered:** ask `use last choices?` before the wizard; start fresh with inline suggestions; remember only preferences; remember one-off result actions; save after every step; save only after scheduling; no hint; prominent banner; session-only defaults; permanent reset beside main reset; drop unavailable ingredients; conflict warning.

**Notes:** User wants repeat use to be fast, but with reset affordances that avoid trapping the user in stale defaults.

---

## Why This Dish Reason

**Selected decisions:**
- Show a concise reason line plus expandable detail.
- Prioritize the most practical reason first: inventory/cook-now fit, then preference/tag match, then household/serving fit.
- Open detail in a bottom sheet.
- Detail sheet includes matched ingredients, missing ingredients, preference/avoid tags, and serving fit, without raw numeric scoring.
- Phrase negative reasons helpfully, not punitively.
- Always show the best available reason line on every suggestion.
- Allow truthful repetition but vary wording lightly.
- Include relevant actions in the detail sheet, especially add-to-Đi chợ when missing ingredients exist.
- Card wording stays natural and household-friendly.
- Add a small `?` detail button beside the reason line for precise, non-numeric explanation of factors and ranking.

**Alternatives considered:** one-line reason only; detailed reasons inline; taste-first reasons; rotating reason types; inline card expansion; separate page; full scoring breakdown; direct warning phrasing; hide negative reasons; only show strong reasons; force unique reasons; explanation-only detail sheet; all actions in detail; precise scoring wording; very short labels only; question-mark action in row or overflow menu.

**Notes:** User clarified that `natural household wording` is correct for the card, but the small `?` button should reveal a more precise explanation. User explicitly confirmed the detail should remain precise-but-non-numeric, not raw score numbers.

---

## Agent's Discretion

- Exact field names and state shape for new wizard answers/defaults.
- Exact copy strings in `AppCopy`, as long as the card remains natural and the detail stays precise but non-numeric.
- Exact group thresholds and active-list detection behavior.

## Deferred Ideas

None.
