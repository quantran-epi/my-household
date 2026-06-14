---
phase: 01-copy-infrastructure
verified: 2026-06-14T00:00:00Z
status: passed
score: 6/6 must-haves verified
overrides_applied: 0
---

# Phase 1: Copy Infrastructure Verification Report

**Phase Goal:** A single typed source of truth for user-facing Vietnamese copy exists and enforces consistent terminology, so every later screen is written through it instead of hand-editing ~408 inline strings twice.
**Verified:** 2026-06-14
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | A typed AppCopy module is the source of truth for user-facing Vietnamese strings (COPY-01, D-01) | ✓ VERIFIED | `src/Common/Copy/AppCopy.ts:21` exports `const AppCopy = {...} as const` with three namespaces (`common`, `wizard`, `emptyStates`) holding real Vietnamese strings (e.g. `heroPrompt: "Hôm nay ăn gì?"`). Zero imports, no default export. |
| 2 | A derived CopyKey union fails the build on an unknown key under strict:false (COPY-01, D-02) | ✓ VERIFIED | `AppCopy.ts:53-59` defines recursive `CopyPath<T>` (leaf-only) and `export type CopyKey = CopyPath<typeof AppCopy>`. Empirically: a scratch file referencing `AppCopy.wizard.doesNotExist` produced **TS2339** under `tsc 4.9.5` strict:false. |
| 3 | Interpolated strings are named-arg functions, so a dropped dynamic value is a compile error (D-03, D-09) | ✓ VERIFIED | `AppCopy.ts:33` `greeting: (args: { name: string }) => ...` and `:38` `addedToToday: (args: { dishName: string }) => ...`. Empirically: `AppCopy.wizard.greeting({})` produced **TS2345** ("Argument of type '{}' is not assignable to parameter of type '{ name: string; }'"). |
| 4 | A review-only glossary defines one Vietnamese term per concept, greppable for synonym conflicts (COPY-02, D-04, D-05) | ✓ VERIFIED | `src/Common/Copy/Glossary.ts:15` exports `COPY_GLOSSARY` (as const) with 5 concepts (`todaysMeal`, `dish`, `addAction`, `skip`, `heroPrompt`), each a single `term` string + `avoid[]` + `note`. Header comment marks it review-only. No runtime importers (grep across `src/` returns only the barrel re-export). |
| 5 | Screens can import via @common/Copy and read copy by direct object access (D-07) | ✓ VERIFIED | `tsconfig.json:28` `"@common/*": ["./src/Common/*"]` and `craco.config.js:20` alias both resolve `@common/Copy` → `src/Common/Copy/index.ts`. No `getCopy` helper present (grep returns nothing). Clean tree passes `tsc --noEmit` (exit 0). |
| 6 | A documented ripgrep recipe locates un-migrated inline Vietnamese strings for Phase 5 (D-08) | ✓ VERIFIED | `index.ts:17-33` header comment contains the `rg -l --pcre2` Vietnamese-diacritic recipe scanning `src/Modules src/Routing/MasterPage.tsx`, with notes (62 files, single-quote/JSX variants for full coverage). |

**Score:** 6/6 truths verified

Roadmap success criteria (1, 2, 3) are subsumed by truths 1–2 (SC1), truth 3 (SC2), and truth 4 (SC3) respectively — all VERIFIED.

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `src/Common/Copy/AppCopy.ts` | AppCopy const (3 namespaces, as const) + derived CopyKey | ✓ VERIFIED | 60 lines, `export const AppCopy`, `as const`, `export type CopyKey`, 2 named-arg fns, no imports, no default export |
| `src/Common/Copy/Glossary.ts` | COPY_GLOSSARY review-only, one term per concept | ✓ VERIFIED | 43 lines, `export const COPY_GLOSSARY` as const, 5 concepts each with single `term`, not runtime-wired |
| `src/Common/Copy/index.ts` | Barrel re-exporting AppCopy/CopyKey/COPY_GLOSSARY + ripgrep recipe | ✓ VERIFIED | `export * from './AppCopy'` + `export * from './Glossary'`, pcre2 recipe in header |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `index.ts` | `AppCopy.ts` | barrel re-export | WIRED | `export * from './AppCopy'` present (index.ts:35) |
| `index.ts` | `Glossary.ts` | barrel re-export | WIRED | `export * from './Glossary'` present (index.ts:36) |
| `@common/Copy` | `index.ts` | path alias | WIRED | `@common/*` → `./src/Common/*` in tsconfig.json + craco.config.js; resolves to barrel |

### Data-Flow Trace (Level 4)

Not applicable — this is a compile-time-only typed-constants module with no runtime data flow, rendering, or dynamic data source. Strings are static authored content (intentionally `[ASSUMED]` placeholders pending Phase 5 household-user validation, per plan scope).

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Clean tree type-checks | `npx tsc --noEmit` | exit 0 | ✓ PASS |
| Bad key fails build | scratch `AppCopy.wizard.doesNotExist` + `tsc --noEmit` | TS2339, non-zero | ✓ PASS |
| Dropped arg fails build | scratch `AppCopy.wizard.greeting({})` + `tsc --noEmit` | TS2345, non-zero | ✓ PASS |
| Scratch reverted | `rm` + dir listing | only AppCopy.ts, Glossary.ts, index.ts remain | ✓ PASS |
| Glossary not runtime-wired | grep `Glossary`/`COPY_GLOSSARY` across `src/` | only barrel re-export | ✓ PASS |
| No lookup helper | grep `getCopy` in `src/Common/Copy` | no matches | ✓ PASS |

### Probe Execution

Not applicable — no project probes declared in PLAN/SUMMARY and no `scripts/*/tests/probe-*.sh` relevant to this phase.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| COPY-01 | 01-01-PLAN | Typed `AppCopy` source of truth + derived key union for build-time safety | ✓ SATISFIED | AppCopy.ts as-const module + CopyKey union; bad-key build failure demonstrated (TS2339), dropped-arg (TS2345) |
| COPY-02 | 01-01-PLAN | Glossary enforces one Vietnamese term per concept (no synonym drift) | ✓ SATISFIED | Glossary.ts COPY_GLOSSARY, 5 concepts, one canonical `term` each + `avoid` synonyms |

REQUIREMENTS.md maps exactly COPY-01 and COPY-02 to Phase 1. Both are claimed in PLAN frontmatter (`requirements: [COPY-01, COPY-02]`) and verified. No orphaned requirements.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| (none) | — | — | — | No `TBD`/`FIXME`/`XXX`/`TODO`/`HACK` debt markers in any phase file. `[ASSUMED]` placeholder annotations in comments are documented, intentional, and scoped to Phase 5 phrasing validation — not stubbed behavior. |

### Human Verification Required

None. This phase produces a compile-time-only typed-constants module fully verifiable via `tsc` and static inspection. The glossary review (success criterion 3's "reviewing it surfaces synonym conflicts") is a Phase 5 activity; the verifiable Phase 1 deliverable — the structured one-term-per-concept artifact — exists and is correct.

### Gaps Summary

No gaps. All six must-have truths are VERIFIED, all three artifacts pass at every level (exist, substantive, wired), all three key links are WIRED, both requirements (COPY-01, COPY-02) are satisfied, and the COPY-01 build gate was empirically reproduced (TS2339 bad key, TS2345 dropped arg) and reverted to a clean tree. The phase goal — a single typed source of truth for Vietnamese copy enforcing consistent terminology — is achieved.

---

_Verified: 2026-06-14_
_Verifier: Claude (gsd-verifier)_
