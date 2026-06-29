---
phase: 07-native-sheet-foundation
plan: 07-03
subsystem: testing
tags: [playwright, webkit, e2e, touch-gestures, bottom-sheet, ios, pointer-events]

requires:
  - phase: 07-native-sheet-foundation
    plan: 07-02
    provides: Upgraded Sheet (grabber, data-drag-handle, pointer-capture drag reducer, safe-area/dvh CSS) the touch e2e drives
provides:
  - mobile-safari WebKit iPhone Playwright project (hasTouch/isMobile) alongside the preserved chromium project
  - Six-flow WebKit touch e2e proving drag-dismiss, spring-back, scroll-vs-drag arbitration, maskClosable protection, nested stacking, safe-area/dvh layout
  - Test-only Sheet gesture fixture route (/__sheet-gesture-fixture) mounting the Sheet variants product screens do not expose deterministically
  - Sheet pointer-handler fixes (deferred capture, nested-drag isolation) found via real touch events
affects: [native-sheet, e2e-suite]

tech-stack:
  added: []
  patterns:
    - "WebKit iPhone Playwright project via devices['iPhone 13'] spread into project.use"
    - "Real pointer gestures driven by page.mouse (move/down/move*/up) so WebKit emits genuine pointerdown/move/up the Sheet handlers consume"
    - "Post-gesture state assertions only (presence/absence, scrollTop, body scroll-lock, z-stacking, computed padding/height); no mid-drag transform assertions"
    - "expect.poll on the resting transform matrix translateY to wait out the 180ms slide-in before measuring layout"

key-files:
  created:
    - tests/e2e/native-sheet.spec.ts
    - src/Routing/SheetGestureFixture.screen.tsx
  modified:
    - playwright.config.ts
    - src/Routing/RootRouter.tsx
    - src/Routing/RootRoutes.ts
    - src/Components/FastOverlay/FastOverlay.tsx

key-decisions:
  - "WebKit was already installed by the orchestrator (webkit-2287 in ~/Library/Caches/ms-playwright); the Task 1 human-action install gate was pre-satisfied and skipped"
  - "Added a minimal test-only fixture route (/__sheet-gesture-fixture) following the existing /__crash-test pattern because the dish-suggester Sheet flow is non-deterministic to reach and exposes no maskClosable=false or nested A->B variant"
  - "Drove gestures via page.mouse rather than page.touchscreen.tap: tap fires a single down/up with no intermediate moves, so the drag reducer never receives the monotonic move samples it needs; mouse move/down/move*/up produces real pointerType events with a controllable drag distance"
  - "Deferred setPointerCapture from pointerdown to the moment a drag is confirmed (onDragMove), so a plain tap still dispatches its compatibility click to interactive children inside the sheet"
  - "Added stopPropagation in beginDrag so a nested Sheet B's pointerdown does not bubble through the React tree to ancestor Sheet A's body drag handler"

requirements-completed: [SHEET-03, SHEET-05, SHEET-06]

duration: ~35min
completed: 2026-06-29
---

# Phase 07 Plan 03: Native Sheet Foundation — WebKit Touch E2E Summary

**Added a real touch-capable WebKit/iPhone Playwright project and a six-flow touch e2e that drives genuine pointer gestures against the 07-02 Sheet, proving drag-to-dismiss, spring-back, scroll-vs-drag arbitration, maskClosable protection, nested stacking, and safe-area/dvh layout — and uncovered and fixed two real Sheet pointer-handler bugs in the process.**

## Performance

- **Duration:** ~35 min
- **Tasks:** 2 (plus 2 deviation fixes)
- **Files created:** 2
- **Files modified:** 4

## Accomplishments

