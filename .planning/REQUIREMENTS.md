# Requirements: my-household (UI/UX Refactor Milestone)

**Defined:** 2026-06-14
**Core Value:** A local Vietnamese household member can open the app and go from "what do we eat?" to a planned meal quickly, in familiar language, without it feeling like an admin tool.

## v1 Requirements

Requirements for this UI/UX refactor milestone. Each maps to roadmap phases. This milestone reframes existing capability — it does not add new domains.

### Copy & Language

- [x] **COPY-01**: A single typed copy module (`AppCopy`) is the source of truth for user-facing Vietnamese strings, with a derived key union for build-time safety
- [x] **COPY-02**: A glossary enforces one Vietnamese term per concept (no synonym drift across screens)
- [ ] **COPY-03**: Inline user-facing strings across modules and navigation are migrated to reference `AppCopy`
- [ ] **COPY-04**: All user-facing labels and descriptions read natural to a local Vietnamese user — no English or technical-jargon leftovers
- [ ] **COPY-05**: Journey screens show inviting, friendly empty-states instead of blank or technical messages

### Guided Wizard (Meal Planning)

- [ ] **WIZ-01**: Home shows one obvious hero entry to start meal planning ("Hôm nay ăn gì?")
- [ ] **WIZ-02**: Meal planning runs as a step-by-step wizard — one question per screen, visible progress, and a back action
- [ ] **WIZ-03**: Every wizard step is skippable with a sensible default ("Tùy bạn")
- [ ] **WIZ-04**: The result step always yields at least one actionable dish suggestion, even on cold-start/empty data (falls back to full catalog, or routes to "add your first dish" if the catalog is empty)
- [ ] **WIZ-05**: From the result, the user can add the chosen dish to today's meals (`addScheduledMeal`)
- [ ] **WIZ-06**: Wizard answers persist per step and resume after reload or interruption (survives the app's sync/service-worker reload)
- [ ] **WIZ-07**: A first-time user with empty data can reach a scheduled meal unaided

### Navigation & Reframe

- [ ] **NAV-01**: Primary entry points are reframed from admin-style screens to a guided journey (ask-and-answer)
- [ ] **NAV-02**: Every route reachable before the refactor remains reachable afterward (within ~3 taps or via search)
- [ ] **NAV-03**: Global search continues to reach all features
- [ ] **NAV-04**: The bottom-nav center action routes into the guided meal-planning journey while keeping the existing suggester reachable

### Mobile (Phone-First)

- [ ] **MOB-01**: Journey screens use a phone-first layout with primary CTAs in the thumb zone
- [ ] **MOB-02**: Interactive controls in the journey meet ~44px touch-target sizing
- [ ] **MOB-03**: Pickers and confirmations use a bottom-sheet pattern (`@components/Sheet` over antd `Drawer placement="bottom"`)
- [ ] **MOB-04**: Desktop layout remains intact — mobile changes do not regress the desktop experience

### Foundation & Safety

- [ ] **FND-01**: A top-level error boundary prevents a shell crash from white-screening the whole app
- [ ] **FND-02**: Shell pieces (bottom-tab navigator, cooking pill, data backup) are extracted from `MasterPage.tsx` with behavior verified identical
- [ ] **FND-03**: Wizard state lives in an RTK slice under the existing `personal` persisted root, read via selectors (no raw state access, no new persisted root)

## v2 Requirements

Differentiators to add after the base journey is validated. Tracked but not in this milestone's roadmap.

### Wizard Enhancements

- **WIZ2-01**: "Who's eating?" portion step (reuses household config)
- **WIZ2-02**: "What's in the fridge?" optional inventory filter ("can cook now")
- **WIZ2-03**: Inline "add missing ingredient to Đi chợ" from the result
- **WIZ2-04**: Remember last session's answers as defaults
- **WIZ2-05**: One-line "why this dish" reasoning on suggestions

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Backend / user accounts | App is intentionally local-first; auth is a client-side PIN only |
| Tech-stack replacement (React/RTK/Ant Design) | Refactor is UX/copy-led, not a rewrite |
| New domain features beyond what exists | This milestone reframes existing capability, doesn't add domains |
| Multi-language support beyond Vietnamese | Vietnamese is the sole target audience — typed strings module, not i18next runtime |
| "Time/effort" wizard step ("nấu nhanh/nấu kỹ") | Blocked: depends on a dish time/effort attribute that may not exist; revisit when data confirmed |
| AI/LLM chat, nutrition tracking, multi-week batch planning | Anti-features — break offline-first model and balloon scope |
| Social/sharing, multi-slide intro carousel, configurable wizard | Anti-features — not core to the household journey |

## Traceability

Each v1 requirement maps to exactly one phase. v2 requirements are carried in Phase 6 (deferred, post-validation) and are not counted in v1 coverage.

| Requirement | Phase | Status |
|-------------|-------|--------|
| COPY-01 | Phase 1 | Complete |
| COPY-02 | Phase 1 | Complete |
| FND-01 | Phase 2 | Pending |
| FND-02 | Phase 2 | Pending |
| FND-03 | Phase 3 | Pending |
| WIZ-06 | Phase 3 | Pending |
| WIZ-01 | Phase 4 | Pending |
| WIZ-02 | Phase 4 | Pending |
| WIZ-03 | Phase 4 | Pending |
| WIZ-04 | Phase 4 | Pending |
| WIZ-05 | Phase 4 | Pending |
| WIZ-07 | Phase 4 | Pending |
| NAV-01 | Phase 4 | Pending |
| NAV-02 | Phase 4 | Pending |
| NAV-03 | Phase 4 | Pending |
| NAV-04 | Phase 4 | Pending |
| MOB-01 | Phase 5 | Pending |
| MOB-02 | Phase 5 | Pending |
| MOB-03 | Phase 5 | Pending |
| MOB-04 | Phase 5 | Pending |
| COPY-03 | Phase 5 | Pending |
| COPY-04 | Phase 5 | Pending |
| COPY-05 | Phase 5 | Pending |
| WIZ2-01 | Phase 6 (v2) | Deferred |
| WIZ2-02 | Phase 6 (v2) | Deferred |
| WIZ2-03 | Phase 6 (v2) | Deferred |
| WIZ2-04 | Phase 6 (v2) | Deferred |
| WIZ2-05 | Phase 6 (v2) | Deferred |

**Coverage:**

- v1 requirements: 23 total (COPY ×5, WIZ ×7, NAV ×4, MOB ×4, FND ×3)
- Mapped to phases: 23/23 ✓
- Unmapped: 0
- v2 requirements (deferred to Phase 6): 5

---
*Requirements defined: 2026-06-14*
*Last updated: 2026-06-14 after roadmap creation (traceability populated)*
