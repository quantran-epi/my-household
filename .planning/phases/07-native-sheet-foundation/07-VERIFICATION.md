---
phase: 07-native-sheet-foundation
verified: 2026-06-29T05:25:00Z
status: gaps_found
score: 3/4 roadmap success criteria verified (SHEET 5/6 requirements satisfied)
overrides_applied: 0
gaps:
  - truth: "Sheets snap to medium/full detents (SHEET-04)"
    status: failed
    reason: "No detent/snap behavior exists anywhere in the code. The Sheet renders at a single fixed max-height (min(85dvh,720px) or the explicit `height` prop); dragDecision only returns 'dismiss' | 'spring-back' with no 'snap-to-medium'/'snap-to-full' outcome. The three plans reinterpreted SHEET-04 from its REQUIREMENTS.md/ROADMAP definition ('snap to detent points, e.g. medium then full height') into 'maskClosable drag protection' — a capability that is not described by any SHEET requirement. REQUIREMENTS.md itself still marks SHEET-04 as Pending, confirming the detent feature was never built."
    artifacts:
      - path: "src/Components/FastOverlay/dragDecision.ts"
        issue: "DragOutcome union is only 'dismiss' | 'spring-back'; no detent/snap-point outcome exists"
      - path: "src/Components/FastOverlay/FastOverlay.tsx"
        issue: "Sheet section uses a single maxHeight; no medium/full detent state, no snap-on-release logic"
    missing:
      - "Detent model (e.g. medium + full snap points) with snap-to-nearest-detent on drag release"
      - "Sheet height driven by the active detent rather than a single fixed max-height"
      - "Tests/e2e proving snap-to-medium then snap-to-full behavior"
---

# Phase 7: Native Sheet Foundation Verification Report

**Phase Goal:** Upgrade the existing `@components/Sheet` (FastOverlay) into a native-feeling iOS sheet — grabber, drag-to-dismiss, scroll/drag disambiguation, snap detents, safe-area — with no call-site changes yet.
**Verified:** 2026-06-29T05:25:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP success criteria — the contract)

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Every bottom sheet shows a grabber handle and can be dragged down to dismiss, backdrop dimming with the drag | ✓ VERIFIED | Grabber `<button aria-label="Kéo để đóng" data-drag-handle>` renders above header (FastOverlay.tsx:598-605). Pointer drag via `beginDrag`/`onDragMove`/`endDrag` applies `translate3d(0, ${offset}px, 0)` (l.590); `dragDecision` dismisses past 40% / on flick. Backdrop alpha couples to drag: `backdropAlpha = 0.3 * (1 - dragProgress)` (l.538-539). e2e flows "drag past 40% dismisses" + "drag under 40% springs back" reported green. |
| 2 | Dragging a scrolled list scrolls it; sheet only drags-to-dismiss when content is at top (no scroll/drag conflict) | ✓ VERIFIED | `shouldStartDrag` B1-B6 gate (dragDecision.ts:46-59); body handle bails when `scrollTop > 0` (FastOverlay.tsx:451-452) and on upward move at top (l.476-482). `overscroll-behavior: contain` on body (l.139). e2e "scroll-then-drag keeps sheet open then dismisses at top (SHEET-03)" reported green. 16-assertion dragDecision unit suite covers all branches. |
| 3 | Sheets snap to medium/full detents AND respect safe-area + dvh so nothing clips under the iOS toolbar or home indicator | ✗ FAILED (partial) | safe-area + dvh: VERIFIED — `max-height: min(85vh,720px)` then `min(85dvh,720px)` cascade (l.131-134), `padding-bottom: calc(16px + env(safe-area-inset-bottom))` (l.140), `viewport-fit=cover` in public/index.html:7. **Detents: FAILED** — no snap/detent logic exists; single fixed height only. See Gaps. |
| 4 | A sheet opened from inside another sheet stacks above it and dismisses independently | ✓ VERIFIED | `useResolvedOverlayZIndex` allocates a stack token per open overlay, +20 per depth (l.89-111). `beginDrag` calls `event.stopPropagation()` so nested B's pointerdown does not start ancestor A's drag (l.447). `useBodyScrollLock(open)` per instance. e2e "nested sheet stacks and dismisses independently (SHEET-06)" reported green. |

