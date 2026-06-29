---
phase: 8
slug: sheet-picker-component-layer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-29
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest + React Testing Library (CRA preset via `react-scripts test`); Playwright `@playwright/test@1.60.0` for touch e2e |
| **Config file** | none standalone (CRA preset + `jest.moduleNameMapper` in `package.json` maps `@components/*`); `playwright.config.ts` for e2e |
| **Quick run command** | `CI=true npx react-scripts test --watchAll=false src/Components/SheetPicker/<PickerInProgress>` |
| **Full suite command** | `CI=true npx react-scripts test --watchAll=false` then `npm run test:e2e -- --project=mobile-safari` |
| **Estimated runtime** | ~30-60 seconds (unit subset); full unit suite + e2e several minutes |

---

## Sampling Rate

- **After every task commit:** Run `CI=true npx react-scripts test --watchAll=false src/Components/SheetPicker/<PickerInProgress>`
- **After every plan wave:** Run `CI=true npx react-scripts test --watchAll=false src/Components/SheetPicker`
- **Before `/gsd-verify-work`:** Full unit suite green + new `mobile-safari` e2e spec green
- **Max feedback latency:** ~60 seconds (unit subset)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| (assigned by planner) | — | — | PICK-01 | — | N/A (client UI) | unit | `react-scripts test SheetSelect` | ❌ W0 | ⬜ pending |
| (assigned by planner) | — | — | PICK-02 | — | search filter never eval'd/rendered as HTML | unit | `react-scripts test SheetSelect` | ❌ W0 | ⬜ pending |
| (assigned by planner) | — | — | PICK-03 | — | N/A | unit | `react-scripts test SheetMultiSelect` | ❌ W0 | ⬜ pending |
| (assigned by planner) | — | — | PICK-04 | — | N/A | unit | `react-scripts test SheetMultiSelect` | ❌ W0 | ⬜ pending |
| (assigned by planner) | — | — | PICK-05 | — | N/A | unit | `react-scripts test SheetDatePicker` | ❌ W0 | ⬜ pending |
| (assigned by planner) | — | — | PICK-06 | — | N/A | unit | `react-scripts test SheetDatePicker` | ❌ W0 | ⬜ pending |
| (assigned by planner) | — | — | PICK-07 | — | N/A | unit | `react-scripts test SheetActionMenu` | ❌ W0 | ⬜ pending |
| (assigned by planner) | — | — | PICK-08 | — | N/A | unit (RTL `<Form onFinish>`) | `react-scripts test SheetPicker` | ❌ W0 | ⬜ pending |
| (assigned by planner) | — | — | PICK-01/03/04 | — | N/A | e2e | `npm run test:e2e -- --project=mobile-safari` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/Components/SheetPicker/SheetSelect/SheetSelect.test.tsx` — PICK-01/02
- [ ] `src/Components/SheetPicker/SheetMultiSelect/SheetMultiSelect.test.tsx` — PICK-03/04
- [ ] `src/Components/SheetPicker/SheetDatePicker/SheetDatePicker.test.tsx` — PICK-05/06
- [ ] `src/Components/SheetPicker/SheetActionMenu/SheetActionMenu.test.tsx` — PICK-07
- [ ] A Form-binding test per picker (PICK-08) — section in each file or a `*.formbind.test.tsx`
- [ ] `tests/e2e/sheet-picker.spec.ts` + a test-only fixture route (mirror `SheetGestureFixture.screen.tsx` + `tests/e2e/native-sheet.spec.ts`) on the `mobile-safari` project — pickers are unused by real screens this phase, so a fixture route is required to drive them
- [ ] No framework install needed (Jest + RTL + Playwright all present)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real-device iOS keyboard does not shove the search/time field behind the sheet | PICK-02/06 | jsdom/Playwright desktop cannot reproduce the iOS Safari virtual-keyboard `position:fixed` interaction | On a physical iPhone, open SheetSelect with search and SheetDatePicker `showTime`; confirm the field stays visible above the keyboard |

*Gesture commit/revert (drag-dismiss reverts a dirty multi-select draft) is automated via the Playwright `mobile-safari` e2e, not manual.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
