# Phase 3: Wizard State Slice - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-15
**Phase:** 03-wizard-state-slice
**Areas discussed:** Answer shape, Step & resume model, Session lifecycle, DishScorer test depth

---

## Answer Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Typed fields only | A fixed typed object — one named field per known wizard question. Rigid; adding a step later requires a slice change. | |
| Hybrid: typed known fields + extensible | Typed fields for the questions Phase 4 already knows about, plus an extensible bag for later steps without a slice rewrite. | ✓ |
| Generic answer bag | `Record<stepKey, value>` with no typing — maximally flexible, no compile-time safety. | |

**User's choice:** Hybrid: typed known fields + extensible
**Notes:** The result step feeds the existing DishSuggester — `scoreCookNow` takes a `HouseholdPreferenceProfile` + selected ingredient IDs. Typed fields keep that hand-off type-safe while the extensible portion absorbs future steps (deferred WIZ2-* differentiators) without reshaping the persisted blob.

---

## Step & Resume Model

| Option | Description | Selected |
|--------|-------------|----------|
| Numeric index | Track the current step as an integer index into a step array. Index meaning drifts if step order changes. | |
| String step key + status | Track the current step as a stable string key plus a session status field (idle/in-progress/complete). | ✓ |
| Derived from answers | No explicit step pointer — infer current step from which answers are filled. | |

**User's choice:** String step key + status
**Notes:** Stable string keys survive step reordering across Phase 4 iterations (a numeric index would silently resume to the wrong screen). The status field cleanly separates "never started" / "mid-flow" / "finished" for the resume-on-mount decision.

---

## Session Lifecycle (reset vs. resume)

| Option | Description | Selected |
|--------|-------------|----------|
| Always fresh on entry | Each entry into the wizard clears prior answers. Defeats the persistence goal. | |
| Resume in-progress, explicit restart only | An in-progress session resumes from its last committed step on mount; answers only clear on explicit restart or after completion. | ✓ |
| Time-based expiry | Resume only if the session is recent; expire stale sessions automatically. | |

**User's choice:** Resume in-progress, explicit restart only
**Notes:** Directly serves WIZ-06 + success criteria 2/3 — a forced reload (Gist sync / SW update) mid-flow must preserve prior answers and resume from the last committed step. No silent expiry; the user (Phase 4 UI) owns the explicit restart affordance.

---

## DishScorer Characterization Test Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Smoke only | Pin one method (`score`) with a minimal case. Cheapest, weakest regression net. | |
| All 5 methods, golden fixtures | Characterize all 3 scoring methods (`score`, `scoreWithInventory`, `scoreCookNow`) + both grouping methods (`group`, `groupCookNow`) against shared golden fixtures. | ✓ |
| Score methods only | Cover the 3 scoring methods but skip the grouping/threshold logic. | |

**User's choice:** All 5 methods, golden fixtures
**Notes:** Success criterion 4 requires pinning current output so later changes (Phase 4 wizard feeding the suggester) can't silently regress suggestions. The grouping methods carry the score-bucket thresholds the wizard result step depends on, so they're in scope. Golden fixtures (shared dish/ingredient/inventory inputs + captured output snapshots) make the pins legible and regenerable.

---

## Claude's Discretion

- Exact slice filename / location under `src/Store/Reducers/` and the model type location under `src/Store/Models/` (follow existing per-domain conventions).
- The precise typed field set for known wizard answers and the action-creator surface (per-step commit actions vs. a single upsert) — shape to the planner's reading of Phase 4 needs.
- Selector names and granularity in `src/Store/Selectors.ts`.
- Test framework mechanics for golden fixtures (snapshot vs. inline expected values) and fixture file layout, consistent with the existing `CookingSessionReducer.test.ts` setup.
- Whether the extensible answer portion is a typed `Record` keyed by step or a discriminated structure.

## Deferred Ideas

- WIZ2-01..05 differentiator steps (portions, fridge filter, inline shopping, remembered defaults, "why this dish") — Phase 6 / v2; the extensible answer shape leaves room for them but they are NOT built here.
- Wizard UI / step screens, hero entry, skippable-step defaults — Phase 4 (WIZ-01..05, WIZ-07, NAV-*).
- "Time/effort" wizard step (nấu nhanh/nấu kỹ) — deferred (blocked on dish time/effort attribute).
