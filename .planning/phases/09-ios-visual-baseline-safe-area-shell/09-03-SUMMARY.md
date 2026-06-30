---
phase: 09-ios-visual-baseline-safe-area-shell
plan: 03
subsystem: shell
tags: [ios, safe-area, dvh, layout, tokens, cooking-pill, bottom-nav]
dependency_graph:
  requires:
    - "iosTokens (src/Theme/iosTokens.ts) — Plan 09-01"
    - "safeAreaInset (src/Theme/safeArea.ts) — Plan 09-01"
    - "@theme barrel alias — Plan 09-01"
  provides:
    - "Content.tsx dvh-primary height subtracting both safe-area insets exactly once (D-05)"
    - "CookingPill.tsx bottom rebased on safeAreaInset.bottom(bottomNavHeight) (D-06)"
    - "BottomTabNavigator.tsx reference routed through tokens + helper (D-07)"
  affects:
    - "All sticky bottom chrome now converges on one safe-area convention (IOS-02)"
tech_stack:
  added: []
  patterns:
    - "Scoped <style> block for the vh→dvh height cascade (FastOverlay precedent) — a single inline style object cannot carry two height keys"
    - "safeAreaInset.bottom(base) helper composes calc(base + env()) for all sticky bottom chrome"
key_files:
  created:
    - src/Components/Layout/Content/Content.test.tsx
  modified:
    - src/Components/Layout/Content/Content.tsx
    - src/Routing/Shell/CookingPill.tsx
    - src/Routing/Shell/BottomTabNavigator.tsx
    - tests/e2e/cooking-pill.spec.ts
decisions:
  - "Resolved the vh→dvh cascade via a scoped <style> block (#app-content) rather than dvh-only inline, preserving the 100vh fallback for the pre-dvh floor (RESEARCH Pattern 3 option a)"
  - "Dropped a brittle jsdom background-gradient assertion from Content.test.tsx — jsdom does not serialize complex linear-gradient() into the inline style attribute; padding (token-sourced 12px) is the reliably assertable token value"
  - "Routed BottomTabNavigator center-label color (#2f2545) through iosTokens.color.text for D-07 consistency, in addition to the plan-listed _labelStyles swap"
metrics:
  duration: "~10m"
  completed: 2026-06-30
---

# Phase 9 Plan 03: Safe-Area Shell Fixes Summary

Fixed the two IOS-02 safe-area shell bugs that kept sticky bottom chrome from clearing the home indicator: the Content.tsx height-math mismatch (D-05) and the CookingPill missing-inset bug (D-06), then routed the working BottomTabNavigator reference (D-07) through the same `iosTokens` + `safeAreaInset` convention so all three agree from one definition.

## What Was Built

