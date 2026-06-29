# Phase 7: Native Sheet Foundation - Research

**Researched:** 2026-06-29
**Domain:** iOS-feel bottom-sheet UX — pointer-event drag-to-dismiss, scroll/drag disambiguation, dvh + safe-area CSS, nested stacking (React 18 + inline-style portal component)
**Confidence:** HIGH (codebase-verified shape, hooks, test infra); MEDIUM (iOS-Safari touch/viewport timing — training knowledge, web search unavailable this session)

## Summary

This phase upgrades the existing `Sheet` export in `src/Components/FastOverlay/FastOverlay.tsx` (lines 312-383) into a native-feeling iOS bottom sheet. The component is a `createPortal`-to-`document.body` shell built entirely from inline styles plus one injected `<style>` keyframe block. It already composes three reusable hooks — `useBodyScrollLock`, `useEscapeClose`, `useResolvedOverlayZIndex` — and honors `prefers-reduced-motion` via the shared `overlayMotionStyles` block. None of those need replacing; the new drag, grabber, and safe-area work layers on top of the existing render tree without touching the call-site API (`SheetProps` is unchanged).

The locked decisions remove the hardest hazard (no multi-detent state machine — dismiss-only, D-01) and forbid new dependencies (D-06: React pointer events + `setPointerCapture`, no gesture lib). The remaining work is three tractable pieces: (1) a pure drag-decision reducer (dismiss vs spring-back, with a `scrollTop===0` gate and a velocity-flick branch) that is exhaustively unit-testable under the existing Jest/jsdom net; (2) wiring that pure logic to pointer handlers that translate finger delta into a `transform: translate3d(0, Δy, 0)` on the section and a coupled backdrop opacity; (3) iOS CSS — `dvh` with `vh` fallback, `env(safe-area-inset-bottom)`, `overscroll-behavior: contain`, plus the `viewport-fit=cover` meta tag (D-07) that makes `env()` resolve non-zero.

The chief environment gap: Playwright is v1.60.0 but only **chromium** is installed (`~/Library/Caches/ms-playwright` has `chromium-1223`, `chromium_headless_shell-1223`, `ffmpeg-1011` — NO webkit). The touch e2e (D-08) wants a WebKit/iPhone touch project, so the plan must include `npx playwright install webkit` as an explicit task or the e2e project will fail to launch.

**Primary recommendation:** Extract a pure `dragDecision(state) → 'dismiss' | 'spring-back'` reducer + a `shouldStartDrag(target, scrollTop, direction)` gate, unit-test every branch under Jest, then wire pointer handlers into the existing `Sheet` render tree using local `useState`/`useRef` (no Redux). Add a `webkit`/iPhone touch project to `playwright.config.ts` and install webkit before authoring the gesture e2e.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Drag gesture detection & follow | Browser / Client (Sheet component) | — | Pointer events are client-only; state is local per instance (D-06) |
| Drag-decision logic (threshold/velocity/gate) | Browser / Client (pure module) | — | Pure function, no DOM — unit-testable in jsdom |
| Backdrop opacity coupling | Browser / Client (Sheet) | — | Inline style driven by drag delta |
| dvh / safe-area layout | CDN / Static (CSS + index.html meta) | Browser | `viewport-fit=cover` is a static `<meta>`; `env()`/`dvh` resolved by the UA at render |
| Nested-sheet stacking | Browser / Client (`useResolvedOverlayZIndex`) | — | Existing module-level token allocator already handles this |
| Body scroll lock | Browser / Client (`useBodyScrollLock`) | — | Mutates `document.body.style.overflow` |
| Focus trap / ARIA | Browser / Client (Sheet) | — | DOM focus management, client-only |

## Current `Sheet` Shape & Hooks (what must be preserved)

**Signature** (`FastOverlay.tsx:312-323`): `Sheet({ open, title, onClose, children, height, zIndex, maskClosable = true, closable = true, keyboard = true, "data-testid" })`. `SheetProps = FastOverlayBaseProps & { height?: number | string }` (`:19-21`). [VERIFIED: codebase grep] **No new prop is added this phase** — drag-to-dismiss layers onto this exact signature (D-03/D-04).

