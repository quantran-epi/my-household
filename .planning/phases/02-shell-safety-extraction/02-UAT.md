---
status: testing
phase: 02-shell-safety-extraction
source: [02-VERIFICATION.md]
started: 2026-06-15T21:25:00Z
updated: 2026-06-15T21:25:00Z
---

## Current Test

number: 1
name: Shell e2e identity proof (FND-02)
expected: |
  All specs pass green, unchanged from the 02-01 baseline — confirming pill, nav,
  drawer, search, and backup behave identically after extraction.
awaiting: user response

## Tests

### 1. Shell e2e identity proof (FND-02)
expected: |
  With the dev server running (free port 3010), run:
  `yarn test:e2e tests/e2e/app-shell-navigation.spec.ts tests/e2e/cooking-pill.spec.ts tests/e2e/global-search.spec.ts`
  All specs pass green, unchanged from the 02-01 baseline — confirming pill, nav,
  drawer, search, and backup behave identically after extraction.
result: [pending]

### 2. Error-boundary recovery UI (FND-01)
expected: |
  Run `yarn test:e2e tests/e2e/error-boundary.spec.ts`, and/or visit
  `/my-recipes/__crash-test` in a browser. The Vietnamese recovery UI
  ('Ứng dụng gặp chút trục trặc rồi' + 'Tải lại trang') shows instead of a white
  screen; reload restores the app.
result: [pending]

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
