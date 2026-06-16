---
status: diagnosed
phase: 04-wizard-ui-hero-entry
source: [04-VERIFICATION.md]
started: 2026-06-16T14:10:00Z
updated: 2026-06-16T15:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Home hero — single obvious "Hôm nay ăn gì?" entry (phone + desktop)
expected: Dominant white-pill "Hôm nay ăn gì?" button at the top of the hero opens /meal-planning/wizard; priorityAction + metrics still render below it; desktop layout unchanged.
result: pass

### 2. Full wizard walk — guided feel, progress, back
expected: center tab → ingredient → preference → result → add a dish. One question per screen, segmented progress advances, back returns to the prior step, add toast fires; flow feels guided, not admin-like.
result: issue
reported: "the walkthrough not has complete button"
severity: major

### 3. WR-01 — re-entry after completing the wizard
expected: Product ruling. Complete the wizard once, then tap the center "Nấu gì?" tab again. Currently it resumes on the stale completed result (restartWizard exists in the reducer but is never dispatched from the UI). Decide: restart at ingredient step vs. resume on stale result. First-time-user goal is unaffected; this is returning-user behavior.
result: issue
reported: "finish and open again not reset"
severity: major

### 4. WR-02 — duplicate back control on preferences step
expected: UX ruling. The preferences step shows two back affordances (circular wizard-back from WizardProgress + inline wizard-preference-back), both wired to goBack and functional. Decide: acceptable, or consolidate to one.
result: pass

### 5. WR-03 — keyboard operability of picker triggers
expected: Scope ruling. The ingredient/preference picker triggers are clickable <Box> elements with no role/tabIndex/onKeyDown. Decide: make keyboard-operable now, or defer to the Phase 5 mobile/a11y pass.
result: pass

### 6. Result step — action buttons overflow
expected: On the result step, each dish row's action buttons ("Thêm vào hôm nay" / "Chọn ngày khác") fit within the card on a phone-width viewport without spilling past the edge.
result: issue
reported: "button overflow"
severity: minor

## Summary

total: 6
passed: 3
issues: 3
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "The wizard provides an explicit complete/finish affordance to end the flow"
  status: failed
  reason: "User reported: the walkthrough not has complete button"
  severity: major
  test: 2
  root_cause: "WizardResult.widget.tsx has no explicit finish/done control. completeWizard() is dispatched only as a side-effect of addDishToDay (line 110), so the flow has no way to be marked complete without adding a dish. There is no 'Xong'/'Hoàn tất' button on the result step."
  artifacts:
    - path: "src/Modules/MealPlanning/Screens/WizardResult.widget.tsx"
      issue: "No explicit finish/complete button; completion is implicit on dish-add only"
  missing:
    - "Add an explicit finish/done button on the result step that dispatches completeWizard() and navigates away (e.g. back to home)"
  debug_session: ""

- truth: "Finishing the wizard and reopening it starts a fresh flow at the first step"
  status: failed
  reason: "User reported: finish and open again not reset"
  severity: major
  test: 3
  root_cause: "Wizard.screen.tsx renders off the persisted currentStep with no status check. After completeWizard() sets status='completed', currentStep stays 'result', so re-entry shows the stale result. restartWizard exists in WizardReducer.ts (line 52) but is never dispatched from any UI surface."
  artifacts:
    - path: "src/Modules/MealPlanning/Screens/Wizard.screen.tsx"
      issue: "No effect to dispatch restartWizard when entering with status='completed'"
    - path: "src/Store/Reducers/WizardReducer.ts"
      issue: "restartWizard action defined but never dispatched from UI"
  missing:
    - "On wizard mount, if status==='completed', dispatch restartWizard() so re-entry starts at the ingredients step with cleared answers"
  debug_session: ""

- truth: "Result-step action buttons fit within the card on phone-width without overflowing"
  status: failed
  reason: "User reported: button overflow"
  severity: minor
  root_cause: "ResultRow (WizardResult.widget.tsx:56) places both action buttons in a Stack with no direction prop. Stack defaults flexDirection to undefined → CSS row with no flexWrap, so the two buttons (each paddingInline:20) sum wider than a narrow card and overflow horizontally."
  test: 6
  artifacts:
    - path: "src/Modules/MealPlanning/Screens/WizardResult.widget.tsx"
      issue: "ResultRow action Stack has no direction/wrap; row buttons overflow on narrow viewports"
  missing:
    - "Make the result-row action Stack stack vertically (direction='column' fullwidth) or allow wrap so buttons fit phone width"
  debug_session: ""
