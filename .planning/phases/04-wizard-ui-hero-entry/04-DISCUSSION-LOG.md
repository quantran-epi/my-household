# Phase 4: Wizard UI & Hero Entry - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-16
**Phase:** 04-wizard-ui-hero-entry
**Areas discussed:** Wizard surface & nav entry, Wizard question set & order, Result step & add-to-meal, Home hero & dashboard reframe

---

## Wizard surface & nav entry

| Option | Description | Selected |
|--------|-------------|----------|
| Full route + Sheet pickers | Wizard is its own full route; per-step pickers/confirmations use the `@components/Sheet` bottom sheet | ✓ |
| In-place modal (like existing suggester) | Host the wizard inside a modal/overlay the way `DishSuggesterScreen` opens today | |

**User's choice:** Full route + Sheet pickers
**Notes:** Bottom-nav center "Nấu gì?" routes into the wizard route; the existing in-place `DishSuggesterScreen` stays reachable (NAV-04). Required behaviors (one question per screen, visible progress, back action, resume-on-reload) hold regardless of surface.

---

## Wizard question set & order

| Option | Description | Selected |
|--------|-------------|----------|
| Lean: ingredients → preference → result | Two question steps then result; minimal v1 path | ✓ |
| Richer multi-step | More preference granularity across several steps | |

**User's choice:** Lean: ingredients → preference → result
**Notes:** Portions step (WIZ2-01), fridge/inventory filter (WIZ2-02), and time/effort step are explicitly deferred (v2 / out of scope) — not wizard steps in Phase 4. Every step skippable with a "Tùy bạn" default.

---

## Result step & add-to-meal

| Option | Description | Selected |
|--------|-------------|----------|
| Top few ranked | Present a small ranked set of suggestions | ✓ |
| Single best dish | Show only the single top-scored dish | |

**User's choice (count):** Top few ranked

| Option | Description | Selected |
|--------|-------------|----------|
| Today only | Chosen dish adds to today's meals only | |
| Allow add to today or specific other day | Default today, but user can pick another date | ✓ |

**User's choice (add target):** Allow add to today or a specific other day (defaults to today)

| Option | Description | Selected |
|--------|-------------|----------|
| Route to "add first dish" | On an empty catalog, route the user to add their first dish | ✓ |
| Inline empty message | Show an inline empty-state message only | |

**User's choice (empty/no-match):** Route to "add your first dish" on an empty catalog; non-empty no-match falls back to the full catalog (WIZ-04).

---

## Home hero & dashboard reframe

| Option | Description | Selected |
|--------|-------------|----------|
| Replace hero as top CTA | "Hôm nay ăn gì?" becomes the top hero CTA on Home | ✓ |
| Add as secondary entry | Add the entry without replacing the existing hero | |

**User's choice (hero):** Replace hero as top CTA

| Option | Description | Selected |
|--------|-------------|----------|
| Entry points only | Reframe primary entry points; leave deeper screen content as-is | ✓ |
| Deeper screen-by-screen reframe | Reframe admin-style screen internals too | |

**User's choice (reframe scope):** Entry points only — deeper screen-by-screen copy/reframe is Phase 5.

## Claude's Discretion

- Exact wizard route path and step-key values (seeded by Phase 3; Phase 4 owns the final set).
- Concrete layout of the "top few" result list and the day-picker affordance.
- Hero visual treatment and how reframed entry points are styled on Home.
- Which `Sheet`-hosted pickers each step uses.

## Deferred Ideas

- Portions / "who's eating?" step → Phase 6 (WIZ2-01).
- Fridge / "can cook now" inventory filter → Phase 6 (WIZ2-02).
- Inline "add missing ingredient to Đi chợ", remembered defaults, "why this dish" reasoning → Phase 6 (WIZ2-03..05).
- Time/effort ("nấu nhanh/nấu kỹ") step → deferred, blocked on dish attribute.
- App-wide copy migration and deeper screen reframe → Phase 5 (COPY-03..05).
- Mobile/phone-first tuning of the journey → Phase 5 (MOB-01..04).
