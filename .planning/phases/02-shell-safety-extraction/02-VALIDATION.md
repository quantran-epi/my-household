---
phase: 2
slug: shell-safety-extraction
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-15
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from 02-RESEARCH.md "Validation Architecture" (L405-439).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (CRA `react-scripts test`) for unit; Playwright `@playwright/test` ^1.60.0 for e2e |
| **Config file** | `playwright.config.ts` (e2e); no standalone jest config (CRA built-in) |
| **Quick run command** | `yarn test:e2e tests/e2e/app-shell-navigation.spec.ts` |
| **Full suite command** | `yarn test:e2e` (all e2e) + `CI=true yarn test --watchAll=false` (unit) |
| **Estimated runtime** | ~30–60 seconds for the single shell spec; full e2e suite minutes |

Notes: repo uses **yarn**; Playwright `webServer` starts the dev server on port 3010 via `npm start` with `FAST_REFRESH=false`. `reuseExistingServer: true` — kill port 3010 / restart the dev server before the "after" e2e run so it does not test stale code (RESEARCH Pitfall 6).

---

## Sampling Rate

- **After every task commit:** Run `yarn test:e2e tests/e2e/app-shell-navigation.spec.ts` (the moved-component baseline) + `yarn build` for type-check (surfaces broken re-paths — Pitfall 2).
- **After every plan wave:** Run `yarn test:e2e` (full e2e suite — the D-07 identity proof).
- **Before `/gsd-verify-work`:** Full e2e suite must be green AND `yarn build` clean.
- **Max feedback latency:** ~60 seconds (single shell spec + build type-check).

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01 (W0 baseline) | 01 | 1 | FND-02 | — | N/A (test repair to source of truth) | e2e | `yarn test:e2e tests/e2e/app-shell-navigation.spec.ts` | ✅ exists — repair stale assertions to match source (Pitfall 1) | ⬜ pending |
| 02-02-01 ErrorBoundary | 02 | 1 | FND-01 | T-02 (V7) | Fallback shows no `error.message`/stack; generic VN copy | e2e | `yarn test:e2e tests/e2e/error-boundary.spec.ts` | ❌ W0 — new spec + test-only render-throw route | ⬜ pending |
| 02-02-02 crash-test route | 02 | 1 | FND-01 | T-02-CT | Test-only route unlinked from nav; throws only, no writes | e2e | `yarn test:e2e tests/e2e/error-boundary.spec.ts` | ❌ W0 (same spec) | ⬜ pending |
| 02-03 (Sheet wrapper) | 03 | 2 | MOB-03 | — | Portal overlay; no z-index stack fork (Pitfall 3) | e2e | `yarn test:e2e tests/e2e/sheet-smoke.spec.ts` | ❌ W0 — D-10 smoke proof + temp mount harness | ⬜ pending |
| 02-04 (leaf extractions) | 04 | 2 | FND-02 | T-02-MV | Verbatim test ids; re-pathed imports; intact move | e2e | `yarn test:e2e tests/e2e/app-shell-navigation.spec.ts tests/e2e/cooking-pill.spec.ts tests/e2e/global-search.spec.ts` | ⚠️ cooking-pill spec is W0; others exist | ⬜ pending |
| 02-05-01 SidebarDrawer move | 05 | 3 | FND-02 | T-02-MV | Move intact (D-05); verbatim test ids; re-path assets | unit/build | `yarn build` | ✅ existing infra | ⬜ pending |
| 02-05-02 DataBackup + collapse | 05 | 3 | FND-02 | T-02-DB | DataBackup preserved + flagged (D-06), URL unchanged | e2e | `yarn test:e2e tests/e2e/app-shell-navigation.spec.ts tests/e2e/cooking-pill.spec.ts tests/e2e/global-search.spec.ts` | ✅ (after W0) | ⬜ pending |
| 02-05-03 ROUTE-INVENTORY | 05 | 3 | FND-02 | — | Static doc; flags dead DataBackup + test-only crash route | doc check | `test -f .../ROUTE-INVENTORY.md && grep -q "Entry path" ...` | n/a (doc) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/e2e/app-shell-navigation.spec.ts` — **repair/confirm green baseline** before extraction (Pitfall 1: stale assertions vs current `MasterPage.tsx`); covers FND-02. Observe actual pass/fail on a clean checkout first (Q1 resolution: fix spec-to-source).
- [ ] `tests/e2e/error-boundary.spec.ts` + a test-only render-throw route (`__crash-test`) — covers FND-01.
- [ ] `tests/e2e/cooking-pill.spec.ts` + seed a `status:"cooking"` session in `fixtures/testData.ts` — covers FND-02 pill (`active-cooking-floating-button`).
- [ ] Bottom-tab active-state assertions (extend `app-shell-navigation.spec.ts`) — covers FND-02 nav.
- [ ] `tests/e2e/sheet-smoke.spec.ts` + a temporary Sheet mount harness — covers MOB-03 (D-10 smoke proof).
- [ ] No new framework install needed (Playwright + Jest already present).

*`wave_0_complete: false` — these scaffolds are created/repaired during execution (Wave 0 / Wave 1 baseline) before the dependent moves run.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Fallback visual styling inherits antd theme (#7436dc) + viVN locale | FND-01 | Visual/theme inheritance is hard to assert reliably in e2e beyond text presence | Trigger the crash route, confirm the Reload button + heading render with app theme (not unstyled/English) |

*Most behaviors have automated verification; the above is a visual confirmation layered on top of the automated e2e text assertions.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (error-boundary, cooking-pill, sheet-smoke specs + baseline repair)
- [x] No watch-mode flags (e2e + `CI=true` unit run)
- [x] Feedback latency < 60s (single shell spec + build)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
