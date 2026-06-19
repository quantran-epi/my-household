# Phase 7: Native Sheet Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-19
**Phase:** 7-Native Sheet Foundation
**Areas discussed:** Snap detents scope, Opt-in vs default-on, Scroll-vs-drag rule, Gesture test net

---

## Snap detents scope

| Option | Description | Selected |
|--------|-------------|----------|
| Dismiss-only | Sheet sizes to content (~85→dvh cap); drag-down-to-dismiss only, no intermediate snap. Simplest, defuses #2 jank hazard. | ✓ |
| Medium + full snap | Two real detents with snap-velocity math + position state machine. More native, higher iOS edge-case risk. | |
| Build for it, ship one | Ship dismiss-only but design a forward-looking detents array. | |

**User's choice:** Dismiss-only.
**Notes:** Follow-up on dismiss trigger — chose "distance OR velocity" (dismiss past ~40% height or a fast downward flick, else spring back) over a fixed distance-only threshold. Did not pre-build a detents array (avoid speculative generality).

## Opt-in vs default-on

| Option | Description | Selected |
|--------|-------------|----------|
| Default-on everywhere | Every existing Sheet gets grabber + drag + safe-area automatically, no call-site edits. Native baseline app-wide at once. | ✓ |
| Opt-in via prop | New behavior behind a prop; sheets keep old look until opted in. | |
| Default-on + opt-out | Native by default with a per-site disable prop. | |

**User's choice:** Default-on everywhere.
**Notes:** Follow-up on drag-dismiss protection — chose to reuse the existing `maskClosable` prop (sheets with `maskClosable={false}` are auto-protected from drag-close) over adding a new prop or making everything drag-dismissable. No new API.

## Scroll-vs-drag rule

| Option | Description | Selected |
|--------|-------------|----------|
| Handle always + body-at-top | Grabber/header always draggable; body dismiss-drag only when scrollTop===0, else native scroll; overscroll-behavior:contain. iOS-standard, research-prescribed. | ✓ |
| Handle-only drag | Only grabber/header dismisses; body always scrolls. Simplest, less native. | |
| Other | User-described rule. | |

**User's choice:** Handle always + body-at-top.
**Notes:** Follow-up on the `viewport-fit=cover` dependency for SHEET-05 safe-area — chose to add the meta tag in Phase 7 (so SHEET-05 is testable now) rather than defer it to Phase 9. Phase 9 still extends safe-area to the app shell.

## Gesture test net

| Option | Description | Selected |
|--------|-------------|----------|
| Pure-logic units + Playwright e2e | Extract drag-decision logic into a pure function/reducer, unit-test exhaustively, plus Playwright touch e2e for real gestures + nested sheets. | ✓ |
| Unit tests only | Test extracted logic only; skip browser e2e. | |
| Playwright e2e only | Real-behavior e2e only; no extracted logic layer. | |

**User's choice:** Pure-logic units + Playwright e2e.
**Notes:** Verified during discussion that Playwright is already configured (`tests/e2e`, `@playwright/test ^1.60.0`) and Jest runs via react-scripts. Flagged that `playwright.config.ts` has only a desktop chromium project — a touch-capable (ideally WebKit/iPhone) project must be added for the gesture e2e; recorded in CONTEXT code_context, left for the planner.

---

## Claude's Discretion

- Grabber visual styling, drag-follow easing, the precise velocity threshold value, and the drag reducer's internal shape — to match existing FastOverlay aesthetic and motion ease.

## Deferred Ideas

- Multi-detent snapping (medium/full position machine) — considered for SHEET-04, deferred in favor of dismiss-only.
- Haptics & spring/inertia physics — out of scope for v1.1 (deferred milestone, MOTION-01/02).
- App-shell / nav safe-area insets — IOS-02, Phase 9.