**Hook composition** (`:324-326`) — all three must be kept:
- `useBodyScrollLock(open)` (`:66-75`) — saves/restores `document.body.style.overflow`, sets `hidden` while open. Cleanup restores the prior value. PITFALLS §A flags this as weak on iOS; verify it holds with stacked sheets + the new `overscroll-behavior` (see §iOS CSS). [VERIFIED: codebase]
- `useEscapeClose(open && keyboard, onClose)` (`:77-86`) — `window` keydown → `Escape` → `onClose`. Preserve; drag must not interfere with keyboard close. [VERIFIED: codebase]
- `useResolvedOverlayZIndex(open, zIndex, 1200)` (`:88-110`) — module-level token allocator (`allocateOverlayStackToken`/`releaseOverlayStackToken`, `:52-64`). When `zIndex` is undefined it assigns a stack token and resolves to `1200 + stackIndex*20`, so a sheet opened from a sheet renders above its parent (SHEET-06). **Do NOT pass an explicit `zIndex`** — let the token system stack (D, canonical_refs). [VERIFIED: codebase]

**Render tree** (`:328-382`): early `return null` when `!open` (`:328`). `createPortal(..., document.body)`. Backdrop `<div className="my-recipes-fast-overlay">` with `position:fixed; inset:0; alignItems:flex-end; justifyContent:center; background:rgba(16,24,40,0.30); animation: backdropInAnimation` (`:331-343`); its `onMouseDown` closes only when `event.target === event.currentTarget && maskClosable` (`:344-346`). The `<section role="dialog" aria-modal="true">` (`:349-368`) carries `width:100%; maxWidth:720; maxHeight: toCssSize(height, "min(85vh, 720px)")`, `flexDirection:column; overflow:hidden; borderRadius:"18px 18px 0 0"; background: linear-gradient(180deg,#f5f0ff 0%,#ffffff 42%); boxShadow:0 -16px 48px rgba(74,48,130,0.24); animation: sheetInAnimation; transformOrigin:bottom center; willChange:opacity,transform`. The section's `onMouseDown` calls `event.stopPropagation()` (`:368`) so clicks inside don't reach the backdrop close. Header row (`:370-375`) + scrollable body `<div style={{ flex:1, minHeight:0, overflowY:"auto", padding:16, ... }}>` (`:376-378`). [VERIFIED: codebase]

**Height:** `toCssSize(height, "min(85vh, 720px)")` (`:356`, helper `:36-39`) — number → `${n}px`, else the string, else the fallback. SHEET-05 requires switching the `vh` fallback to `dvh` with a `vh` fallback (D, code_context `:72`). The new fallback becomes `min(85dvh, 720px)` with a preceding `min(85vh, 720px)` declaration for non-dvh UAs. [VERIFIED: codebase]

**Motion:** `overlayMotionEase = "cubic-bezier(0.16, 1, 0.3, 1)"` (`:47`); `sheetInAnimation = "my-recipes-fast-sheet-in 180ms <ease> both"` (`:51`); keyframe translates `translate3d(0,24px,0)→0` (`:116`). The reduced-motion guard `overlayMotionStyles` (`:112-121`) clamps `.my-recipes-fast-overlay *` animation/transition durations to `1ms` under `@media (prefers-reduced-motion: reduce)`. **The new drag transition (spring-back / dismiss tween) must live inside this guard** (D-06) — i.e. it must be a CSS transition on an element under `.my-recipes-fast-overlay` so the existing `1ms` clamp neutralizes it for reduced-motion users. [VERIFIED: codebase]

**Z-index:** see hook note above — reuse `useResolvedOverlayZIndex`, no explicit zIndex. [VERIFIED: codebase]

## Pointer-Event Drag Pattern

Locked by D-06: React pointer events + `setPointerCapture`, no gesture library, drag state local to each `Sheet` instance (`useState`/`useRef`, never Redux).

