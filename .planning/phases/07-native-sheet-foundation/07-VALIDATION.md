---
phase: 7
slug: native-sheet-foundation
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-29
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest (via react-scripts / CRA) for units; @playwright/test 1.60.0 for touch e2e |
| **Config file** | none for jest (CRA default); `playwright.config.ts` for e2e (needs new `mobile-safari` project) |
| **Quick run command** | `CI=true react-scripts test --watchAll=false src/Components/FastOverlay` |
| **Full suite command** | `CI=true react-scripts test --watchAll=false` then `npm run test:e2e` |
| **Estimated runtime** | ~15s units · ~60s touch e2e (after `npx playwright install webkit`) |

---

## Sampling Rate

- **After every task commit:** Run quick command (units for the touched module)
- **After every plan wave:** Run full unit suite; run e2e after the e2e wave
- **Before `/gsd-verify-work`:** Full unit suite green + touch e2e green on WebKit
- **Max feedback latency:** 15 seconds (units)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 07-01-* | 01 | 1 | SHEET-03 | — | shouldStartDrag gates body drag to scrollTop===0 (B1–B6) | unit | `CI=true react-scripts test --watchAll=false dragDecision` | ❌ W0 | ⬜ pending |
| 07-01-* | 01 | 1 | SHEET-04 | — | dragDecision D1 short-circuits on maskClosable===false | unit | `CI=true react-scripts test --watchAll=false dragDecision` | ❌ W0 | ⬜ pending |
| 07-01-* | 01 | 1 | SHEET-01 | — | dragDecision D2/D3 dismiss past 40% or flick; D4 spring-back | unit | `CI=true react-scripts test --watchAll=false dragDecision` | ❌ W0 | ⬜ pending |
| 07-02-* | 02 | 2 | SHEET-01,02 | — | grabber renders, drag follows finger, backdrop opacity couples | unit/e2e | jest Sheet.test + e2e Flow 1,2 | ✅ extend | ⬜ pending |
| 07-02-* | 02 | 2 | SHEET-05 | — | dvh cap + env(safe-area) padding; viewport-fit=cover meta | e2e | e2e Flow 6 (iPhone descriptor) | ❌ W0 | ⬜ pending |
| 07-02-* | 02 | 2 | SHEET-06 | — | nested sheet stacks above + independent dismiss, lock holds | e2e | e2e Flow 5 | ❌ W0 | ⬜ pending |
| 07-03-* | 03 | 3 | SHEET-03 | — | scroll-then-drag: body not at top scrolls, doesn't dismiss | e2e | e2e Flow 3 | ❌ W0 | ⬜ pending |
| 07-03-* | 03 | 3 | SHEET-04 | — | maskClosable={false} drag past 40% springs back, stays open | e2e | e2e Flow 4 | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] New pure-logic module + spec (e.g. `src/Components/FastOverlay/dragDecision.ts` + `dragDecision.test.ts`) — stubs for SHEET-01/03/04 branch tests
- [ ] `npx playwright install webkit` — WebKit browser not installed (only chromium in ms-playwright cache)
- [ ] `mobile-safari` project added to `playwright.config.ts` (`devices['iPhone 13']`, hasTouch/isMobile)
- [ ] Touch e2e spec scaffold under `tests/e2e/` for the six gesture flows

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real-device iOS Safari feel (drag follow latency, dvh under live URL-bar, home-indicator clearance) | SHEET-05 | jsdom + WebKit emulation can't fully reproduce iOS URL-bar resize timing & safe-area insets | On a physical iPhone Safari/PWA: open each sheet type, drag-dismiss, scroll-then-drag, confirm no clip under toolbar/home indicator |
| Reduced-motion instant dismiss | SHEET-01,02 | OS-level prefers-reduced-motion behavior | Enable Reduce Motion in iOS settings; confirm dismiss/spring-back is instant, finger-follow still direct |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (pure module, webkit install, touch project)
- [x] No watch-mode flags (`--watchAll=false` / `CI=true` enforced)
- [x] Feedback latency < 15s (units); touch e2e (~60s) is the integration-proof layer only (D-08, accepted)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-29
