---
status: diagnosed
trigger: "clear-defaults-confirm-and-layout — (1) Xóa lựa chọn đã nhớ deletes with no confirmation; (2) hint + 2 buttons layout is cramped, title should be above and buttons below"
created: 2026-06-19T00:00:00Z
updated: 2026-06-19T00:00:00Z
---

## Current Focus

hypothesis: Both issues confirmed by direct code read. (1) clear action dispatches clearWizardDefaults directly in onClick with no confirm wrapper. (2) hint container uses row flex (space-between) forcing title + buttons onto one line.
test: read Wizard.screen.tsx, WizardReducer.ts, AppCopy.ts, existing modal.confirm pattern
expecting: confirmed
next_action: return ROOT CAUSE FOUND

## Symptoms

expected: Clearing remembered defaults shows a confirmation prompt before deletion (no silent deletion, per UI-SPEC "Destructive confirmation"). The remembered-defaults hint is laid out with the title text on top and the two action buttons below it.
actual: Clearing happens with no confirmation. The hint and two buttons are condensed together on a cramped layout.
errors: None reported.
reproduction: Test 2 in 06-UAT.md — start a repeat wizard run so remembered defaults appear, observe the hint and try the clear-defaults action.
started: Discovered during UAT of Phase 6 (introduced in plan 06-01).

## Evidence

- checked: Wizard.screen.tsx lines 82-90 (clear button)
  found: onClick={() => dispatch(clearWizardDefaults())} — fires reducer directly, no Modal.confirm / Sheet confirmation step
  implication: silent deletion — violates UI-SPEC "Destructive confirmation; no silent deletion"

- checked: WizardReducer.ts clearWizardDefaults (lines 74-76)
  found: sets state.lastCompletedAnswers = undefined immediately
  implication: reducer is correct; the missing guard is at the UI dispatch site

- checked: Wizard.screen.tsx lines 56-92 (hint container)
  found: outer Box style display:flex, alignItems:center, justifyContent:space-between — title <span> and the buttons <div> are siblings on one horizontal row
  implication: row layout causes the cramped look; needs flexDirection:column to stack title above buttons

- checked: existing confirmation pattern (DishesDetail.screen.tsx lines 65-75)
  found: const modal = useModal() from @components/Modal/ModalProvider; modal.confirm({ title, content, okText:"Xóa", cancelText:"Huỷ", okButtonProps:{danger:true}, centered:true, onOk })
  implication: reusable in-app pattern; wizard clear should adopt it

- checked: AppCopy.wizard (AppCopy.ts lines 52-54)
  found: usingLastChoices, startFreshAction, clearDefaultsAction exist; NO confirm title/body keys for the destructive confirmation
  implication: need new AppCopy.wizard keys for confirm title + body (UI-SPEC requires copy in AppCopy.wizard)

## Resolution

root_cause: |
  (1) Missing confirmation: the "Xóa lựa chọn đã nhớ" button in Wizard.screen.tsx wires onClick directly to dispatch(clearWizardDefaults()), with no confirmation gate. UI-SPEC Copywriting Contract requires a "Destructive confirmation" with no silent deletion.
  (2) Cramped layout: the hint container (Box, lines 57-92) uses a single-row flex (display:flex; alignItems:center; justifyContent:space-between) with the title <span> and the two-button <div> as horizontal siblings, so everything sits on one line.
fix: ""
verification: ""
files_changed: []
