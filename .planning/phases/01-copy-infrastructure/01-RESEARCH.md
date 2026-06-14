# Phase 1: Copy Infrastructure - Research

**Researched:** 2026-06-14
**Domain:** TypeScript typed-copy module (single-locale Vietnamese), `as const` + derived key-union build-time safety, in-code glossary, ripgrep migration recipe
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** `AppCopy` uses **nested namespaces** (e.g. `AppCopy.wizard.*`, `AppCopy.emptyStates.*`, `AppCopy.common.*`) so it scales cleanly from a few seed strings to ~408 without a flat-key explosion. This supersedes the flat 2-key `COMMON_MESSAGE` precedent (which can be folded into `AppCopy.common` over time).
- **D-02:** Build-time safety via **`as const` + a derived key union**. The object is declared `as const`; a derived type (recursive key-path union or per-namespace typing) makes referencing an unknown key a compile-time error. Type checking already runs on build (`craco.config.js` → `typescript.enableTypeChecking: true`), so a bad key fails the build even though `tsconfig` has `strict: false`.
- **D-03:** Interpolated/dynamic strings are modeled as **functions with named args** — e.g. `(args: { name: string }) => \`...${args.name}...\`` — so dynamic values cannot be silently dropped during migration (a missing arg is a type error). See also D-09.
- **D-04:** The glossary lives as an **in-code constant** (a TS file alongside `AppCopy`), so it travels with the source and is greppable — consistent with the existing `src/Common/Constants` convention.
- **D-05:** The glossary is a **review reference only** — it documents the canonical Vietnamese term per concept (one term per concept, no synonym drift) but is NOT wired into runtime or enforced by tooling. Reviewing it before rewording (Phase 5) surfaces synonym conflicts.
- **D-06:** This phase seeds **wizard + empty-states + common actions** namespaces. Enough for the upcoming wizard (Phase 4) and friendly empty-states to be authored through `AppCopy` from day one, without attempting the full app-wide string set (Phase 5).
- **D-07:** Screens read copy via **direct object access** (e.g. `AppCopy.wizard.title`) — no hook, no provider, no runtime indirection.
- **D-08:** Later phases locate un-migrated inline strings via a **documented grep recipe** (a ripgrep pattern for Vietnamese-diacritic string literals in JSX). The recipe lives with the module/glossary docs so Phase 5 has a repeatable migration entry point.
- **D-09:** Interpolated-string functions are **plain TS functions** (arrow/function returning a template literal with named-arg object), not a templating library or token-replacement helper.

### Claude's Discretion

- Exact file layout under `src/Common/Copy/` (single file vs per-namespace files), the precise name of the derived key-union type, and the exact ripgrep pattern in the migration recipe are left to planning/implementation, as long as they satisfy D-01..D-09.
- Whether to migrate the existing `COMMON_MESSAGE` two keys into `AppCopy.common` now or leave them for Phase 5 — implementer's call (low stakes).

### Deferred Ideas (OUT OF SCOPE)

- App-wide migration of inline strings to `AppCopy` — Phase 5 (COPY-03), enabled by the grep recipe seeded here.
- Native Vietnamese phrasing/tone validation with a target household user — Phase 5 (COPY-04).
- Friendly empty-state copy rollout across all modules — Phase 5 (COPY-05); only the empty-states *namespace scaffold* is seeded here.
- Folding `COMMON_MESSAGE` callsites into `AppCopy.common` app-wide — Phase 5 (the constant itself may be generalized now, but callsite migration is later).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| COPY-01 | A single typed copy module (`AppCopy`) is the source of truth for user-facing Vietnamese strings, with a derived key union for build-time safety | Verified `as const` + recursive `CopyPath` key-path union; empirically confirmed a bad key fails `tsc` under `strict: false` (see Build Verification). Functions-with-named-args pattern verified for interpolated strings (D-03). |
| COPY-02 | A glossary enforces one Vietnamese term per concept (no synonym drift across screens) | In-code glossary constant pattern (D-04/D-05) co-located with `AppCopy`, greppable, review-only. Seed term set drawn from research microcopy (`nhà mình`, `nhé`, `Hôm nay ăn gì?`, `Bữa hôm nay`). |
</phase_requirements>

## Summary

