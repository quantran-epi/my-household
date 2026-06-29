# Phase 7: Native Sheet Foundation - Pattern Map

**Mapped:** 2026-06-29
**Files analyzed:** 6 (1 modified component, 1 new pure module + test, 1 extended jsdom test, 1 meta edit, 1 config edit, 1 new e2e spec)
**Analogs found:** 6 / 6

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/Components/FastOverlay/FastOverlay.tsx` (the `Sheet` export, ~312-383) | component (overlay shell) | event-driven (pointer drag) + request-response (close) | itself + `FastDrawerShell` / `FastModalShell` in the same file | exact (self-upgrade) |
| `src/Components/FastOverlay/dragDecision.ts` (NEW pure module) | utility (pure reducer) | transform (state in → decision out) | `src/Modules/DishSuggester/Helpers/DishScorer.ts` / `src/Common/Helpers/NumberHelpers.ts` | role-match (pure module idiom) |
| `src/Components/FastOverlay/dragDecision.test.ts` (NEW) | test (jest/jsdom, pure) | transform | `src/Modules/DishSuggester/Helpers/DishScorer.test.ts` | exact (pure-logic unit test) |
| `src/Components/Sheet/Sheet.test.tsx` (extend) | test (jsdom, RTL) | request-response | itself (already exists) | exact |
| `public/index.html` (viewport meta edit) | config (static meta) | n/a | the existing `<meta name="viewport">` line 7 | exact (one-line edit) |
| `playwright.config.ts` (add touch project) | config (test runner) | n/a | the existing `chromium` project block (lines 28-33) | exact |
| `tests/e2e/sheet-drag-gesture.spec.ts` (NEW touch e2e) | test (playwright) | event-driven (touch gesture) | `tests/e2e/dish-suggester-sheet-overflow.spec.ts` | role-match (sheet-focused e2e) |

## Shared Patterns (cross-cutting — apply to the Sheet upgrade)

### Inline-style + injected `<style>` keyframe pattern
**Source:** `src/Components/FastOverlay/FastOverlay.tsx:47-121`
**Apply to:** the new `dvh`/safe-area CSS and the drag spring-back transition.

The file uses NO CSS modules. Animations are named keyframes defined once in a module-level `overlayMotionStyles` JSX `<style>` block, rendered as the first child inside each portal. Ease + animation strings are module constants:

```typescript
const overlayMotionEase = "cubic-bezier(0.16, 1, 0.3, 1)";
const backdropInAnimation = `my-recipes-fast-overlay-fade-in 120ms ${overlayMotionEase} both`;
const sheetInAnimation = `my-recipes-fast-sheet-in 180ms ${overlayMotionEase} both`;

const overlayMotionStyles = <style>{`
@keyframes my-recipes-fast-sheet-in { from { opacity: 0; transform: translate3d(0, 24px, 0); } to { opacity: 1; transform: translate3d(0, 0, 0); } }
@media (prefers-reduced-motion: reduce) {
  .my-recipes-fast-overlay,
  .my-recipes-fast-overlay * { animation-duration: 1ms !important; transition-duration: 1ms !important; }
}
`}</style>;
```

**Why this matters for Phase 7:**
- Two same-key declarations (`max-height: min(85vh,...)` then `max-height: min(85dvh,...)`) CANNOT go in the React `style` prop. Per RESEARCH §iOS CSS, emit them via a class in this injected `<style>` block (e.g. add a `.my-recipes-fast-sheet-section { max-height: ...; }` rule) and put `className` on the `<section>`.
- The drag spring-back/dismiss transition MUST be a CSS `transition` on an element under `.my-recipes-fast-overlay` so the existing reduced-motion clamp (lines 117-120) neutralizes it to `1ms` automatically (D-06). The finger-follow (`transition: none` while dragging) is direct manipulation and exempt.
- Add any new keyframes / safe-area class to the same `overlayMotionStyles` block — do not introduce a new style mechanism.

### Reusable hooks — preserve all three, add nothing to Redux
**Source:** `src/Components/FastOverlay/FastOverlay.tsx:66-110`
**Apply to:** the upgraded `Sheet` — keep the exact composition at lines 324-326.

```typescript
useBodyScrollLock(open);                                  // :66-75 saves/restores body.overflow
useEscapeClose(open && keyboard, onClose);                // :77-86 window keydown → Escape → onClose
const resolvedZIndex = useResolvedOverlayZIndex(open, zIndex, 1200);  // :88-110 token stacking
```

- `useResolvedOverlayZIndex` (`:88-110`) is the module-level token allocator (`allocateOverlayStackToken`/`releaseOverlayStackToken`, `:52-64`). When `zIndex` is undefined it resolves to `1200 + stackIndex*20`, so a nested sheet renders above its parent (SHEET-06). Do NOT pass an explicit `zIndex`.
- Drag/offset state is NEW and stays LOCAL — `React.useState`/`React.useRef` inside the `Sheet` component, never Redux (D-06). There is no Redux usage anywhere in this file; do not introduce it.