**Score:** 3/4 truths verified (truth 3 fails on the detent portion only)

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `src/Components/FastOverlay/dragDecision.ts` | Pure drag-decision logic (shouldStartDrag, dragDecision, VELOCITY_FLICK) | ✓ VERIFIED | All three exports present, DOM-free, no React/DOM imports. |
| `src/Components/FastOverlay/dragDecision.test.ts` | Exhaustive branch/boundary coverage | ✓ VERIFIED | Referenced by 07-01 SUMMARY (16 assertions); module under test exists. |
| `src/Components/FastOverlay/FastOverlay.tsx` | Native Sheet: grabber, pointer drag, backdrop coupling, focus trap, dvh/safe-area | ✓ VERIFIED | `from './dragDecision'`, `data-drag-handle`, `setPointerCapture` (deferred), `translate3d`, focus trap, CR-01 reset effect all present. |
| `public/index.html` | viewport-fit=cover | ✓ VERIFIED | Line 7 content includes `viewport-fit=cover`. |
| `src/Components/Sheet/Sheet.test.tsx` | Grabber + maskClosable + CR-01 regression tests | ✓ VERIFIED | 7 tests pass incl. "resets the drag offset when reopened after a drag (mount-and-toggle host)". |
| `playwright.config.ts` | mobile-safari WebKit project, chromium preserved | ✓ VERIFIED | `devices['iPhone 13']` spread into `mobile-safari` project; chromium project first and unchanged. |
| `tests/e2e/native-sheet.spec.ts` | Six touch-gesture flows | ✓ VERIFIED | 223 lines, 6 tests each named for its requirement. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| FastOverlay.tsx | dragDecision.ts | `import { shouldStartDrag, dragDecision }` | ✓ WIRED | Import present (l.4); both functions invoked in `onDragMove`/`endDrag`. |
| Sheet pointer handlers | section transform | local state drives `translate3d` | ✓ WIRED | `offset` state → `transform: translate3d(0, ${offset}px, 0)` (l.590). |
| Sheet body | safe-area inset | injected CSS class | ✓ WIRED | `.my-recipes-fast-overlay__body` carries `env(safe-area-inset-bottom)` padding; class applied at l.617. |
| native-sheet.spec.ts | FastOverlay Sheet | grabber/data-drag-handle/role=dialog selectors | ✓ WIRED | Spec drives grabber + asserts post-gesture state via testids and computed styles. |

### CR-01 Fix Verification (code-review critical, fixed post-review)

| Item | Status | Evidence |
| --- | --- | --- |
| Reset offset/dragging on close | ✓ PRESENT | Commit 96029be; FastOverlay.tsx:391-396 `useEffect(() => { if (!open) { setOffset(0); setDragging(false); } }, [open])`. |
| Regression test | ✓ PRESENT & PASSING | Sheet.test.tsx:73-95 "resets the drag offset when reopened after a drag (mount-and-toggle host)" — asserts transform returns to `translate3d(0, 0px, 0)` after close/reopen. Ran green. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Sheet jsdom suite incl. CR-01 regression | `CI=true npx react-scripts test --watchAll=false src/Components/Sheet/Sheet.test.tsx` | 7 passed | ✓ PASS |
| WebKit binary present | `ls ~/Library/Caches/ms-playwright` | `webkit-2287` | ✓ PASS |
| No detent/snap logic | `grep -rniE "detent|snap|snapTo|mediumHeight|fullHeight" src/Components/` | no matches | ✗ FAIL (absence confirms gap) |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| SHEET-01 | 07-01, 07-02 | Grabber handle on every bottom sheet | ✓ SATISFIED | Grabber button + always-on handle. |
| SHEET-02 | 07-02 | Drag down to dismiss, backdrop dimming | ✓ SATISFIED | translate3d follow + backdropAlpha coupling + dismiss. |
| SHEET-03 | 07-01, 07-03 | Scroll vs drag arbitration at top | ✓ SATISFIED | shouldStartDrag gate + overscroll-contain + e2e. |
| SHEET-04 | 07-01, 07-02 | **Snap to detent points (medium then full height)** | ✗ BLOCKED | No detent logic anywhere. Plans reinterpreted SHEET-04 as "maskClosable protection" (not in requirement text). REQUIREMENTS.md marks SHEET-04 Pending. |
| SHEET-05 | 07-02, 07-03 | Safe-area + dvh | ✓ SATISFIED | dvh cascade, safe-area padding, viewport-fit=cover. |
| SHEET-06 | 07-02, 07-03 | Nested stacking + independent dismiss | ✓ SATISFIED | Per-instance z-index token + stopPropagation isolation. |

