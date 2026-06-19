---
status: diagnosed
trigger: "member-selection-layout: On the wizard portions step the member selection layout is not good. User wants each member as a full-width card showing name, status, and a short description."
created: 2026-06-19T00:00:00Z
updated: 2026-06-19T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED — Member selection renders as a minimal name-only button. HouseholdMemberProfile has no literal `status`/`description` field; status comes from the separate HouseholdHealth slice and "description" must be derived from existing profile fields.
test: Confirmed via reading the model, selectors, and reusable display patterns.
expecting: n/a (diagnosis complete)
next_action: Return ROOT CAUSE FOUND (find_root_cause_only mode — no fix applied).

## Symptoms

expected: Each household member appears as a full-width selectable card containing the member's name, status, and a short description.
actual: Member selection layout is poor/cramped; members render as a thin button showing only name + check icon.
errors: None reported.
reproduction: Test 1 in .planning/phases/06-differentiator-enhancements/06-UAT.md — open meal wizard, pick ingredients, reach portions/member-selection step.
started: Discovered during UAT of Phase 6.

## Eliminated

## Evidence

- timestamp: 2026-06-19T00:00:00Z
  checked: src/Modules/MealPlanning/Screens/WizardServingsStep.widget.tsx lines 61-93
  found: Members render via members.map as a <button> with minHeight 44, padding "10px 12px", showing only member.name (Typography.Text) and a CheckOutlined when active. No status or description rendered.
  implication: Layout uses only name; need to add status + description and make it a full-width card.

- timestamp: 2026-06-19T00:00:00Z
  checked: src/Store/Reducers/AppContextReducer.ts:76-94 (HouseholdMemberProfile type) and selectHouseholdMembers (Selectors.ts:77).
  found: HouseholdMemberProfile has id, name, color, avatar, favoriteDishIds, avoidedDishIds, favoriteIngredientIds, avoidedIngredientIds, allergenIngredientIds, hardExcludedIngredientIds, preferredTags, avoidedTags, nutritionGoalId, portionPreference, notes, createdAt, updatedAt. There is NO literal `status` or `description` field.
  implication: "Status" and "short description" must be sourced/derived, not read from a single field.

- timestamp: 2026-06-19T00:00:00Z
  checked: src/Store/Reducers/HouseholdHealthReducer.ts:5-16 and Selectors.ts:97-109.
  found: Member "status" lives in a separate slice — HouseholdMemberHealthProfile.status: 'neutral'|'healthy'|'sick'|'recovering' (+ optional statusNote). Accessed via selectHouseholdHealthProfiles (map keyed by memberId) or selectMemberHealthProfile(memberId).
  implication: To show status in the wizard card, pull from the health slice keyed by member.id; default to 'neutral' when absent.

- timestamp: 2026-06-19T00:00:00Z
  checked: src/Modules/Home/Screens/HouseholdProfiles.screen.tsx:396-415 and HouseholdHealth.widget.tsx:274-279.
  found: An existing full-width member row already implements the exact desired pattern — avatar chip (member.color/name), member.name, a one-line preference summary ("X thích · Y tránh · Z chặn"), and a status tag via the reusable <HouseholdHealthStatusTag status={...} compact /> component. The status tag component is exported from HouseholdHealth.widget.tsx.
  implication: Reuse HouseholdHealthStatusTag for the status; reuse the "X thích · Y tránh · Z chặn" composition (or member.notes) for the short description. No new model fields or components are strictly required.

## Resolution

root_cause: The wizard portions step (WizardServingsStep.widget.tsx, lines 61-93) renders each household member as a thin 44px <button> that displays only member.name + a check icon. It never renders the member's status or any descriptive text. The data needed exists but is not wired in: (1) "status" is not a field on HouseholdMemberProfile — it lives in the separate HouseholdHealth slice (HouseholdMemberHealthProfile.status), and (2) there is no literal "description" field, so a short description must be composed from existing profile fields (e.g. the "X thích · Y tránh · Z chặn" preference summary or member.notes). The layout therefore looks cramped because the markup is a single-line name button, not a multi-line card, and the status/description data sources were never connected.
fix: (diagnose-only — not applied) See suggested fix direction in returned diagnosis.
verification: n/a (find_root_cause_only mode)
files_changed: []
