# Phase 1: Copy Infrastructure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-14
**Phase:** 1-Copy Infrastructure
**Areas discussed:** Module shape & keys, Glossary format, Seed scope, Migration ergonomics

---

## Module shape & keys

| Option | Description | Selected |
|--------|-------------|----------|
| Flat object (like COMMON_MESSAGE) | One big key-value object | |
| Nested namespaces | Grouped by domain/screen (e.g. `wizard.result.title`) | ✓ |
| Per-module files | One copy file per feature module | |

**User's choice:** Nested namespaces

| Option | Description | Selected |
|--------|-------------|----------|
| `as const` + derived union | `as const` object, derived key-union type fails build on unknown key | ✓ |
| Runtime validation | Check keys at runtime | |
| No enforcement | Plain object, trust the developer | |

**User's choice:** `as const` + derived union

| Option | Description | Selected |
|--------|-------------|----------|
| Functions with named args | Interpolated strings as functions taking a named-args object | ✓ |
| Template placeholders | `{name}`-style string placeholders replaced at runtime | |
| String concatenation at call site | Build dynamic strings inline where used | |

**User's choice:** Functions with named args

**Notes:** Functions implemented as plain TS functions (no template-engine dependency). Named args prevent dropping/reordering dynamic values during migration.

---

## Glossary format

| Option | Description | Selected |
|--------|-------------|----------|
| In-code constant | Glossary as a TS constant alongside AppCopy | ✓ |
| Markdown doc | Standalone `.md` glossary | |
| Frontmatter/JSON | Structured data file | |

**User's choice:** In-code constant

| Option | Description | Selected |
|--------|-------------|----------|
| Enforced/wired | Copy derives from glossary terms programmatically | |
| Review reference only | Glossary is a human review aid, not wired into copy | ✓ |

**User's choice:** Review reference only

**Notes:** Glossary enforces one Vietnamese term per concept by convention — reviewers check copy against it; no runtime coupling.

---

## Seed scope

| Option | Description | Selected |
|--------|-------------|----------|
| Wizard only | Seed just the meal-planning wizard copy | |
| Wizard + empty-states + common | Seed wizard, empty-state, and common action copy | ✓ |
| Full app | Migrate all ~408 strings now | |

**User's choice:** Wizard + empty-states + common

**Notes:** Foundation phase seeds the namespaces the next phases need (wizard, empty-states, common actions). App-wide migration of remaining inline strings stays in Phase 5 (COPY-03).

---

## Migration ergonomics

| Option | Description | Selected |
|--------|-------------|----------|
| Direct object access | Screens read `AppCopy.wizard.result.title` directly | ✓ |
| Hook (useCopy) | Access copy via a React hook | |
| Helper getter | Access via a lookup function | |

**User's choice:** Direct object access

| Option | Description | Selected |
|--------|-------------|----------|
| Documented grep recipe | A documented grep/ripgrep recipe to find un-migrated inline strings | ✓ |
| Lint rule | Custom ESLint rule to flag inline strings | |
| Manual scan | No tooling, scan by hand | |

**User's choice:** Documented grep recipe

| Option | Description | Selected |
|--------|-------------|----------|
| Plain TS functions | Interpolation functions are plain typed functions | ✓ |
| Template-engine helper | Use a formatting library | |

**User's choice:** Plain TS functions

**Notes:** Direct object access keeps call sites greppable and type-checked. Grep recipe documented so later phases can locate remaining inline Vietnamese strings.

---

## Claude's Discretion

- Exact namespace tree layout and file/folder placement under `src/Common/Copy` (follows the codebase's PascalCase + barrel conventions).
- Specific glossary term choices (subject to native Vietnamese validation flagged for Phase 5).

## Deferred Ideas

None — discussion stayed within phase scope. (App-wide string migration is already scoped to Phase 5; native Vietnamese phrasing validation is tracked as a Phase 5 blocker in STATE.md.)