- **Task 1 (mobile-safari project):** Imported `devices` from `@playwright/test` and added a second `mobile-safari` project to `playwright.config.ts` using `...devices['iPhone 13']` (sets `defaultBrowserType: 'webkit'`, `hasTouch: true`, `isMobile: true`, mobile viewport). The original chromium project stays first and unchanged; `npx playwright test --list` shows both. The WebKit binary install (the gated human-action step) was already satisfied by the orchestrator, so it was skipped (D-08, SHEET-05).
- **Task 2 (six-flow touch e2e):** Created `tests/e2e/native-sheet.spec.ts` with six tests, each named for the requirement it proves, driven by real pointer gestures and asserting post-gesture state only:
  - drag past 40% dismisses (SHEET-01/02) — section detached, backdrop gone
  - drag under 40% springs back (SHEET-01/02) — section still attached
  - scroll-then-drag keeps sheet open then dismisses at top (SHEET-03) — scrolled body consumes the drag (reducer B5), top body drag dismisses (B3+D2)
  - maskClosable=false springs back (SHEET-04) — reducer D1 short-circuit, grabber + safe-area floor intact
  - nested sheet stacks and dismisses independently (SHEET-06) — B stacked above A by resolved z-index, body scroll-locked, B dismissed while A stays open and locked
  - safe-area + dvh layout on iPhone (SHEET-05) — top on-screen, bottom within viewport, body bottom padding >= 16px floor, dvh max-height cap <= viewport
- **Fixture harness:** Added a lazy-loaded test-only route `/__sheet-gesture-fixture` (`SheetGestureFixture.screen.tsx`) mounting the Sheet in basic, scrolling, maskClosable=false, and nested A->B variants, mirroring the existing `/__crash-test` test-only-route pattern. Not linked from any user-facing nav (threat T-07-02: no real data, no PII).

## Task Commits

1. **Task 1: mobile-safari WebKit iPhone project** - `15a0b77` (test)
2. **Deviation fix: Sheet pointer-handler bugs** - `46045c5` (fix)
3. **Fixture harness: test-only Sheet gesture route** - `263e6c4` (test)
4. **Task 2: six-flow WebKit touch e2e** - `d9c7518` (test)

## Files Created/Modified

- `tests/e2e/native-sheet.spec.ts` - Six touch-gesture e2e flows on the mobile-safari project.
- `src/Routing/SheetGestureFixture.screen.tsx` - Test-only fixture mounting Sheet variants.
- `playwright.config.ts` - Added the mobile-safari WebKit iPhone project; chromium preserved.
- `src/Routing/RootRouter.tsx` - Lazy fixture route registration.
- `src/Routing/RootRoutes.ts` - StaticRoutes.SheetGestureFixture constant.
- `src/Components/FastOverlay/FastOverlay.tsx` - Deferred pointer capture + nested-drag isolation.

## Decisions Made

