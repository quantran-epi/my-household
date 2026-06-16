# Phase 5: Mobile Tuning & Copy Rollout - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-16
**Phase:** 5-Mobile Tuning & Copy Rollout
**Areas discussed:** Copy migration breadth, Vietnamese voice & validation, Mobile tuning scope & strategy, Bottom-sheet adoption scope

---

## Copy Migration Breadth (COPY-03)

| Option | Description | Selected |
|--------|-------------|----------|
| Journey + high-traffic | Migrate wizard journey + the most-used screens (Home, nav, suggester, scheduled meals, shopping list) — not all 71 files | ✓ |
| App-wide (all 566 strings) | Migrate every inline Vietnamese string across all 71 files this phase | |
| Journey only | Migrate only the wizard/MealPlanning screens | |

**User's choice:** Journey + high-traffic
**Notes:** COPY-03 as written says "no remaining hardcoded user-facing strings," but migrating all 566 strings across 71 files in one phase is high-risk churn. User chose the pragmatic middle: journey + high-traffic screens. This narrows COPY-03's literal "no remaining" wording — recorded as a deliberate scope decision (D-01). Remaining low-traffic strings deferred.

---

## Vietnamese Voice & Validation (COPY-04)

| Option | Description | Selected |
|--------|-------------|----------|
| I review & you adjust | Claude drafts natural Vietnamese; user reviews and flags anything off; Claude adjusts | ✓ |
| You decide, I trust it | Claude finalizes phrasing without a review loop | |
| I provide exact wording | User supplies the exact strings | |

**User's choice:** I review & you adjust
**Notes:** AppCopy strings are currently `[ASSUMED]` placeholders (per the AppCopy.ts header comment). User is the local Vietnamese household member — the right validator. Review loop on the drafted copy before locking (D-03).

---

## Mobile Tuning Scope & Strategy (MOB-01, MOB-02, MOB-04)

| Option | Description | Selected |
|--------|-------------|----------|
| Journey + worst offenders | Phone-first tuning on journey screens + the worst-fitting high-traffic screens | ✓ |
| Journey screens only | Tune only the wizard/MealPlanning screens (REQUIREMENTS' literal scope) | |
| Every screen | Full phone-first pass across all ~71 files | |

**User's choice:** Journey + worst offenders (breadth); "don't care about desktop at all" (desktop constraint)
**Notes:** User said "every screen needs to be best for mobile, I don't use this app for desktop." Intent is phone-first everywhere, consistent with the PROJECT vision. But full layout tuning of ~71 files is too large for one phase, so breadth lands on journey + worst offenders (D-04). Separately, desktop is no longer a constraint — user does not use desktop. This effectively retires MOB-04 ("desktop intact") as written — recorded as a deliberate requirement change, not silent drift (D-06).

---

## Bottom-Sheet Adoption Scope (MOB-03)

| Option | Description | Selected |
|--------|-------------|----------|
| App-wide picker sweep | Swap pickers/confirmations across the app to `@components/Sheet` | ✓ |
| Journey pickers only | Only the wizard's in-step pickers | |
| Journey + high-traffic pickers | Wizard + the most-used screen pickers | |

**User's choice:** App-wide picker sweep
**Notes:** A picker→Sheet swap is mechanical and low-risk, so doing it everywhere is cheap — coherent with the narrower layout-tuning scope (D-05). Tension noted and resolved: layout tuning is focused (higher effort), bottom-sheet swap is broad (low effort).

---

## Claude's Discretion

- Which specific screens count as "high-traffic" for copy migration and "worst offenders" for mobile tuning (planner picks the concrete list against the inline-string counts and screen usage).
- The phone-first layout mechanics (thumb-zone CTA placement, ~44px target sizing approach, breakpoint/responsive idiom — no central one exists today).
- Whether to expand AppCopy namespaces or add new ones during migration.
- The exact picker/confirmation inventory for the bottom-sheet sweep.

## Deferred Ideas

- Remaining low-traffic inline strings not migrated this phase (the tail of the 566 across 71 files) → future copy-cleanup pass.
- Full phone-first layout tuning of every screen beyond journey + worst offenders → future mobile pass if validated.
- Pre-existing tech debt surfaced during scout (dual date libs moment+dayjs, `strict: false`, oversized files, baked-in secrets) → not this phase; tracked in CONCERNS.md.