This phase is a **zero-dependency, well-established pattern** with a clear in-repo precedent (`src/Common/Constants/CommonMessage.ts`). The work is to generalize that single-object precedent into a nested-namespace `AppCopy` module typed `as const`, derive a compile-time key-union so a bad key fails the build, model interpolated strings as named-arg functions, ship a review-only glossary constant, and document a ripgrep migration recipe. No packages are installed, so there is no package-legitimacy audit and no environment availability concern beyond the TypeScript toolchain already present.

The critical technical question — *does a derived key-union actually fail the build under `tsconfig` `strict: false`?* — was verified empirically this session with the repo's exact TypeScript version (4.9.5). The answer is **yes**: a recursive key-path (`CopyPath`) union, plain object property access, and named-arg function signatures all surface as hard `tsc` errors regardless of `strict`. The `strict` flag governs null/undefined and implicit-any behavior, not property-existence (TS2339) or argument-count/shape (TS2345) or literal-assignability (TS2322) checks — those are always on. Because `craco.config.js` sets `typescript.enableTypeChecking: true`, the production `build` runs the same checker, so any of these errors fails the build.

**Primary recommendation:** Single file `src/Common/Copy/AppCopy.ts` exporting `AppCopy` (`as const`, nested `common`/`wizard`/`emptyStates`) plus a derived `CopyKey` type; a sibling `src/Common/Copy/Glossary.ts` exporting a review-only `COPY_GLOSSARY` constant; a sibling `src/Common/Copy/index.ts` barrel so screens import from `@common/Copy`. Document the ripgrep recipe in a header comment in the barrel (or a co-located `MIGRATION.md` if the planner prefers a doc). Access is direct object access (D-07) — no `CopyKey`-based lookup function is needed for screens; the `CopyKey` type exists to *prove* build-time safety and to type any future helper.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Vietnamese user-facing copy storage | Shared module (`src/Common/Copy`) | — | Cross-cutting infrastructure consumed by every screen; `src/Common` is the codebase's home for cross-cutting code (STRUCTURE.md). |
| Build-time key safety | TypeScript compiler (build step) | — | `craco` `enableTypeChecking: true` runs `tsc` on build; the derived union is a pure type-level construct with zero runtime cost. |
| Interpolation of dynamic values | Module (plain TS functions) | Calling screen | Functions co-located in `AppCopy` own the template; the screen supplies named args. No runtime templating tier. |
| Terminology consistency (glossary) | Module (review-only constant) | Human reviewer (Phase 5) | Not runtime-enforced (D-05); it is a documentation artifact that lives in-code to stay greppable and version-controlled. |
| Migration discovery (un-migrated strings) | Developer tooling (ripgrep recipe) | — | A documented command, not code; lives with the module docs for Phase 5 (D-08). |

**Why this matters:** Copy is a Common-tier concern accessed directly by every UI screen (D-07). Misassigning it to a runtime provider/context (the i18next instinct) would add a tier this single-locale app does not need — explicitly rejected in STACK.md. Keeping it a plain typed constant keeps the responsibility in the compiler + module tiers with zero runtime indirection.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 4.9.5 (installed) | `as const` assertions + `keyof`/template-literal key-path types for the derived `CopyKey` union | Already the project compiler; const assertions and template-literal types are fully supported in 4.9. No install. `[VERIFIED: tsc --version → 4.9.5]` |
| (no new dependency) | — | The entire phase is plain TS source | STACK.md headline: add nothing; a typed `const` object is the right tool for a single locale. `[CITED: .planning/research/STACK.md]` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ripgrep (`rg`) | 14.1.1 (installed on dev machine) | Migration-discovery recipe to locate un-migrated inline Vietnamese strings | Phase 5 migration entry point; recipe documented this phase (D-08). `[VERIFIED: rg --version → 14.1.1]` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Typed `as const` module | `i18next` + `react-i18next` | Multi-locale is explicitly out of scope. Adds a provider, async namespace loading, and untyped JSON — pure overhead with no payoff for a single Vietnamese locale. `[CITED: .planning/research/STACK.md]` |
| Recursive key-path `CopyKey` union | Per-namespace `keyof typeof AppCopy.wizard` unions | Per-namespace is simpler to read but does not give one app-wide key type and is more boilerplate as namespaces grow. Recursive key-path is one type covering all namespaces and was verified to fail the build on bad keys. Either satisfies D-02; recursive is recommended. |
| Single `AppCopy.ts` file | Per-namespace files + barrel | Single file is the better fit for the *seed* scope (3 small namespaces) and matches the single-object-export precedent. Per-namespace files become worth it only when each namespace is large (Phase 5 may split). Discretion per CONTEXT.md. |

