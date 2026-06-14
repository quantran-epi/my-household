---
phase: 1
slug: copy-infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-14
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
>
> This phase is a typed-constants module with **no runtime logic to unit-test** —
> the validation surface is the TypeScript type-checker itself. Build-time type
> checking is ON (`craco.config.js` → ForkTsChecker) despite `tsconfig` `strict: false`,
> so a bad key genuinely fails the production build.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | tsc 4.9.5 (type-checker) — the meaningful gate. Jest via `react-scripts test` exists but repo has ~2 unit tests; no new Jest files required for a typed-constants module. |
| **Config file** | `tsconfig.json` + `craco.config.js` (`typescript.enableTypeChecking: true`) |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~10-30 seconds (tsc); ~60-120s (build) |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd-verify-work`:** Production build must be green
- **Max feedback latency:** ~30 seconds (tsc)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-xx | 01 | 1 | COPY-01 | — | N/A | type-check | `npx tsc --noEmit` | ✅ (toolchain) | ⬜ pending |
| 1-01-xx | 01 | 1 | COPY-01 (negative) | — | Unknown key fails build (TS2339/TS2322) | type-check (negative) | add bad ref → `npx tsc --noEmit` exits non-zero → revert | ✅ (toolchain) | ⬜ pending |
| 1-01-xx | 01 | 1 | COPY-01 (negative) | — | Dropped interpolation arg fails build (TS2345) | type-check (negative) | call fn-string with `{}` → `npx tsc --noEmit` non-zero → revert | ✅ (toolchain) | ⬜ pending |
| 1-01-xx | 01 | 1 | COPY-02 | — | Glossary lists one term per concept, greppable | manual review | `rg "COPY_GLOSSARY" src/Common/Copy` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure (tsc + craco build) covers all phase requirements. No Jest test files are required for a typed-constants module. The negative type-check (deliberate bad key → assert build fails → revert) is the proof of COPY-01 and can be a scripted task rather than a committed test file.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Glossary defines one Vietnamese term per concept; no synonym drift | COPY-02 | Semantic judgment — no tool can assert "one term per concept" | Read `Glossary.ts`; confirm each concept maps to exactly one canonical term; `rg "COPY_GLOSSARY" src/Common/Copy` resolves |
| Negative key-reference test demonstrated then reverted | COPY-01 | Requires temporarily introducing a bad reference and confirming the build fails | Add a known-bad `AppCopy.foo.bar` ref → `npx tsc --noEmit` must exit non-zero → revert the edit |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (none — toolchain covers all)
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
