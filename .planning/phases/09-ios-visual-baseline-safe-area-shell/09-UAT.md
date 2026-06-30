---
status: testing
phase: 09-ios-visual-baseline-safe-area-shell
source: [09-VERIFICATION.md]
started: 2026-06-30T09:30:00Z
updated: 2026-06-30T09:30:00Z
---

## Current Test

number: 1
name: Real-device home-indicator clearance for bottom nav + cooking pill
expected: |
  On a notched iPhone (or iOS Simulator) running the installed PWA with at least
  one active cooking session, both the bottom tab nav dock and the floating cooking
  pill sit fully above the home indicator with no overlap, and the scrollable
  content's last row is not clipped under the iOS toolbar or home indicator.
awaiting: user response

## Tests

### 1. Real-device home-indicator clearance for bottom nav + cooking pill
expected: On a notched iPhone (or iOS Simulator), open the installed PWA with at least one active cooking session and navigate so the bottom tab nav + cooking pill are visible. Both the bottom tab nav dock and the floating cooking pill sit fully above the home indicator with no overlap; the scrollable content's last row is not clipped under the iOS toolbar or home indicator.
result: [pending]
why_human: env(safe-area-inset-*) resolves to non-zero only on real notched hardware/simulator; jsdom and headless WebKit report 0, so the real clearance cannot be observed programmatically (per 09-VALIDATION.md Manual-Only).

### 2. WebKit e2e specs execute green on mobile-safari
expected: Run `npx playwright test tests/e2e/cooking-pill.spec.ts tests/e2e/sheet-picker.spec.ts --project=mobile-safari` (run `npx playwright install webkit` first if the binary is absent). The cooking-pill clearance test (pill bottom edge <= nav top edge) passes, and the sheet-picker touch-target test (trigger + sheet row boundingBox height >= 44) passes on the iPhone 13 descriptor.
result: [pending]
why_human: The mobile-safari WebKit runner / dev server is not available in this verification environment; the specs are authored and type-check clean but were not executed end-to-end.

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