**Installation:**
```bash
# NOTHING to install — plain TypeScript source under src/Common/Copy/.
```

**Version verification:**
- `tsc --version` → `Version 4.9.5` `[VERIFIED]`
- `rg --version` → `ripgrep 14.1.1 (rev 2a41ca974b)` `[VERIFIED]`

## Package Legitimacy Audit

Not applicable — this phase installs **no external packages**. All code is plain TypeScript source consuming the already-present TypeScript compiler. No registry verification, postinstall-script check, or legitimacy gate is needed.

## Architecture Patterns

### System Architecture Diagram

```
                   ┌─────────────────────────────────────────────┐
   author copy →   │  src/Common/Copy/AppCopy.ts                  │
                   │    export const AppCopy = { ... } as const   │
                   │    common.*  wizard.*  emptyStates.*         │
                   │    (plain strings + named-arg functions)     │
                   │    export type CopyKey = CopyPath<...>       │ ── type-only ──┐
                   └───────────────┬─────────────────────────────┘                │
                                   │ barrel re-export                              │
                   ┌───────────────▼─────────────────────────────┐                │
                   │  src/Common/Copy/index.ts  (@common/Copy)    │                │
                   └───────────────┬─────────────────────────────┘                │
                                   │ direct object access (D-07)                   │
        ┌──────────────────────────┼───────────────────────────────┐              │
        ▼                          ▼                                ▼              │
  Wizard screens            Empty-state screens             Shared UI/toasts       │
  AppCopy.wizard.title      AppCopy.emptyStates.noDishes    AppCopy.common.save    │
  AppCopy.wizard.greeting({name})                                                  │
        │                                                                          │
        └────────────────────── consumed at build by ─────────────────────────────┘
                                   ▼
                   ┌─────────────────────────────────────────────┐
                   │  craco build → tsc (enableTypeChecking:true) │
                   │  bad key → TS2339/TS2322 ; dropped arg →      │
                   │  TS2345 ⇒ BUILD FAILS                         │
                   └─────────────────────────────────────────────┘

   review only (NOT in data flow):
   src/Common/Copy/Glossary.ts → COPY_GLOSSARY (one term per concept; greppable)
   docs: ripgrep recipe (Phase 5 migration discovery)
```

### Recommended Project Structure
```
src/Common/Copy/
├── AppCopy.ts      # export const AppCopy = {...} as const; export type CopyKey
├── Glossary.ts     # export const COPY_GLOSSARY = {...} as const (review-only)
└── index.ts        # barrel: re-export AppCopy, CopyKey, COPY_GLOSSARY; ripgrep recipe in header comment
```
Imported as `import { AppCopy } from "@common/Copy"`. Note: the `@common/*` alias maps to `src/Common/*` in **both** `tsconfig.json` and `craco.config.js` (kept in sync). `@common/Copy` resolves to `src/Common/Copy/index.ts`. `[VERIFIED: tsconfig.json + craco.config.js read this session]`

### Pattern 1: `as const` nested object + recursive key-path union (D-01, D-02)
**What:** Declare the copy object `as const` and derive a dot-notation key-path union covering every namespace.
**When to use:** This is the spine of the module. The `CopyKey` type proves build-time safety (COPY-01) and types any future lookup helper. Screens themselves use direct access (D-07) and do not need `CopyKey` at the call site.
**Example (verified to compile under `strict: false` with tsc 4.9.5 this session):**
```typescript
// Source: verified empirically this session (tsc 4.9.5, strict:false)
export const AppCopy = {
  common: {
    save: "Lưu",
    cancel: "Hủy",
  },
  wizard: {
    title: "Hôm nay ăn gì?",
    greeting: (args: { name: string }) => `Chào ${args.name}, nhà mình ăn gì nhỉ?`,
  },
  emptyStates: {
    noDishes: "Chưa có món nào — thêm món đầu tiên nhé",
  },
} as const;

// Recursive key-path union (dot notation). Functions are treated as leaves.
type Primitive = string | number | boolean | ((...args: any[]) => any);
type CopyPath<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends Primitive
    ? `${Prefix}${K}`
    : `${Prefix}${K}` | CopyPath<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type CopyKey = CopyPath<typeof AppCopy>;
// CopyKey = "common" | "common.save" | "common.cancel" | "wizard" | "wizard.title"
//         | "wizard.greeting" | "emptyStates" | "emptyStates.noDishes"
```
Note: this variant also includes the namespace prefixes themselves (e.g. `"common"`) as members. If the planner wants leaf-only keys, drop the `\`${Prefix}${K}\` |` branch in the non-primitive arm. Both compile; leaf-only is marginally stricter. Per-namespace `keyof typeof AppCopy.wizard` is the simpler alternative if a single recursive type is judged over-engineered for the seed scope.

