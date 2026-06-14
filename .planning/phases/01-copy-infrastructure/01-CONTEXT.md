# Phase 1: Copy Infrastructure - Context

**Gathered:** 2026-06-14
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase builds the **copy foundation only**: a single typed `AppCopy` module that becomes the source of truth for user-facing Vietnamese strings, plus a glossary enforcing one term per concept.

**In scope:**
- The `AppCopy` module structure (nested namespaces, `as const`, derived key union for build-time safety)
- Interpolated/dynamic strings modeled as plain TS functions with named args
- An in-code glossary constant (review reference, not enforced tooling)
- Seeding `AppCopy` with the copy needed by upcoming phases: wizard namespace, empty-states namespace, and common/shared actions
- A documented grep recipe so later phases can locate un-migrated inline strings

**Explicitly NOT in scope (later phases):**
- The app-wide migration of the ~408 inline strings → Phase 5 (COPY-03)
- Rewording/validating Vietnamese phrasing with a household user → Phase 5 (COPY-04)
- Wizard UI, shell extraction, mobile work → Phases 2–4

This phase delivers infrastructure that every later screen writes through. Success = the module exists, is type-safe, is seeded with the near-term namespaces, and there's a clear glossary + migration recipe.

</domain>

<decisions>
## Implementation Decisions

### Module Shape & Keys
- **D-01:** `AppCopy` uses **nested namespaces** (e.g. `AppCopy.wizard.*`, `AppCopy.emptyStates.*`, `AppCopy.common.*`) so it scales cleanly from a few seed strings to ~408 without a flat-key explosion. This supersedes the flat 2-key `COMMON_MESSAGE` precedent (which can be folded into `AppCopy.common` over time).
- **D-02:** Build-time safety via **`as const` + a derived key union**. The object is declared `as const`; a derived type (e.g. a recursive key-path union or per-namespace typing) makes referencing an unknown key a compile-time error. Type checking already runs on build (`craco.config.js` → `typescript.enableTypeChecking: true`), so a bad key fails the build even though `tsconfig` has `strict: false`.
- **D-03:** Interpolated/dynamic strings are modeled as **functions with named args** — e.g. `(args: { name: string }) => \`...${args.name}...\`` — so dynamic values cannot be silently dropped during migration (a missing arg is a type error). See also D-09 for implementation style.

### Glossary
- **D-04:** The glossary lives as an **in-code constant** (a TS file alongside `AppCopy`), so it travels with the source and is greppable — consistent with the existing `src/Common/Constants` convention.
- **D-05:** The glossary is a **review reference only** — it documents the canonical Vietnamese term for each concept (one term per concept, no synonym drift) but is NOT wired into runtime or enforced by tooling. Reviewing it before rewording (Phase 5) surfaces synonym conflicts.

### Seed Scope
- **D-06:** This phase seeds **wizard + empty-states + common actions** namespaces. Enough for the upcoming wizard (Phase 4) and friendly empty-states to be authored through `AppCopy` from day one, without attempting the full app-wide string set (that's Phase 5).

### Migration Ergonomics
- **D-07:** Screens read copy via **direct object access** (e.g. `AppCopy.wizard.title`) — no hook, no provider, no runtime indirection. Matches the single-locale, zero-runtime-cost decision.
- **D-08:** Later phases locate un-migrated inline strings via a **documented grep recipe** (e.g. a documented ripgrep pattern for Vietnamese-diacritic string literals in JSX). The recipe lives with the module/glossary docs so Phase 5 has a repeatable migration entry point.
- **D-09:** Interpolated-string functions are **plain TS functions** (arrow/function returning a template literal with named-arg object), not a templating library or token-replacement helper.

### Claude's Discretion
- Exact file layout under `src/Common/Copy/` (single file vs per-namespace files), the precise name of the derived key-union type, and the exact ripgrep pattern in the migration recipe are left to planning/implementation, as long as they satisfy D-01..D-09.
- Whether to migrate the existing `COMMON_MESSAGE` two keys into `AppCopy.common` now or leave them for Phase 5 — implementer's call (low stakes).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Research (this milestone)
- `.planning/research/STACK.md` — typed `as const` strings module recommendation; why NOT i18next/react-i18next (single-locale, out of scope)
- `.planning/research/SUMMARY.md` — Phase 1 rationale (build copy module before rewording to avoid 408-site double-edit), `AppCopy` namespace approach
- `.planning/research/PITFALLS.md` — Pitfall 3 (copy pass breaks JSX / synonym drift at ~408 sites): build module first, keep interpolated strings as functions, one word per concept via glossary

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` — COPY-01 (typed module + derived key union), COPY-02 (glossary, one term per concept); COPY-03/04/05 are Phase 5, NOT this phase
- `.planning/ROADMAP.md` §"Phase 1: Copy Infrastructure" — goal + 3 success criteria

### Codebase conventions & precedent
- `src/Common/Constants/CommonMessage.ts` — existing 2-key Vietnamese string constant; the precedent `AppCopy` generalizes
- `.planning/codebase/CONVENTIONS.md` — naming (PascalCase helper objects, SCREAMING_SNAKE constants), single-object-export pattern, Vietnamese-copy convention, `strict: false` (guard manually), build-time type checking enabled
- `.planning/codebase/STRUCTURE.md` §"Where to Add New Code" — `src/Common/` for cross-cutting infrastructure; path alias `@common/*`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/Common/Constants/CommonMessage.ts` (`COMMON_MESSAGE`): existing centralized-string precedent — `AppCopy` follows the same single-exported-object idea but with nested namespaces + typing.
- `@common/*` path alias (defined in `tsconfig.json` + `craco.config.js`): screens import the new module via an alias, not deep relative paths.

### Established Patterns
- Helper/constant modules export a single PascalCase object with camelCase members (`DateHelpers`, `COMMON_MESSAGE`). `AppCopy` fits this directly.
- Union string-literal types preferred over enums; `as const` + derived unions are idiomatic here.
- Build-time type checking is ON (`craco.config.js`) despite `tsconfig` `strict: false` — so a derived key union genuinely fails the build on a bad key.

### Integration Points
- New module under `src/Common/Copy/` (new dir), exported via `@common/Copy` (or barrel). No store/provider wiring — direct object access (D-07).
- ~408 inline Vietnamese strings live across `src/Modules/**` screens/widgets (Dishes, Ingredient, ShoppingList, ScheduledMeal, DishSuggester, Home) and `src/Routing/MasterPage.tsx` — these are the Phase 5 migration targets the grep recipe (D-08) will locate; not touched this phase.

</code_context>

<specifics>
## Specific Ideas

- Namespace seeds explicitly named: `wizard`, `emptyStates`, `common` (D-06).
- Vietnamese tone references carried from research (illustrative, to validate with a household user in Phase 5): warm/familiar register like "nhà mình", "nhé", hero phrase "Hôm nay ăn gì?".

</specifics>

<deferred>
## Deferred Ideas

- App-wide migration of inline strings to `AppCopy` — Phase 5 (COPY-03), enabled by the grep recipe seeded here.
- Native Vietnamese phrasing/tone validation with a target household user — Phase 5 (COPY-04).
- Friendly empty-state copy rollout across all modules — Phase 5 (COPY-05); only the empty-states *namespace scaffold* is seeded here.
- Folding `COMMON_MESSAGE` callsites into `AppCopy.common` app-wide — Phase 5 (the constant itself may be generalized now, but callsite migration is later).

</deferred>

---

*Phase: 1-Copy Infrastructure*
*Context gathered: 2026-06-14*