**Capture lifecycle** (training knowledge — standard pointer-capture pattern):
- `onPointerDown(e)`: record `startY = e.clientY`, `startTime = e.timeStamp`, set a `dragging` ref, and call `e.currentTarget.setPointerCapture(e.pointerId)`. Capture routes all subsequent `pointermove`/`pointerup` for that pointerId to the same element even if the finger leaves it — no window listeners needed, and it auto-releases on `pointerup`/`pointercancel`. [ASSUMED — training knowledge]
- `onPointerMove(e)`: only act while `dragging`. Compute `delta = e.clientY - startY`. **Clamp to downward only**: `offset = Math.max(0, delta)` (upward drag past the open position is a no-op, not an over-pull). Drive the visual via the offset (below). Track the last two (`clientY`, `timeStamp`) samples so release can compute velocity. [ASSUMED]
- `onPointerUp(e)`: stop `dragging`, compute `velocity = (e.clientY - lastSampleY) / (e.timeStamp - lastSampleTime)` (px/ms, downward positive), feed `{ offset, sheetHeight, velocity, maskClosable }` to the pure reducer, then either animate to dismissed (`onClose`) or spring back. `releasePointerCapture` happens implicitly on pointerup. Also handle `onPointerCancel` → spring back. [ASSUMED]

**Visual coupling** (inline style driven by the `offset` state):
- Sheet section: `transform: translate3d(0, ${offset}px, 0)`. While `dragging` set `transition: "none"` so the sheet tracks the finger 1:1; on release set `transition: "transform <ease>"` so spring-back/dismiss animates. Because the section sits under `.my-recipes-fast-overlay`, the reduced-motion guard (`:117-120`) auto-clamps that release transition to `1ms`. [ASSUMED]
- Backdrop opacity coupling: scale backdrop alpha with drag progress — `progress = Math.min(1, offset / sheetHeight)`; backdrop `opacity = 1 - progress` (or interpolate the `rgba(...,0.30)` alpha down toward 0). Gives the iOS "content fades as it leaves" feel. The drag-time backdrop must override the entry `animation` (set `animation:"none"` once dragging starts) so it isn't fighting the fade-in keyframe. [ASSUMED]
- During an active drag set `willChange: "transform"` on the section (already declared) — no layout thrash since only `transform`/`opacity` change (GPU-composited). [ASSUMED]

**Spring-back vs dismiss on release:** decided by the pure reducer (next section), not inline — the handler only applies the chosen outcome. Dismiss = animate `offset → sheetHeight` then call `onClose`; spring-back = animate `offset → 0` and clear drag state. [ASSUMED]

## Scroll-vs-Drag Branch Enumeration (pure reducer)

This is the #2 jank hazard (D-05, PITFALLS §A). Two separable pure decisions: **(1) should this pointerdown begin a drag at all?** (`shouldStartDrag`) and **(2) on release, dismiss or spring back?** (`dragDecision`). Both are DOM-free and exhaustively unit-testable.

### `shouldStartDrag(origin, scrollTop, direction)` → boolean
| # | Origin | scrollTop | direction | Result | Why |
|---|--------|-----------|-----------|--------|-----|
| B1 | grabber | any | any | **drag** | Grabber is always a drag handle; `touch-action:none` on it (D-05) |
| B2 | header | any | any | **drag** | Header is always a drag handle; `touch-action:none` (D-05) |
| B3 | body | `=== 0` | down | **drag** | At top + pulling down → dismiss gesture wins (D-05) |
| B4 | body | `=== 0` | up | **no drag** | Up at top = nothing to scroll, but not a dismiss; let native handle |
| B5 | body | `> 0` | down | **no drag** | Content scrolled — native scroll-up wins; do NOT hijack into dismiss (D-05) |
| B6 | body | `> 0` | up | **no drag** | Native scroll |