### Pattern 2: Interpolated strings as named-arg functions (D-03, D-09)
**What:** Any string with a dynamic value is a plain arrow function taking a single named-arg object and returning a template literal. They coexist with plain string keys under the same object because the `Primitive` branch in `CopyPath` treats a function as a leaf (same as a string).
**When to use:** Whenever copy embeds a runtime value (a name, a count, a dish title). Never inline the interpolation at the call site — that reintroduces the drop-the-binding risk Pitfall 3 warns about.
**Example (verified: dropping the arg is a hard error this session):**
```typescript
// Source: verified empirically this session
greeting: (args: { name: string }) => `Chào ${args.name}, nhà mình ăn gì nhỉ?`
// Call site:
AppCopy.wizard.greeting({ name: householdName }); // OK
AppCopy.wizard.greeting({});                       // TS2345: Property 'name' is missing
```
Typing catches a dropped/missing arg because the parameter object is required and its members are required. This is the mechanism behind Success Criterion 2 ("dynamic values cannot be dropped during migration").

### Pattern 3: In-code review-only glossary (D-04, D-05)
**What:** A sibling constant documenting the canonical Vietnamese term per concept, with optional banned synonyms, so a reviewer can diff terminology before the Phase 5 wording pass. Not imported by runtime code.
**When to use:** Authoring/reviewing copy. It is a documentation artifact in TS form so it is greppable and version-controlled alongside `AppCopy`.
**Example:**
```typescript
// Source: pattern derived from CONVENTIONS.md (SCREAMING_SNAKE module constant)
// Review reference only — NOT wired into runtime (D-05).
export const COPY_GLOSSARY = {
  // concept: { canonical Vietnamese term, synonyms to avoid, note }
  todaysMeal: { term: "Bữa hôm nay", avoid: ["Bữa ăn hôm nay", "Bữa ăn"], note: "nav + screens + toasts must agree" },
  dish:       { term: "Món",        avoid: ["Món ăn (in lists)"],          note: "" },
  addAction:  { term: "Thêm",       avoid: ["Tạo mới", "Thêm mới"],         note: "" },
  skip:       { term: "Tùy bạn",    avoid: ["Bỏ qua", "Bất kỳ"],            note: "wizard skip framing (Pitfall 1)" },
  heroPrompt: { term: "Hôm nay ăn gì?", avoid: [],                          note: "Home hero CTA" },
} as const;
```
Term seeds are illustrative (carried from research microcopy) and to be validated with a household user in Phase 5 — they are `[ASSUMED]` content, not locked phrasing.

### Anti-Patterns to Avoid
- **Runtime key-lookup function for screens:** `getCopy(key: CopyKey)` adds indirection that contradicts D-07 (direct object access). The `CopyKey` type's job is build-time proof, not runtime dispatch.
- **Inline interpolation at the call site:** `` `Chào ${name}` `` written in JSX instead of `AppCopy.wizard.greeting({ name })` reintroduces dropped-binding risk (Pitfall 3c).
- **Rewording while relocating in the same edit:** Phase 5 must migrate mechanically (extract → reference) first, then reword against the single file (Pitfall 3).
- **Adding i18next / a provider / a context:** Out of scope; single locale (STACK.md "What NOT to Use").
- **Enums for key sets:** CONVENTIONS.md prefers union string-literal types over enums.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Build-time key safety | A custom runtime validator / test that asserts keys exist | The derived `CopyKey` union + `tsc` (already on via craco) | The compiler already does this for free at build; a runtime check is slower and weaker. Verified this session. |
| Interpolation | A token-replacement helper (`format("Chào {name}", {name})`) | Plain named-arg functions (D-09) | Functions give compile-time arg checking; a string-token helper loses it (the token is just a string). |
| Terminology enforcement | A lint rule / runtime check on the glossary | A review-only constant (D-05) | One-term-per-concept is a human review concern this milestone; tooling enforcement is out of scope. |
| Locating inline strings | A bespoke AST script | The documented ripgrep recipe (D-08) | `rg --pcre2` with a Vietnamese-diacritic class is sufficient and repeatable; verified to match 62 files / 2490 candidate lines. |