- **WebKit install gate pre-satisfied:** The orchestrator had already run `npx playwright install webkit` (webkit-2287 present in the cache), so the Task 1 human-action checkpoint was skipped and config editing proceeded directly.
- **Test-only fixture route over reusing dish-suggester:** The dish-suggester Sheet requires a long multi-step flow to reach and never mounts a `maskClosable={false}` or nested A->B Sheet. A minimal fixture route (following `/__crash-test`) gives deterministic, isolated triggers for every flow the plan requires.
- **page.mouse over page.touchscreen.tap:** `tap` fires one down/up with no intermediate moves, so the drag reducer never sees the monotonic move samples that confirm a drag. `mouse.move → down → move* → up` produces real pointer events with a controllable drag distance, exactly what the 07-02 reducer consumes. (WebKit with `hasTouch` still routes these through the touch/pointer pipeline with `pointerType` set appropriately.)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Sheet swallowed taps on interactive children**
- **Found during:** Task 2 (SHEET-06 flow — clicking the "open nested B" button inside Sheet A's body did nothing under real pointer events, though a synthetic dispatchEvent('click') worked).
- **Issue:** `beginDrag` called `setPointerCapture` on pointerdown for the grabber/header/body handles. Pointer capture retargets the subsequent pointerup and its compatibility click to the handle element, so taps on any interactive child rendered inside the sheet (a nested-sheet trigger, the close button) never reached their target.
- **Fix:** Deferred `setPointerCapture` from pointerdown to the moment a drag is actually confirmed inside `onDragMove` (after `shouldStartDrag` passes). A plain tap no longer captures, so its click dispatches to the real target; a confirmed drag still captures so the finger keeps driving the sheet off-element.
- **Files modified:** src/Components/FastOverlay/FastOverlay.tsx
- **Commit:** `46045c5`

**2. [Rule 1 - Bug] Nested sheet drag dismissed both sheets**
- **Found during:** Task 2 (SHEET-06 flow — dragging Sheet B's grabber dismissed both B and A).
- **Issue:** Nested Sheet B renders as a React child of Sheet A's body, so B's synthetic pointerdown bubbled through the React tree to A's body drag handler, starting A's gesture too. The existing `onMouseDown` stopPropagation on the section did not cover pointer events.
- **Fix:** Added `event.stopPropagation()` at the top of `beginDrag` so a sheet's pointerdown never reaches an ancestor sheet's handlers.
- **Files modified:** src/Components/FastOverlay/FastOverlay.tsx
- **Commit:** `46045c5`

### Adjustments

**3. [Rule 3 - Blocking] Dev server basename mismatch**
- **Found during:** Task 2 first e2e run (all six tests failed in beforeEach; the route rendered blank).
- **Issue:** The project `.env` sets `PUBLIC_URL=/my-household`, so the router basename is `/my-household`, but Playwright's committed baseURL is `http://localhost:3010/my-recipes/`. The router refused to match and rendered nothing. This is a pre-existing local-env inconsistency, not a plan defect; the tracked `.env` was left unchanged.
- **Fix:** Started the verification dev server with `PUBLIC_URL=/my-recipes` to match Playwright's committed baseURL. Playwright's `reuseExistingServer: true` reuses it. No tracked files were modified.
- **Files modified:** none (runtime-only)

**4. [Rule 1 - Bug] SHEET-05 measured mid-animation**
- **Found during:** Task 2 (SHEET-05 flow — sheet bottom reported 666.8 vs viewport 664, then a transform string poll that never matched).
- **Issue:** The sheet enters via a 180ms slide-in; layout measured before it settles reports a bottom edge below the viewport. The resting transform computes to the identity matrix `matrix(1, 0, 0, 1, 0, 0)`, not the string `none`, so an initial `toBe('none')` poll never resolved.
- **Fix:** Poll the matrix translateY component (6th value) and wait for it to settle near 0 before asserting geometry.
- **Files modified:** tests/e2e/native-sheet.spec.ts
- **Commit:** `d9c7518` (incorporated before the spec was committed)

## Verification

- `npm run test:e2e -- --project=mobile-safari native-sheet`: **6 passed**.
- `npx playwright test --list`: shows both `[chromium]` and `[mobile-safari]` projects.
- `CI=true react-scripts test src/Components/Sheet/Sheet.test.tsx --watchAll=false`: **6 passed** (07-02 jsdom Sheet suite regression-clean after the FastOverlay fixes).

## Issues Encountered

The two real Sheet bugs (tap-swallowing and nested-drag bleed) were latent in 07-02 and only surfaced under real WebKit touch events — exactly the integration gap this plan exists to close. Both are now fixed and covered by the SHEET-06 flow.

## User Setup Required

When running the e2e locally, start the dev server with `PUBLIC_URL=/my-recipes` (matching Playwright's baseURL) rather than the `.env` default of `/my-household`, or the router will not match the `/my-recipes/` routes.

## Next Phase Readiness

Phase 7 (native sheet foundation) is complete: the Sheet gesture implementation (07-02) is now proven under real touch events on a WebKit iPhone surface, and two integration bugs were fixed. The mobile-safari project is reusable for future touch-gesture e2e.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: test-only-route | src/Routing/SheetGestureFixture.screen.tsx | New lazy route `/__sheet-gesture-fixture` (matches plan's accepted T-07-02 disposition: test-only, no real data, no PII, not linked from nav). Mirrors the existing `/__crash-test` pattern. |

## Self-Check: PASSED

- FOUND: tests/e2e/native-sheet.spec.ts
- FOUND: src/Routing/SheetGestureFixture.screen.tsx
- FOUND: playwright.config.ts
- FOUND: .planning/phases/07-native-sheet-foundation/07-03-SUMMARY.md
- FOUND commit 15a0b77 (Task 1: mobile-safari project)
- FOUND commit 46045c5 (FastOverlay bug fixes)
- FOUND commit 263e6c4 (fixture harness route)
- FOUND commit d9c7518 (Task 2: native-sheet spec)