- **`src/Components/Layout/Content/Content.tsx`** — Removed the local `HEADER_HEIGHT`/`BOTTOM_NAV_HEIGHT`/`CONTENT_PADDING` consts and imported `{ iosTokens }` from `@theme`. The scrollable box height now subtracts both insets exactly once via a scoped `<style>` block (`#app-content`): a `100vh` fallback line then the `100dvh` winner, each `- chrome - env(safe-area-inset-top) - env(safe-area-inset-bottom)` where `chrome = iosTokens.layout.headerHeight + iosTokens.layout.bottomNavHeight` (76+80=156). A single inline style object cannot hold two `height` keys (JS overwrites), so the `<style>`-block cascade is the only way to keep the `vh` fallback (Pitfall 2). Padding reads `iosTokens.spacing.md`, background reads `iosTokens.surface.contentGradient`. The box is NOT also padded with the inset (Pitfall 1 — subtract once, no double-correct).
- **`src/Components/Layout/Content/Content.test.tsx`** (new) — Regression guard: (1) the emitted `#app-content` style contains BOTH `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`; (2) `100dvh` primary + `100vh` fallback present, with no single `height:` rule mixing both unit families; (3) padding sourced from tokens (12px). Selects the scoped style element (filters out AntD's injected `<style>`).
- **`src/Routing/Shell/CookingPill.tsx`** (D-06) — Imported `{ iosTokens, safeAreaInset }`. Replaced raw `bottom: 76` with `bottom: safeAreaInset.bottom(iosTokens.layout.bottomNavHeight)` so the pill clears the safe-area-raised nav + home indicator; `minHeight: 52` → `iosTokens.touchTarget.comfortable`; `borderRadius: 999` → `iosTokens.radius.pill`. Left `zIndex: 1000`, the decorative orange gradient/shadow, and 700/750 font weights verbatim per UI-SPEC exceptions. Did not touch the two Modal blocks.
- **`src/Routing/Shell/BottomTabNavigator.tsx`** (D-07, self-reference) — Routed its own magic numbers through tokens so the convention and tokens stay string-equal: `calc(8px + env(...))` → `safeAreaInset.bottom(iosTokens.spacing.sm)`; `minHeight: 88` → `iosTokens.layout.bottomNavContainerMinHeight`; tab `height: 52` → `iosTokens.touchTarget.comfortable`; radii 20/14/10 → `iosTokens.radius.xxl/lg/md`; nav shadow → `iosTokens.surface.shadowNav`; colors → `iosTokens.color.text/textMuted/accentFill`. Left verbatim the documented exceptions (fontSize:10, fontWeight:500, 5px center border, 6px 8px dock padding, zIndex:900).
- **`tests/e2e/cooking-pill.spec.ts`** — Added a `mobile-safari`-runnable test asserting the pill's bottom edge sits at or above the nav's top edge (no overlap) via `boundingBox()` on `active-cooking-floating-button` and `bottom-tab-navigator` (+1px sub-pixel tolerance).

## Tasks Completed

| Task | Name | Commit |
| ---- | ---- | ------ |
| 1 | Fix Content.tsx height math — both insets, one unit family (D-05) | 9564c26 |
| 2 | Author Content.test.tsx regression guard (IOS-02) | 9baf1ae |
| 3 | Rebase CookingPill inset (D-06) + route BottomTabNavigator through tokens (D-07) | c7e5390 |

## Verification

- `CI=true npx react-scripts test src/Components/Layout/Content --watchAll=false` — 3/3 passed.
- `CI=true npx react-scripts test src/Routing --watchAll=false` — "No tests found" (no jsdom tests exist under src/Routing; shell behavior is covered by tsc + the e2e clearance test).
- `npx tsc --noEmit` — 0 errors referencing Content/CookingPill/BottomTabNavigator.
- Grep gates: `bottom: 76` absent from CookingPill.tsx; no bare `100vh - 156px`/`100dvh - 156px` (chrome-only, no insets) in Content.tsx; CookingPill reads `safeAreaInset.bottom(iosTokens.layout.bottomNavHeight)`; nav reads `safeAreaInset.bottom(iosTokens.spacing.sm)` + `iosTokens.*`.

Note: the e2e clearance test runs via `--project=mobile-safari` and was not executed in this worktree (no WebKit binary / dev server here). The real home-indicator inset is non-zero only on notched hardware, so the live clearance check is manual-only per VALIDATION; the authored test pins the no-overlap geometry the `safeAreaInset.bottom(bottomNavHeight)` rebase guarantees.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Content.test.tsx selected AntD's injected `<style>` instead of the scoped one**
- **Found during:** Task 2
- **Issue:** `document.querySelector('style')` returned AntD's first injected stylesheet (anchor reset CSS), not the `#app-content` height block, so the inset assertions failed against the wrong text.
- **Fix:** `readContentCss()` now scans all `<style>` elements and selects the one whose text contains `#app-content`.
- **Files modified:** src/Components/Layout/Content/Content.test.tsx
- **Commit:** 9baf1ae

**2. [Rule 1 - Bug] Brittle jsdom background-gradient assertion**
- **Found during:** Task 2
- **Issue:** jsdom does not serialize a complex `linear-gradient()` into either `style.background` or the inline `style` attribute text, so asserting `linear-gradient` was unprovable in jsdom.
- **Fix:** Replaced the background assertion with a token-sourced padding assertion (`12px`), which jsdom serializes reliably. The gradient itself reads `iosTokens.surface.contentGradient` in source (verified by inspection); it is exercised end-to-end by the rendered app, not jsdom.
- **Files modified:** src/Components/Layout/Content/Content.test.tsx
- **Commit:** 9baf1ae

**3. [Rule 2 - Consistency] Routed center-label color through tokens**
- **Found during:** Task 3
- **Issue:** `_centerLabelStyles` hardcoded `#2f2545`, the same value the plan routed in `_labelStyles`. Leaving it raw would fork the D-07 single-source convention.
- **Fix:** `_centerLabelStyles` color now reads `iosTokens.color.text`.
- **Files modified:** src/Routing/Shell/BottomTabNavigator.tsx
- **Commit:** c7e5390

## Threat Flags

None — this plan changes only client-side CSS layout values (env()/dvh/calc), token wiring, and test additions. No auth, network, storage, input-handling, or crypto surface touched (matches plan threat_model: T-09-03 accepted, static CSS layout, no ASVS L1 control applies).

## Self-Check: PASSED

- Files: Content.tsx, Content.test.tsx, CookingPill.tsx, BottomTabNavigator.tsx, cooking-pill.spec.ts, 09-03-SUMMARY.md — all FOUND.
- Commits: 9564c26, 9baf1ae, c7e5390, 3fb77bc — all FOUND in git log.
- Working tree clean after the SUMMARY commit.