**Key insight:** Everything this phase needs already exists in the toolchain. The only "build" is plain TS source plus a type; the compiler and ripgrep do the rest.

## Common Pitfalls

### Pitfall 1: Assuming `strict: false` disables key-existence checking
**What goes wrong:** A planner or implementer assumes that because `tsconfig` has `strict: false`, a typo'd key or dropped arg won't fail the build, and adds a redundant runtime guard "to be safe."
**Why it happens:** Conflating `strict` (null/undefined + implicit-any behavior) with the always-on property-existence and argument checks.
**How to avoid:** Rely on the compiler. Verified this session: typo'd property access → **TS2339**, bad `CopyKey` literal → **TS2322**, dropped function arg → **TS2345**, all under `strict: false` with tsc 4.9.5. No runtime guard needed.
**Warning signs:** A task proposes a runtime "key exists" test or a `getCopy` wrapper for safety.

### Pitfall 2: `craco` build skips type errors
**What goes wrong:** Someone assumes `react-scripts`/`craco` only type-checks in `tsc` but emits anyway, so a bad key ships.
**Why it happens:** CRA dev server is lenient with type errors (warnings, not failures) in *watch* mode.
**How to avoid:** `craco.config.js` sets `typescript.enableTypeChecking: true`, and the production `build` script (`craco build`) fails on type errors via `ForkTsCheckerWebpackPlugin`. The build-verification task must run the **production build** (or `tsc --noEmit`), not just the dev server, to prove the gate.
**Warning signs:** A verification step only starts the dev server and eyeballs the screen.

