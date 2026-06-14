---
phase: 01-copy-infrastructure
reviewed: 2026-06-14T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - src/Common/Copy/AppCopy.ts
  - src/Common/Copy/Glossary.ts
  - src/Common/Copy/index.ts
findings:
  critical: 0
  warning: 1
  info: 2
  total: 3
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-06-14
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Reviewed the typed Vietnamese copy foundation: a static `as const` copy object, a review-only glossary, and a barrel. The implementation is low-risk static data plus a type-level dot-path union. Test cases were compiled against the project's real `tsconfig.json` to verify the build-time-safety claims in the file headers (D-01..D-09).

Most claims hold under the project's `strict: false` config: typo'd keys fail (property access on `as const`), a dropped interpolation arg fails with a missing-property error, and namespace tokens are excluded from `CopyKey` while function leaves are included. No secrets are present, and the barrel has no name collisions.

The one substantive gap: because the project runs `strict: false` (strictNullChecks off), the interpolation functions accept `undefined`/`null` for their named args without a compile error, and they perform no manual guard — so a missing dynamic value renders as the literal string "undefined" in user-facing Vietnamese copy. CONVENTIONS.md explicitly calls for manual null guards in this situation.

## Warnings

### WR-01: Interpolation functions render "undefined"/"null" when args are nullish (strict:false gap)

**File:** `src/Common/Copy/AppCopy.ts:33` and `src/Common/Copy/AppCopy.ts:38`
**Issue:** `greeting` and `addedToToday` interpolate `args.name` / `args.dishName` directly into the template with no guard. The file header (D-03, D-09) leans on the type system to catch dropped values. A dropped (omitted) property does error — verified. But the project's `tsconfig.json` sets `strict: false`, so `strictNullChecks` is off, and `AppCopy.wizard.greeting({ name: undefined })` compiles cleanly. At runtime that produces "Chào undefined, nhà mình ăn gì nhỉ?" shown to the user. CONVENTIONS.md states: "Strict-null checks are not enforced by the compiler, so guard manually." These functions do not guard manually.
**Fix:** Add a lightweight runtime guard (or a fallback) so nullish input degrades gracefully rather than printing "undefined":
```ts
greeting: (args: { name: string }) =>
    `Chào ${args.name ?? "nhà mình"}, nhà mình ăn gì nhỉ?`,
addedToToday: (args: { dishName: string }) =>
    `Đã thêm ${args.dishName ?? "món"} vào hôm nay`,
```
Alternatively, enable `strictNullChecks` for this module's contract — but that is a project-wide config decision, so the inline guard is the lower-risk fix.

## Info

### IN-01: `any` in the `Primitive` function-leaf type

**File:** `src/Common/Copy/AppCopy.ts:48`
**Issue:** `Primitive` uses `((...args: any[]) => any)` to match interpolation functions as leaves. This is type-level only and is a reasonable structural match for "any function leaf," and `any` is tolerated elsewhere in the codebase per CONVENTIONS.md. Noting for completeness; not a defect.
**Fix:** Optional — no change needed. If tightening is desired later, `(...args: never[]) => unknown` matches arbitrary functions while avoiding `any`.

### IN-02: `CopyKey` export is currently unused at runtime — by design

**File:** `src/Common/Copy/AppCopy.ts:59`
**Issue:** `CopyKey` is exported but not consumed anywhere yet. This is intentional per the file headers (build-time proof and a type for any future lookup helper; D-02, D-07) and should NOT be treated as removable dead code.
**Fix:** None. Keep as-is; it is intentional infrastructure.

---

_Reviewed: 2026-06-14_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
