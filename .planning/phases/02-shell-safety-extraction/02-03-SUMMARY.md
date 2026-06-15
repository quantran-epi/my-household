---
phase: 02-shell-safety-extraction
plan: 03
subsystem: ui
tags: [react, overlay, portal, bottom-sheet, testing-library, jest]

# Dependency graph
requires:
  - phase: 01-copy-infrastructure
    provides: FastOverlay portal system (FastDrawerShell/FastModalShell, shared stacking singletons)
provides:
  - "@components/Sheet bottom-sheet wrapper built on the existing FastOverlay portal system (D-09)"
  - "SheetProps public API covering Phase 5 picker/confirmation needs"
  - "Jest/RTL moduleNameMapper so @-aliased imports resolve under react-scripts test"
affects: [phase-05, mobile-pickers, confirmations, MOB-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Co-located overlay variants in FastOverlay.tsx share module-private stacking singletons (Pitfall 3)"
    - "Bottom-placement overlay = flex-end backdrop + 18px-top-radius panel + translateY slide-up keyframe"

key-files:
  created:
    - src/Components/Sheet/index.ts
    - src/Components/Sheet/Sheet.test.tsx
  modified:
    - src/Components/FastOverlay/FastOverlay.tsx
    - package.json

key-decisions:
  - "Sheet co-located in FastOverlay.tsx (not a separate module) to reuse the existing z-index stacking singletons rather than fork them (D-09 / Pitfall 3)"
  - "Added jest moduleNameMapper to package.json so the mandated @components/Sheet import resolves under react-scripts test (Rule 3 blocking fix)"
  - "No existing picker/confirmation migrated this phase (D-10 — first consumers arrive in Phase 5)"

patterns-established:
  - "Bottom-anchored overlay variant: alignItems flex-end backdrop, borderRadius 18px 18px 0 0, my-recipes-fast-sheet-in translateY keyframe added to the shared overlayMotionStyles block (reduced-motion handled automatically)"
  - "Net-new @-aliased components get jest moduleNameMapper coverage mirroring webpack aliases"

requirements-completed: [MOB-03]

# Metrics
duration: 14min
completed: 2026-06-15
---

# Phase 2 Plan 03: Sheet Bottom-Sheet Wrapper Summary

**`@components/Sheet` bottom-anchored overlay built on the existing FastOverlay portal system, sharing the drawer/modal z-index stacking singletons, with a jest/RTL mount/unmount/onClose smoke proof.**

## Performance

- **Duration:** ~14 min
- **Completed:** 2026-06-15
- **Tasks:** 2
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments
- Added `export const Sheet` + `export type SheetProps` inside `FastOverlay.tsx`, co-located so it reuses `useBodyScrollLock`/`useEscapeClose`/`useResolvedOverlayZIndex` and the module-private `allocateOverlayStackToken`/stacking singletons (no re-declaration — Pitfall 3 / T-02-OV mitigation).
- Bottom placement: `flex-end` backdrop (`rgba(16,24,40,0.30)`), full-width panel up to `maxWidth: 720`, `borderRadius: "18px 18px 0 0"`, `maxHeight: min(85vh, 720px)` (overridable via `height`), and a new `my-recipes-fast-sheet-in` translateY keyframe added to the shared `overlayMotionStyles` block so `prefers-reduced-motion` applies automatically.
- Closes via mask click, Escape, and a close button — matching FastDrawerShell defaults (`maskClosable`/`keyboard`/`closable` default true). `FastDrawerShell`/`FastModalShell` left untouched.
- Shipped `@components/Sheet` barrel re-exporting `Sheet` + `SheetProps`, plus a jest/RTL smoke test proving mount-when-open, absent-when-closed, and onClose-on-close-click through the barrel.

## Task Commits

1. **Task 1: Add Sheet variant + SheetProps + barrel** - `d25aed6` (feat)
2. **Task 2: Sheet mount/unmount/onClose smoke proof** - `348c2ca` (test)

_Note: This is a `tdd="true"` plan, but the verification gate is a build (Task 1) and a smoke test (Task 2); each task committed once._

## Files Created/Modified
- `src/Components/FastOverlay/FastOverlay.tsx` - Added `SheetProps`, exported `FastOverlayBaseProps`, `Sheet` component, and the `my-recipes-fast-sheet-in` keyframe; `sheetInAnimation` constant.
- `src/Components/Sheet/index.ts` - One-line barrel re-exporting from `@components/FastOverlay` so `@components/Sheet` resolves.
- `src/Components/Sheet/Sheet.test.tsx` - Three RTL smoke assertions importing `Sheet` from the barrel.
- `package.json` - Added a `jest.moduleNameMapper` block mapping the `@components`/`@modules`/`@routing`/`@store`/`@common`/`@hooks` aliases for `react-scripts test`.

## Decisions Made
- Co-located `Sheet` in `FastOverlay.tsx` per D-09/Pitfall 3 to share stacking singletons rather than fork them.
- Close-button `aria-label="Đóng"` (matches the warm Vietnamese register; FastDrawerShell uses "Ẩn menu" which is menu-specific, so a neutral "Đóng" suits a generic sheet).
- No consumer migrated (D-10).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added jest moduleNameMapper for @-aliases**
- **Found during:** Task 2 (smoke test)
- **Issue:** Tests run via `react-scripts test` (not craco), which ignores craco's webpack aliases. `import { Sheet } from '@components/Sheet'` failed with "Cannot find module '@components/Sheet'", blocking the test the plan explicitly mandates.
- **Fix:** Added a `jest.moduleNameMapper` block to `package.json` mirroring the existing webpack/tsconfig aliases (`@components`, `@modules`, `@routing`, `@store`, `@common`, `@hooks`). `moduleNameMapper` is on CRA's allowed jest-config whitelist.
- **Files modified:** package.json
- **Verification:** `CI=true yarn test --watchAll=false src/Components/Sheet` → 3/3 passing.
- **Committed in:** `348c2ca` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The moduleNameMapper is required for any `@`-aliased import to be testable under jest; it changes no runtime behavior and benefits future aliased tests. No scope creep.

## Issues Encountered
- The worktree had no `node_modules`. Symlinked the main checkout's `node_modules` into the worktree so `yarn build`/`yarn test` could run. The symlink is gitignored and not committed.

## Threat Flags
None — no new network endpoints, auth paths, or trust-boundary surface introduced. Sheet renders only caller-provided `title`/`children` (T-02-ID accepted) and reuses the existing stacking singletons (T-02-OV mitigation upheld: no singleton re-declaration).

## Known Stubs
None affecting the plan goal. The Sheet wrapper renders no hardcoded/mock data; it is an intentionally consumer-free wrapper this phase (D-10). First real consumers (pickers/confirmations) arrive in Phase 5 (MOB-03 consumer migration).

## Next Phase Readiness
- `@components/Sheet` is importable and verified; Phase 5 can mount pickers/confirmations on it.
- Jest alias resolution is now wired, so future component tests can import via `@`-aliases.

---
*Phase: 02-shell-safety-extraction*
*Completed: 2026-06-15*