### Pitfall 3 (carried from research): Copy pass breaks JSX / synonym drift
**What goes wrong:** Phase 5 hand-edits ~408 inline strings, causing JSX syntax breakage, terminology drift, and dropped interpolations.
**Why it happens:** No central module, no single review surface.
**How to avoid (this phase's contribution):** Ship `AppCopy` (single review surface) + glossary (one term per concept) + interpolation-as-functions (bindings preserved) + ripgrep recipe (mechanical discovery) so Phase 5 migrates mechanically then rewords. `[CITED: .planning/research/PITFALLS.md Pitfall 3]`
**Warning signs:** This phase's seed namespaces don't cover what Phase 4 wizard / empty-states actually need, forcing inline strings anyway.

## Code Examples

### Build-time failure proof (the deliverable's exit criterion)
```bash
# Source: verified this session. Add a deliberately wrong key reference, then:
npx tsc --noEmit          # fails with TS2339 / TS2322 / TS2345
# or the full production build, which runs the same checker:
npm run build             # craco build → ForkTsCheckerWebpackPlugin fails the build
```
Observed errors this session (deliberate bad references against the verified pattern):
```
bad1.ts(2,34): error TS2339: Property 'saev' does not exist on type '{ readonly save: "Lưu"; readonly cancel: "Hủy"; }'.
bad2.ts(2,7):  error TS2322: Type '"wizard.nonexistent"' is not assignable to type 'CopyKey'.
bad3.ts(2,43): error TS2345: Argument of type '{}' is not assignable to parameter of type '{ name: string; }'.
```

### Ripgrep migration recipe (D-08) — verified this session
```bash
# List files containing user-facing Vietnamese-diacritic string literals across
# the Phase 5 migration targets. --pcre2 for the character class; double-quoted literals.
rg -l --pcre2 \
  '"[^"]*[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ][^"]*"' \
  src/Modules src/Routing/MasterPage.tsx
# Verified: matches 62 files. Drop -l and add -n to see individual lines (~2490 candidate lines).
# Note: matches double-quoted literals (dominant in src/ per CONVENTIONS.md). For full coverage,
# Phase 5 should also run a single-quote and JSX-text variant; double-quote is the primary pass.
```
The simpler diacritic-presence form `rg -l --pcre2 '"[^"]*\p{Script=Latin}[^"]*"'` over-matches English; the explicit Vietnamese class above is tighter. A Unicode-property alternative `\p{M}` (combining marks) misses precomposed Vietnamese characters, so the explicit class is the reliable recipe.

## Runtime State Inventory

This is a **greenfield (additive)** phase — it creates new files under `src/Common/Copy/` and touches no existing runtime state, stored data, services, or registrations. The only existing artifact in scope is `src/Common/Constants/CommonMessage.ts`, and CONTEXT.md leaves migrating its two keys to implementer discretion (low stakes) with callsite migration deferred to Phase 5.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — phase adds source files only; no datastore keys touched. | None |
| Live service config | None — no external service references copy. | None |
| OS-registered state | None. | None |
| Secrets/env vars | None — copy must never embed the GitHub PAT or PIN (see Security Domain). | None |
| Build artifacts | None new; `@common/Copy` resolves via existing alias (no alias change needed). | None |

## Common Pitfalls (seed-coverage note)

The single content risk specific to this phase: **seed namespaces must match downstream needs.** ROADMAP confirms Phase 4 needs wizard copy (`Hôm nay ăn gì?` hero, one-question-per-screen, `Tùy bạn` skip, result/action) and friendly empty-states; Phase 2 needs none (shell extraction is behavior-preserving). Seed `common` (save/cancel/add/back/skip), `wizard` (title/greeting/step prompts/result/addToToday), `emptyStates` (noDishes/noSchedule/noInventory) so Phases 2-4 can write through `AppCopy` from day one (D-06). Exact strings are `[ASSUMED]` placeholders pending Phase 5 user validation; the *structure* is what this phase locks.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Flat 2-key `COMMON_MESSAGE` constant | Nested-namespace `AppCopy` + derived key union | This phase (D-01) | Scales to ~408 strings without flat-key explosion; single review surface. |
| Inline Vietnamese strings in JSX (~408 sites) | Centralized typed module referenced everywhere | Phases 1 (infra) → 5 (migration) | Eliminates synonym drift and dropped interpolations (Pitfall 3). |

**Deprecated/outdated:**
- i18next/react-i18next for this app: rejected — multi-locale out of scope (STACK.md). Do not reintroduce.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Seed Vietnamese microcopy (`Hôm nay ăn gì?`, `Tùy bạn`, `Chưa có món nào — thêm món đầu tiên nhé`, `nhà mình`, `nhé`) is appropriate phrasing | Glossary / seed namespaces | Phrasing reworded in Phase 5 with a household user; structure unaffected. Low risk — these are placeholders by design. |
| A2 | Glossary concept list (todaysMeal, dish, addAction, skip, heroPrompt) covers the near-term terminology conflicts | Glossary | Incomplete glossary surfaces fewer conflicts; additive fix in Phase 5. Low risk. |
| A3 | Double-quoted string literals are the dominant inline-copy form (CONVENTIONS.md says double quotes dominate in `src/`) | Ripgrep recipe | If single-quoted/backtick copy is common in some modules, the recipe under-reports; Phase 5 should run quote variants. Medium-low risk — recipe is a discovery aid, not a gate. |

## Open Questions

1. **Leaf-only vs prefix-inclusive `CopyKey`**
   - What we know: Both compile and both fail on bad keys (verified).
   - What's unclear: Whether the planner wants namespace names (`"common"`) as valid keys.
   - Recommendation: Leaf-only is marginally stricter and more intuitive; default to leaf-only unless a future helper needs namespace tokens. Discretion per CONTEXT.md.

2. **Migrate `COMMON_MESSAGE` now or in Phase 5**
   - What we know: 2 keys, one importer (`MessageProvider.tsx`). CONTEXT.md leaves this to implementer.
   - What's unclear: Whether folding it in now is worth the one callsite edit.
   - Recommendation: Add `AppCopy.common.error`/`.success` now (so the module is the canonical home) but leave the `COMMON_MESSAGE` callsite migration to Phase 5 to avoid scope creep. Low stakes either way.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| TypeScript | Build-time key-union safety (COPY-01) | ✓ | 4.9.5 | — |
| ripgrep (`rg`) | Migration-discovery recipe (D-08) | ✓ | 14.1.1 | `grep -rP` with same class, or VS Code search |
| craco build (`enableTypeChecking`) | Proving bad key fails build (Success Criterion 1) | ✓ | @craco/craco ^7.1.0 | `npx tsc --noEmit` runs the same checks |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None blocking — ripgrep is present; `tsc --noEmit` is a valid alternative to the full build for the verification task.

## Validation Architecture

> `.planning/config.json` was not present this session; treating `nyquist_validation` as enabled (key absent = enabled). However, this phase is a typed-constants module with **no runtime logic to unit-test** — the validation surface is the type-checker itself.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest via `react-scripts test` (CRA preset) — present but repo has ~2 unit tests total |
| Config file | none standalone — CRA/react-scripts default; `eslintConfig` inline in `package.json` |
| Quick run command | `npx tsc --noEmit` (the meaningful check for this phase) |
| Full suite command | `npm run build` (craco build → ForkTsChecker; proves the build gate) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COPY-01 | Valid key references compile | type-check | `npx tsc --noEmit` | ✅ (toolchain) |
| COPY-01 | A deliberately wrong key reference fails the build | type-check (negative) | add bad ref → `npx tsc --noEmit` must exit non-zero → revert | ✅ (toolchain) |
| COPY-01 | Dropped interpolation arg fails the build | type-check (negative) | call a fn-string with `{}` → `npx tsc --noEmit` non-zero → revert | ✅ (toolchain) |
| COPY-02 | Glossary lists one term per concept, greppable | manual review | `rg "COPY_GLOSSARY" src/Common/Copy` | ✅ |

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit`
- **Per wave merge:** `npm run build`
- **Phase gate:** Production build green; negative-key test demonstrated (a bad key fails) then reverted; `import { AppCopy } from "@common/Copy"` resolves.

### Wave 0 Gaps
- None — existing toolchain (tsc + craco) covers all phase verification. No Jest test files are required for a typed-constants module; the negative type-check (deliberate bad key) is the proof of COPY-01 and can be a scripted task (add bad ref → assert build fails → revert) rather than a committed test file.

## Security Domain

> `security_enforcement` config not located this session; treating as enabled. This phase has a narrow, low-risk surface (a strings module), but one concrete content risk applies.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth code in this phase. |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | no | Copy is static authored content, not user input. |
| V6 Cryptography | no | — |
| V7 / Data Protection (secrets in UI) | yes | Never embed the GitHub PAT or admin PIN in any copy string (Pitfall: PITFALLS.md "Security Mistakes" — echoing the stored PAT in copy/error strings). Reference tokens by presence/absence only. |

### Known Threat Patterns for typed-copy module

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Secret leakage via copy/error/empty-state strings (PAT, PIN) | Information Disclosure | Author copy that never interpolates or hardcodes a token/PIN value; the glossary review should flag any concept that references credentials. `[CITED: .planning/research/PITFALLS.md]` |

## Sources

### Primary (HIGH confidence)
- Empirical verification this session (tsc 4.9.5, `strict:false`): `as const` + recursive `CopyPath` union; confirmed TS2339 (typo'd access), TS2322 (bad `CopyKey` literal), TS2345 (dropped fn arg) all fail compilation. `[VERIFIED]`
- `tsconfig.json`, `craco.config.js`, `package.json` (read this session): `strict:false`, `target es5`, `enableTypeChecking:true`, `@common/*` alias in both configs, no copy dependency. `[VERIFIED]`
- `src/Common/Constants/CommonMessage.ts`, import-site grep (`MessageProvider.tsx`), `src/Common/` directory listing — precedent + import convention. `[VERIFIED]`
- ripgrep recipe run this session: 62 files / ~2490 candidate lines across `src/Modules` + `MasterPage.tsx`. `[VERIFIED: rg 14.1.1]`

### Secondary (MEDIUM confidence)
- `.planning/research/STACK.md`, `.planning/research/SUMMARY.md`, `.planning/research/PITFALLS.md`, `.planning/codebase/CONVENTIONS.md`, `.planning/codebase/STRUCTURE.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md` — typed-strings recommendation, conventions, pitfalls, phase needs. `[CITED]`

### Tertiary (LOW confidence)
- Vietnamese microcopy phrasing (`nhà mình`, `nhé`, `Tùy bạn`, etc.) — illustrative seeds, to validate with a household user in Phase 5. `[ASSUMED]`

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new deps; toolchain versions verified.
- Architecture: HIGH — pattern verified empirically against the repo's exact compiler and config.
- Build-time safety claim: HIGH — three failure modes reproduced this session under `strict:false`.
- Pitfalls: HIGH — carried from codebase-verified research + verified type-check behavior.
- Seed copy content: LOW — placeholder Vietnamese phrasing pending Phase 5 user validation.

**Research date:** 2026-06-14
**Valid until:** 2026-07-14 (stable — plain TS pattern, fixed toolchain; no fast-moving dependency)
