---
status: complete
phase: 04-wizard-ui-hero-entry
source: [04-VERIFICATION.md]
started: 2026-06-16T14:10:00Z
updated: 2026-06-16T14:30:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Home hero — single obvious "Hôm nay ăn gì?" entry (phone + desktop)
expected: Dominant white-pill "Hôm nay ăn gì?" button at the top of the hero opens /meal-planning/wizard; priorityAction + metrics still render below it; desktop layout unchanged.
result: pass

### 2. Full wizard walk — guided feel, progress, back
expected: center tab → ingredient → preference → result → add a dish. One question per screen, segmented progress advances, back returns to the prior step, add toast fires; flow feels guided, not admin-like.
result: pass

### 3. WR-01 — re-entry after completing the wizard
expected: Product ruling. Complete the wizard once, then tap the center "Nấu gì?" tab again. Currently it resumes on the stale completed result (restartWizard exists in the reducer but is never dispatched from the UI). Decide: restart at ingredient step vs. resume on stale result. First-time-user goal is unaffected; this is returning-user behavior.
result: pass

### 4. WR-02 — duplicate back control on preferences step
expected: UX ruling. The preferences step shows two back affordances (circular wizard-back from WizardProgress + inline wizard-preference-back), both wired to goBack and functional. Decide: acceptable, or consolidate to one.
result: pass

### 5. WR-03 — keyboard operability of picker triggers
expected: Scope ruling. The ingredient/preference picker triggers are clickable <Box> elements with no role/tabIndex/onKeyDown. Decide: make keyboard-operable now, or defer to the Phase 5 mobile/a11y pass.
result: pass

## Summary

total: 5
passed: 5
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
