---
phase: 07-native-sheet-foundation
reviewed: 2026-06-29T05:05:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - playwright.config.ts
  - public/index.html
  - src/Components/FastOverlay/FastOverlay.tsx
  - src/Components/FastOverlay/dragDecision.test.ts
  - src/Components/FastOverlay/dragDecision.ts
  - src/Components/Sheet/Sheet.test.tsx
  - src/Routing/RootRouter.tsx
  - src/Routing/RootRoutes.ts
  - src/Routing/SheetGestureFixture.screen.tsx
  - tests/e2e/native-sheet.spec.ts
findings:
  critical: 1
  warning: 4
  info: 2
  total: 7
status: issues_found
---

# Phase 07: Code Review Report

**Reviewed:** 2026-06-29T05:05:00Z
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

The phase adds a native-feel bottom Sheet: a DOM-free drag-decision reducer
(`dragDecision.ts`) with exhaustive unit coverage, a pointer-drag shell on the
`Sheet` component, a test-only fixture route, and a WebKit/iPhone e2e suite.

The reducer itself is clean and well-tested. The defects live in the React
shell (`FastOverlay.tsx`), where local drag state is not reset across the
open/close lifecycle. The most serious is a state-persistence bug that leaves a
drag-dismissed sheet rendered off-screen (and fully transparent) the next time
it is opened — invisible to the user and not caught by the e2e suite because
each test opens a fresh page and never reopens after a dismiss. Several
secondary correctness/robustness concerns surround the dismiss animation, the
single-sample velocity calculation, and an impure render side effect in the
z-index stacking logic.

## Critical Issues

### CR-01: `offset` state never reset on open — reopened sheet renders off-screen and invisible after a drag-dismiss

**File:** `src/Components/FastOverlay/FastOverlay.tsx:509-514` (root cause), with no reset effect for `[open]`
**Issue:**
The `Sheet` keeps its `offset`/`dragging` state in component-local React state
(lines 373-374). When closed, the component returns `null` (line 521) but is
**not unmounted** — the common usage pattern (and the project's own
`SheetGestureFixture`) keeps `<Sheet open={...}>` permanently mounted and only
toggles the `open` prop. State therefore survives a close.

On a drag-dismiss, `endDrag` sets `offset` to the full sheet height and then
calls `onClose()`:

```ts
if (outcome === "dismiss") {
    setOffset(sheetHeight || finalOffset);   // offset := ~720
    onClose();                                // open -> false, returns null
}
```

There is no effect that resets `offset` back to `0` when `open` changes. So the
next time the sheet is opened, it renders with the stale dismissed offset:

- `transform: translate3d(0, 720px, 0)` → the panel is pushed entirely below the
  viewport (line 580).
- `animation: dragging || offset > 0 ? "none" : sheetInAnimation` → the slide-in
  animation is suppressed because `offset > 0` (line 579), so nothing animates it
  back up.
- `dragProgress ≈ 1` → `backdropAlpha = 0.3 * (1 - 1) = 0` (lines 528-529), so
  the backdrop is also fully transparent.

Net effect: after a user drag-dismisses a sheet, reopening it shows nothing —
an invisible, off-screen panel. The e2e suite misses this because every test
`goto`s a fresh page in `beforeEach` and never reopens a dismissed sheet.

**Fix:** Reset transient drag state whenever the sheet opens (and avoid leaving
a non-zero offset behind):

```ts
React.useEffect(() => {
    if (open) {
        setOffset(0);
        setDragging(false);
    }
}, [open]);
```

Alternatively, do not push `offset` to `sheetHeight` on dismiss at all (see
WR-01) and reset to `0` on close. Add an e2e step that dismisses then reopens a
sheet to lock this behavior in.

## Warnings

### WR-01: Dismiss "animate out then close" never actually animates

**File:** `src/Components/FastOverlay/FastOverlay.tsx:509-514`
**Issue:** The comment claims the section animates out before closing, but
`onClose()` is called synchronously immediately after `setOffset(...)`. Both
updates batch; on the next render `open` is `false` and the component returns
`null` (line 521), unmounting the panel before any transition can run. The
`setOffset(sheetHeight || finalOffset)` line is therefore dead with respect to
its stated purpose (and contributes to CR-01).
**Fix:** Either drop the exit-animation pretense (just call `onClose()` and reset
offset on close), or defer `onClose()` until after the transform transition
completes (e.g. via `onTransitionEnd` or a timeout matching the 220ms transition,
respecting the reduced-motion clamp), keeping the component mounted during the
slide-out.

### WR-02: Release velocity sampled from a single last-move→pointerup segment makes flick-dismiss (D3) unreliable

