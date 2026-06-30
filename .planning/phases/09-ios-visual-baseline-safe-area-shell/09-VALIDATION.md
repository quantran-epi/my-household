---
phase: 9
slug: ios-visual-baseline-safe-area-shell
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-30
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (jsdom) + Playwright (touch e2e) |
| **Config file** | `package.json` (jest), `playwright.config.ts` (existing `mobile-safari` project) |
| **Quick run command** | `npx jest <changed test file>` |
| **Full suite command** | `npx jest` |
| **Estimated runtime** | ~60 seconds (jsdom unit); touch e2e ~30s per spec |

---

## Sampling Rate

- **After every task commit:** Run `npx jest <relevant test file>`
- **After every plan wave:** Run `npx jest`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| (planner fills) | — | — | IOS-01/02/03 | — / — | N/A (no auth/data surface) | unit | `npx jest` | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing infrastructure covers all phase requirements (jest jsdom + the Phase 7/8 `mobile-safari` Playwright touch project already exist). No new framework install needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sticky bottom chrome (nav, cooking pill) clears the home indicator on a real notched iOS device | IOS-02 | `env(safe-area-inset-*)` resolves to non-zero only on real notched hardware/simulator; jsdom + headless WebKit report 0 | On a notched iPhone (or iOS Simulator), open the PWA, confirm bottom nav + cooking pill sit above the home indicator and do not overlap |

*Automated coverage: token application + 44px bar via jsdom assertions; layout math via Playwright `mobile-safari`. The above real-device check supplements, not replaces.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
