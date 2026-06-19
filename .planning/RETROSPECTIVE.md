# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — UI/UX Refactor

**Shipped:** 2026-06-19
**Phases:** 6 | **Plans:** 27 | **Tasks:** 63 | **Commits:** 197

### What Was Built
- Typed `AppCopy` Vietnamese copy module — build-gated `CopyKey` union, named-arg interpolation, review-only glossary (476 keys at close).
- Crash-contained, decomposed shell — top-level error boundary + `MasterPage.tsx` (1366 lines) split into `src/Routing/Shell/` pieces, proven behavior-identical by an e2e baseline.
- Resume-safe wizard state — RTK slice under the existing `personal` persist root, selector-only reads, DishScorer characterization tests.
- Guided "Hôm nay ăn gì?" journey — Home hero CTA → skippable one-question-per-screen wizard → scheduled meal, with a cold-start E2E proving a first-timer reaches a meal from empty data.
- Phone-first polish + high-traffic copy migration — thumb-zone CTAs, ~44px touch targets, `@components/Sheet` bottom-sheet pattern, friendly empty-states.
- v2 differentiators (Phase 6) — remembered defaults, skippable servings/member step, optional cook-now grouping with one-line reasons, inline add-missing-ingredient to Đi chợ.

### What Worked
- Front-loading two zero-dependency foundations (typed copy, then shell safety) before screen work — every later phase was written in the new voice on a stable base, avoiding double-edits.
- Separating "pure move, verified identical" from behavior change during the shell extraction — the unchanged e2e baseline gave a trustworthy FND-02 identity proof.
- Characterization/golden tests pinning DishScorer output before wiring the wizard result kept suggestion behavior from silently regressing.
- Keeping wizard state under the existing persist root (no new root) preserved local user data while making the UI reload-safe.

### What Was Inefficient
- The REQUIREMENTS.md traceability table drifted out of sync — 8 requirements stayed marked "Pending" despite their phases completing, requiring reconciliation at milestone close.
- Native-speaker Vietnamese copy tone review was deferred as follow-up UAT rather than gated inline, leaving the milestone's "reads natural" success metric only automated-verified.
- A cluster of late quality items (5 debug sessions, Phase 03/06 UAT, Phase 02/04/06 human verification) accumulated unresolved and were carried as tech debt at close rather than burned down during execution.

### Patterns Established
- Typed copy source of truth with a build-gated key union — a bad key is a compile error, not a runtime surprise.
- Bottom-sheet (`@components/Sheet` over antd `Drawer placement="bottom"`) as the standard phone-first picker/confirmation pattern, replacing imperative `Modal.confirm`.
- Wizard state lives under `personal` and is read only through `selectWizard*` selectors with defensive defaults.

### Key Lessons
1. Update the requirements traceability table at each phase transition, not at milestone close — drift makes the close gate noisy and erodes trust in the "complete" signal.
2. When a success metric depends on human judgment (copy tone), decide up front whether it gates the milestone; deferring it to UAT means shipping without that metric proven.
3. Foundation-first sequencing (copy, then shell safety) pays off — it removed an entire class of rework that would have come from rewording screens twice or destabilizing the shell mid-journey.

### Cost Observations
- Model mix: predominantly opus (quality model profile configured).
- Notable: wave-based parallelization across plans within phases (config `parallelization: true`) kept multi-plan phases moving.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 6 | 27 | First GSD-tracked milestone; foundation-first sequencing established |

### Cumulative Quality

| Milestone | Phases Complete | Deferred Items at Close |
|-----------|-----------------|-------------------------|
| v1.0 | 6/6 | 10 (5 debug, 2 UAT, 3 verification) |

### Top Lessons (Verified Across Milestones)

1. Keep requirements traceability current at phase boundaries, not at close. *(v1.0 — watch for confirmation in v2)*
2. Foundation-first sequencing reduces rework. *(v1.0 — watch for confirmation in v2)*
