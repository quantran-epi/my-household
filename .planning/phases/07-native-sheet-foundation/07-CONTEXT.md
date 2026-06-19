# Phase 7: Native Sheet Foundation - Context

**Gathered:** 2026-06-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Upgrade the existing `@components/Sheet` (the `Sheet` export in `src/Components/FastOverlay/FastOverlay.tsx`) into a native-feeling iOS bottom sheet: grabber handle, drag-to-dismiss with backdrop dimming, scroll-vs-drag disambiguation, safe-area / `dvh` layout, and correct nested-sheet stacking. Covers SHEET-01..06.

**In scope:** the `Sheet` shell only, plus the `viewport-fit=cover` meta tag needed to make SHEET-05 safe-area actually work.
**Out of scope:** the sheet-picker component layer (Phase 8), the iOS token baseline + app-shell safe-area (Phase 9), and any picker/call-site migrations (Phases 10-11). No call-site API changes in this phase.

</domain>

<decisions>
## Implementation Decisions

### Snap / detents scope
- **D-01:** Dismiss-only — no multi-detent snapping. The sheet sizes to its content (current behavior, capped at ~85→`dvh`); the only gesture is drag-DOWN-to-dismiss. SHEET-04 ("snap to detents") is satisfied by content-height + `dvh` cap, not a medium/full position machine. Rationale: multi-detent snap is the #2-ranked jank hazard and the research labels it optional; every current sheet use (pickers, confirms) is short, so detents add risk with no payoff now. Do NOT build a forward-looking detents array — ship the simplest correct gesture (YAGNI).
- **D-02:** Dismiss triggers on release when the drag passes ~40% of sheet height **OR** a fast downward flick (velocity), else springs back to open. iOS-standard feel; handles both slow drags and quick flicks.

### Rollout to existing call sites
- **D-03:** Default-on everywhere. Every existing `<Sheet>` gets grabber + drag-to-dismiss + safe-area automatically with no call-site edits. "No call-site changes" means no API/prop changes are required — the native feel becomes the baseline app-wide the moment Phase 7 ships.
- **D-04:** Drag-to-dismiss respects the existing `maskClosable` prop. Sheets that already set `maskClosable={false}` (destructive confirms, in-progress input) are automatically protected from drag-dismiss — they still get the grabber and safe-area, just not drag-close. No new prop is introduced.

### Scroll-vs-drag rule (the #2 jank hazard — get it native here)
- **D-05:** Grabber + header are always a drag handle (`touch-action: none`). Inside the scrollable body, a downward drag begins a dismiss **only when `scrollTop === 0`**; otherwise native scroll wins. Add `overscroll-behavior: contain` on the scroll container to kill rubber-band-into-drag.
- **D-06:** Use pointer events with `setPointerCapture` (locked by research — no new gesture library). Drag/position state is **local to each Sheet instance**, not Redux. Keep the drag transition inside the existing `prefers-reduced-motion` guard already in FastOverlay.

### Safe-area enablement
- **D-07:** Add `viewport-fit=cover` to the viewport meta tag **in Phase 7** (alongside the `env(safe-area-inset-bottom)` + `dvh` sheet CSS), so SHEET-05's safe-area padding is actually testable in this phase. Phase 9 (IOS-02) then *extends* safe-area handling to the app shell/nav — Phase 7 only needs the meta + the sheet's own bottom padding.

### Verification approach
- **D-08:** Extract the drag decision logic (past-threshold? velocity flick? `scrollTop` gate? snap-back vs dismiss?) into a **pure function/reducer** and unit-test it exhaustively under Jest/jsdom. Add a **Playwright touch e2e** for the real gesture: drag-dismiss, drag-then-spring-back, scroll-then-drag (body not at top), `maskClosable={false}` non-dismiss, and nested-sheet stacking + independent dismiss. Research flags the existing test net as too thin for this refactor; pure-logic units pin every branch, e2e proves the wiring.

### Claude's Discretion
- Grabber visual styling, exact drag-follow easing, the precise velocity threshold value, and reducer shape are Claude's call — match the existing FastOverlay aesthetic (purple-tinted surface, 18px top radius) and `cubic-bezier(0.16, 1, 0.3, 1)` motion ease.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` §"Phase 7: Native Sheet Foundation" — phase goal + 4 success criteria.
- `.planning/REQUIREMENTS.md` §SHEET (SHEET-01..06) — the six native-sheet requirements this phase delivers.