All six requirement IDs from PLAN frontmatter are accounted for. No orphaned IDs (REQUIREMENTS.md maps SHEET-01..06 to Phase 7, all claimed by plans).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| FastOverlay.tsx | 519-524 | Dismiss "animate out then close" never animates (WR-01) — `onClose()` called synchronously after `setOffset`, component unmounts before transition | ⚠️ Warning | Cosmetic; dismiss still works (jumps instead of slides). Does not break a must-have. |
| FastOverlay.tsx | 508-509 | Single-sample release velocity makes flick-dismiss (D3) effectively unreachable (WR-02) | ⚠️ Warning | Distance-based dismiss (D2) still fires, so SHEET-02 truth holds via the 40% path. Flick path weak. |
| FastOverlay.tsx | 92-94 | Stack token allocated during render (impure) — possible token leak under StrictMode/concurrent (WR-03) | ⚠️ Warning | Nested stacking works in practice (e2e green); theoretical leak. |
| dragDecision.ts | 97 | D2 dismisses on offset 0 when sheetHeight is 0 (WR-04) | ⚠️ Warning | Edge case; ref normally populated during active drag. |
| native-sheet.spec.ts | 6-11 | Comments overstate pointerType="touch" (page.mouse emits pointerType="mouse") (IN-01) | ℹ️ Info | Doc accuracy only; handlers still exercised. |
| FastOverlay.tsx | 540-547 | Handler closures recreated each render (IN-02) | ℹ️ Info | Churn only; state in ref so no correctness issue. |

The 4 warnings + 2 info are the code-review advisory items. None break a SHEET-01/02/03/05/06 must-have; they remain polish for a follow-up.

### Gaps Summary

The phase delivers a genuinely native-feeling Sheet for 5 of its 6 requirements: grabber, finger-follow drag-to-dismiss with backdrop dimming, scroll-vs-drag arbitration, safe-area + dvh layout, and independent nested stacking are all implemented, wired, and covered by passing jsdom unit tests plus a six-flow WebKit touch e2e. The CR-01 critical fix is present and locked in by a regression test.

The one blocking gap is **SHEET-04 detents**. Both the ROADMAP goal text and success criterion 3 explicitly require "snap to medium/full detents," and REQUIREMENTS.md defines SHEET-04 as "Sheets snap to detent points (e.g. medium then full height) rather than a single fixed height." No such behavior exists: the Sheet has one fixed max-height and `dragDecision` only chooses dismiss vs spring-back. The three plans silently reinterpreted SHEET-04 as "maskClosable drag protection," which is not what the requirement says and is not a scope the planner was free to substitute (per the verification rule that PLAN frontmatter must not reduce roadmap scope). REQUIREMENTS.md itself still lists SHEET-04 as Pending, corroborating that detents were never built.

**This may be intentional.** If the team decides detents are deferred or out of scope for this foundation phase (drag-to-dismiss may be considered the v1 interaction), record the decision by adding an override to this file's frontmatter:

```yaml
overrides:
  - must_have: "Sheets snap to medium/full detents (SHEET-04)"
    reason: "Detents deferred; drag-to-dismiss is the v1 interaction for the foundation phase"
    accepted_by: "{name}"
    accepted_at: "{ISO timestamp}"
```

Otherwise SHEET-04 needs a detent model (medium + full snap points, snap-to-nearest on release, height driven by active detent) plus coverage before the phase goal is fully met. No later milestone phase (8-11: pickers, visual baseline, screen conversion, wrapper removal) covers detents, so this is not deferrable to a future phase by the roadmap.

---

_Verified: 2026-06-29T05:25:00Z_
_Verifier: Claude (gsd-verifier)_
