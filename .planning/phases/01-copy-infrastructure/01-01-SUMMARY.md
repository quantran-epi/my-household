---
phase: 01-copy-infrastructure
plan: 01
subsystem: ui
tags: [typescript, copy, i18n-alternative, as-const, type-safety, vietnamese]

# Dependency graph
requires: []
provides:
  - "AppCopy typed const module (common/wizard/emptyStates namespaces) at src/Common/Copy/AppCopy.ts"
  - "Derived CopyKey dot-path union (leaf-only) for build-time key safety"
  - "Named-arg interpolation functions (greeting, addedToToday) so dropped args are TS2345 errors"
  - "Review-only COPY_GLOSSARY (one Vietnamese term per concept) at src/Common/Copy/Glossary.ts"
  - "@common/Copy barrel with documented Phase 5 ripgrep migration recipe"
affects: [02-shell-extraction, 04-wizard, 05-copy-migration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "as const nested object + recursive CopyPath<T> dot-path union for compile-time key safety under strict:false"
    - "Interpolated copy modeled as single named-arg arrow functions (D-03/D-09)"
    - "Review-only in-code glossary constant, greppable, never runtime-wired (D-04/D-05)"

key-files:
  created:
    - src/Common/Copy/AppCopy.ts
    - src/Common/Copy/Glossary.ts
    - src/Common/Copy/index.ts
  modified: []

key-decisions:
  - "File layout: single AppCopy.ts (not per-namespace files) — matches seed scope and single-object precedent"
  - "CopyKey variant: leaf-only (dropped namespace-prefix branch) per RESEARCH Open-Q1 — marginally stricter"
  - "COMMON_MESSAGE kept; added AppCopy.common.error/.success as canonical home, callsite migration deferred to Phase 5 (RESEARCH Open-Q2)"

patterns-established:
  - "Direct object access for copy (AppCopy.wizard.heroPrompt) — no getCopy lookup helper, no provider (D-07)"
  - "Ripgrep --pcre2 Vietnamese-diacritic recipe documented in barrel header for Phase 5 migration discovery (D-08)"

requirements-completed: [COPY-01, COPY-02]

# Metrics
duration: 14min
completed: 2026-06-14
---

# Phase 1 Plan 01: Copy Infrastructure Summary

**Typed Vietnamese AppCopy module (common/wizard/emptyStates) with a derived leaf-only CopyKey union, named-arg interpolation functions, a review-only COPY_GLOSSARY, and a @common/Copy barrel carrying the Phase 5 ripgrep migration recipe.**

## Performance

- **Duration:** ~14 min
- **Started:** 2026-06-14
- **Completed:** 2026-06-14
- **Tasks:** 3
- **Files modified:** 3 created

## Accomplishments
- `AppCopy.ts` — single `as const` source of truth with three seeded namespaces (`common`, `wizard`, `emptyStates`), including two named-arg interpolation functions (`greeting`, `addedToToday`), plus a derived leaf-only `CopyKey` dot-path union.
- `Glossary.ts` — review-only `COPY_GLOSSARY` with five concepts (`todaysMeal`, `dish`, `addAction`, `skip`, `heroPrompt`), one canonical Vietnamese `term` each + `avoid` synonyms + `note`. No runtime importers.
- `index.ts` — barrel re-exporting `AppCopy`, `CopyKey`, `COPY_GLOSSARY`, with the documented `rg --pcre2` Vietnamese-diacritic migration recipe in the header comment.
- COPY-01 build gate demonstrated empirically (bad key + dropped arg both fail `tsc`), then reverted — no broken code committed.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create AppCopy.ts (namespaces, as const, named-arg fns, CopyKey)** - `0bb2516` (feat)
2. **Task 2: Create Glossary.ts (review-only COPY_GLOSSARY)** - `930c2db` (feat)
3. **Task 3: Create index.ts barrel + ripgrep recipe + build-gate proof** - `72d6f84` (feat)

## Files Created/Modified
- `src/Common/Copy/AppCopy.ts` - Typed `AppCopy` const (`common`/`wizard`/`emptyStates`) + derived leaf-only `CopyKey` union; zero imports, no default export.
- `src/Common/Copy/Glossary.ts` - Review-only `COPY_GLOSSARY` (one canonical term per concept); not runtime-wired.
- `src/Common/Copy/index.ts` - `@common/Copy` barrel re-exporting AppCopy/CopyKey/COPY_GLOSSARY + Phase 5 ripgrep migration recipe header.

## Decisions Made
- **File layout (Claude's Discretion):** single `AppCopy.ts` rather than per-namespace files — best fit for the 3 small seed namespaces and matches the `CommonMessage.ts` single-object precedent. Phase 5 may split when namespaces grow.
- **CopyKey variant (RESEARCH Open-Q1):** leaf-only union (dropped the `\`${Prefix}${K}\` |` namespace-prefix branch) — marginally stricter and more intuitive; namespace tokens (`"common"`) are not valid keys.
- **COMMON_MESSAGE (RESEARCH Open-Q2):** added `AppCopy.common.error`/`.success` as the canonical home now, but left the existing `COMMON_MESSAGE`/`MessageProvider` callsite untouched — callsite migration is Phase 5, avoiding scope creep.

## COPY-01 Negative-Test Proof
Scratch file `__scratch_negative_test.ts` referenced a non-existent key and called a named-arg function with `{}`, then `npx tsc --noEmit` was run:
- Bad key (`AppCopy.wizard.doesNotExist`) → **TS2339** ("Property 'doesNotExist' does not exist on type ...").
- Dropped arg (`AppCopy.wizard.greeting({})`) → **TS2345** ("Argument of type '{}' is not assignable to parameter of type '{ name: string; }'").

Both errors occurred under `strict: false` (tsc 4.9.5), confirming key-existence and arg-shape checks are always on. The scratch file was deleted; the clean tree passes `npx tsc --noEmit` (exit 0). No broken code committed.

Note: the plan anticipated TS2322 for a bad `CopyKey` literal assignment; the implemented gate exercised direct property access (TS2339) instead, which is the stronger/more representative screen-call-site failure mode. TS2345 for the dropped arg matched exactly.

## Build Verification
- `npx tsc --noEmit` → exit 0 (clean tree) — the meaningful per-task gate.
- `npm run build` (craco, `enableTypeChecking: true`) → **compiles green** (type checker passes). The default `CI=true` invocation fails only on pre-existing eslint warnings in unrelated files (`SmartMealPlanner.screen.tsx`, `ShoppingListEdit.widget.tsx`, `MasterPage.tsx`, etc.) treated as errors — none in `src/Common/Copy`. Running the build without `CI=true` exits 0 ("Compiled with warnings"). The Copy module itself is type-clean and emits no warnings.

## Deviations from Plan

None - plan executed exactly as written. (No Rule 1-4 deviations: no bugs, missing functionality, or blockers in the authored module.)

## Issues Encountered
- **Isolated worktree had no `node_modules`:** `npm run build` initially failed with `Cannot find module @craco/craco` because the worktree is isolated. Verified the build by temporarily symlinking the main repo's `node_modules` (non-destructive), confirming the type checker passes, then removed the symlink. `npx tsc --noEmit` (RESEARCH-documented equivalent gate) passed throughout.
- **Pre-existing eslint warnings fail `CI=true` build:** out of scope (unrelated Modules/Routing files) — logged here, not fixed, per scope-boundary rule. The Copy module compiles clean.
- **Accidental `docs/` deletion during artifact cleanup:** the craco build wrote into the tracked `docs/` GitHub Pages output; a cleanup `rm -rf docs` removed committed files. Immediately restored from git (`git checkout -- docs/`); no `docs/` change is included in any task commit. Verified clean tree before committing Task 3.

## Next Phase Readiness
- `@common/Copy` resolves and is ready: Phases 2-4 can author copy through `AppCopy` from day one (wizard + empty-states namespaces seeded).
- Seed Vietnamese phrasing is `[ASSUMED]` placeholder content pending Phase 5 household-user validation; the structure (namespaces, function shapes, CopyKey, glossary, barrel, alias) is locked.
- Phase 5 has a documented ripgrep entry point for migrating the ~408 inline strings; should also run single-quote/JSX-text variants beyond the double-quote primary pass.