### v1.1 research (locks the big technical choices — read before planning)
- `.planning/research/SUMMARY.md` — **no new runtime deps**; React pointer events for drag; CSS `env()` + `100dvh` for layout; reject `vaul`/`react-spring-bottom-sheet`; drag state local to Sheet base.
- `.planning/research/PITFALLS.md` §A (iOS Safari/PWA) + §D (stacking/nesting) + §E (a11y) — scroll/drag conflict, `100vh` URL-bar bug, `touch-action`, `overscroll-behavior`, body-scroll-lock on iOS, nested-sheet z-index, focus trap.

### Code under change
- `src/Components/FastOverlay/FastOverlay.tsx` — the `Sheet` export (lines ~312-383) is the upgrade target; `useResolvedOverlayZIndex` (token stacking, reuse for nesting), `useBodyScrollLock`, `useEscapeClose`, and the `prefers-reduced-motion` guard already exist and must be preserved.
- `src/Components/Sheet/index.ts`, `src/Components/Sheet/Sheet.test.tsx` — public barrel + existing jsdom tests to extend.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useResolvedOverlayZIndex` (FastOverlay.tsx): token-based z-index stacking — already makes a sheet-opened-from-a-sheet render above its parent (SHEET-06). Do NOT pass an explicit `zIndex`; let the token system stack. Verify with a nested-sheet e2e.
- `useBodyScrollLock`: already prevents background scroll bleed. Keep it; PITFALLS §A notes `overflow:hidden` can be weak on iOS — verify it holds with stacked sheets and the new overscroll handling.
- `prefers-reduced-motion` guard (`overlayMotionStyles`): already clamps animation durations. The new drag transition must live inside this guard.
- `SheetActions`: existing horizontal action-row helper — sticky bottom actions in a sheet should keep using it; safe-area bottom padding applies around/below it.

### Established Patterns
- Sheets render via `createPortal` to `document.body` with inline styles (no CSS modules). New drag/safe-area styling follows the same inline-style + injected `<style>` keyframe pattern already in the file.
- Current `Sheet` height is `toCssSize(height, "min(85vh, 720px)")` — switch the `vh` to `dvh` (with `vh` fallback) per SHEET-05.
- Surface aesthetic to match: `linear-gradient(180deg, #f5f0ff 0%, #ffffff 42%)`, `borderRadius: 18px 18px 0 0`, motion ease `cubic-bezier(0.16, 1, 0.3, 1)`.

### Integration Points
- Meta tag: `viewport-fit=cover` must be added to the viewport `<meta>` (in `public/index.html`) for `env(safe-area-inset-*)` to resolve to non-zero on iOS — required for SHEET-05 (D-07).
- Playwright: `playwright.config.ts` currently defines only a desktop `chromium` project with no `hasTouch`/`isMobile` context. The gesture e2e (D-08) needs a **touch-capable project** (ideally a WebKit / iPhone device descriptor, since every hazard is iOS-Safari-specific). Adding that project is a planner/executor task — flagged here so it isn't missed.
- Existing call sites consume `Sheet` through `@components/Sheet`; default-on means none of them change, but a no-regression check across current sheet users is warranted.

</code_context>

<specifics>
## Specific Ideas

- Target the iOS-standard sheet feel: grabber pill at top, drag follows the finger 1:1, backdrop opacity scales with drag distance, release past ~40%-or-flick dismisses, otherwise spring back.
- "Native everywhere at once" is the explicit intent — the upgrade should be visibly felt app-wide the moment it ships, not hidden behind a flag.

</specifics>

<deferred>
## Deferred Ideas

- **Multi-detent snapping (medium/full position machine):** considered for SHEET-04 but deferred — dismiss-only chosen (D-01). Revisit only if a future tall-content sheet genuinely needs an intermediate rest position.
- **Haptics & spring/inertia physics on drag:** out of scope for v1.1 entirely (MOTION-01/02, deferred milestone). The drag uses simple follow + spring-back, not inertia.
- **App-shell / nav safe-area:** Phase 7 only handles the sheet's own safe-area + the `viewport-fit=cover` meta. Extending safe-area insets to sticky bottom nav/CTAs is IOS-02 (Phase 9).

</deferred>

---

*Phase: 7-Native Sheet Foundation*
*Context gathered: 2026-06-19*