`origin` is derived from the pointerdown target (a `data-drag-handle` attr on grabber+header, vs the scroll body). `direction` from the first move sample's sign. The `scrollTop===0` gate is read once at gesture start from the scroll-body ref. [VERIFIED: codebase — gate maps onto the existing `overflowY:auto` body at `:376`]

### `dragDecision({ offset, sheetHeight, velocity, maskClosable })` → `'dismiss' | 'spring-back'`
| # | Condition | Result | Why |
|---|-----------|--------|-----|
| D1 | `maskClosable === false` | **spring-back** (always) | D-04: protected sheets never drag-dismiss; gesture still runs + springs back |
| D2 | `offset >= 0.40 * sheetHeight` | **dismiss** | Past ~40% threshold (D-02) |
| D3 | `velocity >= VELOCITY_FLICK` (downward) | **dismiss** | Fast flick even if short (D-02); threshold value is Claude's discretion |
| D4 | else | **spring-back** | Didn't pass distance or velocity → return to open (D-02) |

Evaluation order matters: **D1 short-circuits first** (the gate beats both threshold and flick), then threshold OR velocity, else spring-back. `offset` is clamped `>= 0` upstream so negative (upward) drags can never satisfy D2/D3. `VELOCITY_FLICK` is a tunable constant (Claude's discretion, D); express it in px/ms so the unit test can pin both sides of the boundary. [VERIFIED: decisions D-02/D-04]

**Reducer purity note (D-08):** neither function touches the DOM, refs, or `Date.now()` — all inputs are passed in (velocity is pre-computed by the handler). This keeps every branch above unit-testable under Jest/jsdom with plain object inputs.

## iOS Safari CSS

All facts here are **training knowledge** (web search unavailable this session) — tag accordingly; the planner should verify the dvh-cap behavior on a real iOS device or the WebKit Playwright project.

**1. `dvh` with `vh` fallback (SHEET-05, D-07).** The `100vh` URL-bar bug: on iOS Safari `vh` is sized to the *largest* viewport (URL bar hidden), so `100vh` overflows when the bar is showing. `dvh` (dynamic viewport height) tracks the *current* visible viewport. Replace the height cap with a cascade so non-dvh UAs still get a sane value:
```css
max-height: min(85vh, 720px);   /* fallback first */
max-height: min(85dvh, 720px);  /* dvh wins where supported */
```
Inline-style equivalent: emit both via the injected `<style>` block (a class on the section) rather than the `style` prop, since React inline styles can't carry two same-key declarations. [ASSUMED — training knowledge]

**2. `env(safe-area-inset-bottom)` (SHEET-05).** The scrollable body / sticky `SheetActions` need bottom padding so content clears the home indicator: `padding-bottom: calc(16px + env(safe-area-inset-bottom))`. `env()` resolves to non-zero **only** when the viewport opts into the safe area — hence (3). Use `max(16px, env(safe-area-inset-bottom))` if you want a floor without doubling. [ASSUMED — training knowledge]

**3. `viewport-fit=cover` meta (D-07, `public/index.html:7`).** Current tag is `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />` — **no `viewport-fit`**, so `env(safe-area-inset-*)` resolves to `0` on iOS. Phase 7 must append `, viewport-fit=cover`. This is the single static change that makes SHEET-05 testable; Phase 9 (IOS-02) extends safe-area to the app shell. [VERIFIED: codebase — `public/index.html:7`]

**4. `overscroll-behavior: contain` (D-05).** Put on the scroll body (`:376`) to kill rubber-band chaining — stops an at-top over-pull from bouncing the page/parent and from leaking into the drag gesture. Complements the `scrollTop===0` gate (B3/B5). [ASSUMED — training knowledge]

**5. Body-scroll-lock robustness with stacked sheets.** `useBodyScrollLock` (`:66-75`) sets `body.overflow:hidden` and restores the *previous* value on cleanup. With stacked sheets each instance runs the effect: the inner sheet saves `"hidden"` (set by the outer) and restores it to `"hidden"` on close — correct, the outer's lock survives until it too unmounts. PITFALLS §A warns `overflow:hidden` alone is weak on iOS (can still scroll behind); `overscroll-behavior:contain` on the sheet body + the portal-to-`document.body` structure mitigate it. **Verify** the lock holds with two stacked sheets in the nested-sheet e2e (no background scroll bleed, inner closes without unlocking the outer). [VERIFIED: codebase shape] / [ASSUMED — iOS runtime behavior]

## Playwright Touch-Project Setup

**Current state** (`playwright.config.ts:28-33`): one project — `chromium` (or `E2E_BROWSER_CHANNEL`), **no `hasTouch`/`isMobile` context**, `testDir: ./tests/e2e`, web server `npm start` on port 3010 reusing an existing server. [VERIFIED: codebase]

**Environment gap (blocking for the gesture e2e):** Playwright v1.60.0 is installed but `~/Library/Caches/ms-playwright` contains only `chromium-1223`, `chromium_headless_shell-1223`, `ffmpeg-1011` — **NO webkit**. The plan MUST include an explicit `npx playwright install webkit` task before authoring/running the touch e2e, or the project fails to launch. [VERIFIED: prior session — cache inspection]

**Why WebKit:** every hazard in this phase (`100vh` URL-bar bug, `env()` safe-area, iOS scroll-lock weakness, overscroll rubber-band) is iOS-Safari-specific. A WebKit + iPhone device descriptor reproduces them far better than Chromium-with-touch. [ASSUMED — training knowledge]

**Add a touch project** (e.g. via `devices['iPhone 13']`, which sets `hasTouch:true`, `isMobile:true`, WebKit, and a mobile viewport):
```ts
import { defineConfig, devices } from '@playwright/test';
// ...
projects: [
  { name: browserChannel ?? 'chromium', use: browserChannel ? { channel: browserChannel } : undefined },
  { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
],
```
[ASSUMED — training knowledge; verify device descriptor name against installed Playwright]

**Driving a real touch drag:** Chromium's `page.touchscreen` / `mouse` won't exercise the iOS code paths. Use either `page.touchscreen.tap` + a manual `dispatchEvent` sequence, or the locator `dragTo`, but for a finger-follow drag the reliable path is an explicit pointer/touch sequence: `touchStart` at the grabber → several `touchMove` steps increasing `clientY` → `touchEnd`. On a `hasTouch` context Playwright emits real `pointerdown/move/up` with `pointerType:"touch"`, which is what `setPointerCapture` + the reducer consume. Assert post-state (sheet gone vs still open) rather than mid-drag transforms to avoid timing flake. [ASSUMED — training knowledge]

## Accessibility (a11y)

PITFALLS §E. Mix of existing behavior to preserve and new work.

**Focus trap (NEW — gap today).** The `<section role="dialog" aria-modal="true">` (`:349-351`) declares the modal role but there is **no focus trap** in the current `Sheet` — focus can tab out to the background. For a native-feeling sheet, on open move focus into the sheet (the close button or first focusable) and trap Tab/Shift+Tab within the section while open, restoring focus to the trigger on close. `aria-modal="true"` already signals intent to AT; the trap makes it real. Scope: keep minimal (this phase is the shell) but it's the right place to add it since drag-dismiss is becoming the primary close affordance. [VERIFIED: codebase — no trap present]

**Grabber ARIA (NEW).** The grabber pill is the new always-on drag handle. It is a visual control, so give it an accessible affordance: render it as a `<button type="button">` (or `role="button"`) with `aria-label` (e.g. "Đóng bảng" / "Drag to dismiss") so keyboard/AT users get a non-gesture way to dismiss — gesture-only controls are an a11y trap. `touch-action: none` on the grabber (D-05) prevents the browser from claiming the touch for scroll/zoom. Keep the existing close `<button aria-label="Đóng">` (`:372`) as the canonical keyboard close. [ASSUMED — training knowledge; aligns with D-05 grabber-as-handle]

**Reduced motion (EXISTING — preserve + extend).** `overlayMotionStyles` (`:112-121`) clamps all animation/transition durations under `.my-recipes-fast-overlay` to `1ms` for `prefers-reduced-motion: reduce`. The new drag spring-back/dismiss transition must be a CSS transition on an element under that class so it inherits the clamp automatically (D-06). The finger-follow itself (`transition:none` while dragging) is direct manipulation, not animation, so it's exempt and fine. Verify a reduced-motion user still gets an instant (non-animated) dismiss/spring-back. [VERIFIED: codebase — guard at `:117-120`]

**Escape (EXISTING).** `useEscapeClose` (`:77-86`) already gives keyboard dismiss when `keyboard` is set; preserve. [VERIFIED: codebase]

## Validation Architecture

Per D-08, the drag logic is split into a pure, exhaustively unit-tested core plus a thin pointer-handler shell proven by a touch e2e. This section is the source the VALIDATION.md is derived from.

### Pure-logic unit tests (Jest/jsdom — no DOM, plain object inputs)

**`shouldStartDrag(origin, scrollTop, direction)` — 6 branches, all pinned:**
- B1 grabber → drag (any scrollTop/direction)
- B2 header → drag (any scrollTop/direction)
- B3 body + scrollTop===0 + down → drag
- B4 body + scrollTop===0 + up → no drag
- B5 body + scrollTop>0 + down → no drag (native scroll wins — the #2 jank hazard)
- B6 body + scrollTop>0 + up → no drag

**`dragDecision({ offset, sheetHeight, velocity, maskClosable })` — 4 branches + ordering:**
- D1 maskClosable===false → spring-back (short-circuits before D2/D3) — covers SHEET protected sheets
- D2 offset >= 0.40 * sheetHeight → dismiss
- D3 velocity >= VELOCITY_FLICK (downward) → dismiss (short drag, fast flick)
- D4 else → spring-back
- Ordering test: D1 beats a past-threshold offset (maskClosable=false + offset=0.9*h → spring-back)
- Boundary tests: offset exactly at 0.40*h; velocity exactly at VELOCITY_FLICK (both sides)
- Clamp test: negative (upward) offset can never dismiss

### Playwright touch e2e (WebKit / iPhone device descriptor)

Prereq task: `npx playwright install webkit` + the `mobile-safari` project in `playwright.config.ts`.

Flows to cover (assert post-gesture state, not mid-drag transforms, to avoid flake):
1. **Drag-to-dismiss** — drag grabber down past 40% → sheet unmounts, backdrop gone. (SHEET-01, SHEET-02)
2. **Drag-then-spring-back** — drag down <40%, slow release → sheet still open at rest position. (SHEET-02)
3. **Scroll-then-drag (body not at top)** — scroll list down, then drag down on body → list scrolls, sheet does NOT dismiss (B5). At top, same drag dismisses (B3). (SHEET-03)
4. **maskClosable={false} non-dismiss** — drag down past 40% on a protected sheet → springs back, stays open; grabber + safe-area still present. (D1 / SHEET-04 protection)
5. **Nested-sheet stacking + independent dismiss** — open sheet B from inside sheet A → B renders above A (useResolvedOverlayZIndex); dismiss B → A remains open and still scroll-locked (no background bleed). (SHEET-06)
6. **Safe-area + dvh** — on the iPhone descriptor, sheet bottom padding clears the home indicator and the dvh cap doesn't clip under the URL bar. (SHEET-05)

### Coverage map (every requirement has a proof)
| Req | Unit | E2E |
|-----|------|-----|
| SHEET-01 grabber + drag | dragDecision D2/D3 | Flow 1 |
| SHEET-02 backdrop dim + spring-back | — | Flows 1, 2 |
| SHEET-03 scroll/drag disambiguation | shouldStartDrag B3/B5 | Flow 3 |
| SHEET-04 detents (dismiss-only) + maskClosable | dragDecision D1 | Flow 4 |
| SHEET-05 safe-area + dvh | — | Flow 6 |
| SHEET-06 nested stacking | — | Flow 5 |

## RESEARCH COMPLETE