**File:** `src/Components/FastOverlay/FastOverlay.tsx:486-499`
**Issue:** `onDragMove` overwrites `g.lastY`/`g.lastTime` on every move, so
`endDrag` computes velocity over only the final `lastMove → pointerup` interval:

```ts
const velocity = elapsed > 0 ? (event.clientY - g.lastY) / elapsed : 0;
```

When the finger lifts at (or very near) the last move position — the common case,
and exactly what the e2e harness produces (`mouse.up` lands on the last move, see
`native-sheet.spec.ts:46`) — this delta is ~0, so `velocity ≈ 0` and the
documented `VELOCITY_FLICK` flick-to-dismiss path (`dragDecision` D3) effectively
never fires. A genuine short, fast flick that should dismiss will instead spring
back. The velocity branch is essentially untested end-to-end and unreachable in
practice.
**Fix:** Track velocity over a small recent window rather than the last segment —
e.g. keep the previous sample (`prevY`/`prevTime`) and compute
`(lastY - prevY) / (lastTime - prevTime)` at release, or maintain a short
rolling buffer of recent samples and use the average. Add an e2e/unit case that
drives a real flick (distinct up position with a short time delta) to cover D3.

### WR-03: Impure render — overlay stack token allocated during render, mutating module-global state

**File:** `src/Components/FastOverlay/FastOverlay.tsx:90-94` (within `useResolvedOverlayZIndex`)
**Issue:** Token allocation runs in the render body, mutating the module-level
`nextOverlayStackToken` and `activeOverlayStackTokens`:

```ts
if (open && explicitZIndex === undefined && stackToken.current === undefined) {
    stackToken.current = allocateOverlayStackToken();   // side effect during render
}
```

Tokens are only released in an effect cleanup (lines 96-104). Under React
StrictMode or concurrent rendering, a render can be invoked without committing;
such a render still allocates a token and sets the ref, but the corresponding
effect never commits, so the token is never released — a stack-token leak that
inflates the z-index of subsequent overlays. Render functions must be pure.
**Fix:** Allocate in a committed-only path — e.g. a `useState` lazy initializer
or inside the existing `useEffect` — and read the resolved stack index from
state/ref, so allocation only happens for renders that actually commit.

### WR-04: `dragDecision` dismisses on a zero/near-zero offset when `sheetHeight` is 0

**File:** `src/Components/FastOverlay/dragDecision.ts:97`
**Issue:** D2 uses an inclusive comparison against `DISMISS_OFFSET_RATIO *
sheetHeight`. If `sheetHeight` is `0`, the threshold is `0` and `offset >= 0` is
always true (offset is clamped non-negative upstream), so the gesture dismisses
even for a tap with no travel. In the shell, `endDrag` falls back to
`sheetHeight = 0` when `sectionRef.current` is null
(`FastOverlay.tsx:500-502`). While the ref is normally populated during an active
drag, this couples correctness to a measurement that can legitimately be `0`,
turning an accidental zero-height read into a dismiss.
**Fix:** Guard the distance branch so a non-positive height can't satisfy it:

```ts
if (sheetHeight > 0 && offset >= DISMISS_OFFSET_RATIO * sheetHeight) return "dismiss";
```

and/or short-circuit `endDrag` to spring-back when the measured height is `0`.

## Info

### IN-01: e2e comments overstate `pointerType` of injected events

**File:** `tests/e2e/native-sheet.spec.ts:6-11,30-33`
**Issue:** The comments state the gestures deliver "genuine `pointerType=\"touch\"`"
events via `page.mouse`. Playwright's `page.mouse` API dispatches mouse-derived
pointer events with `pointerType="mouse"`, not `touch`, even in a `hasTouch`
context. The tests still validly exercise the `onPointerDown/Move/Up` handlers,
but the rationale comment is inaccurate and could mislead future maintainers into
believing touch-specific behavior is covered.
**Fix:** Reword to "real pointer events through the browser input pipeline," or
switch to `page.touchscreen`/CDP touch injection if genuine touch pointer type is
required for the integration proof.

### IN-02: Handler closures recreated every render for drag handles

**File:** `src/Components/FastOverlay/FastOverlay.tsx:530-537,609`
**Issue:** `dragHandleProps(origin)` and `beginDrag("body")` allocate fresh
handler functions on every render. Not a correctness issue (gesture state lives
in a ref, so stale closures aren't a hazard here), but it is avoidable churn.
**Fix:** Memoize the per-origin handler sets with `useCallback`/`useMemo` keyed by
the stable inputs, or hoist them since they only depend on refs.

---

_Reviewed: 2026-06-29T05:05:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
