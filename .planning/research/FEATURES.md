# Feature Research

**Domain:** UX/journey patterns for a local-first household meal-planning PWA ("what to cook tonight") aimed at Vietnamese home cooks
**Researched:** 2026-06-14
**Confidence:** MEDIUM

> **Scope note.** This milestone is a **UI/UX refactor of existing capability**, not new domains. Every item below is a *journey/interaction pattern* layered over features that already ship (Dishes, Ingredient, ShoppingList, ScheduledMeal, DishSuggester, Home, CookingSession). Nothing here proposes a new domain feature. "Complexity" is rated for *this codebase* (React 18 + RTK + Ant Design 5, shell in `MasterPage.tsx`, forms via `SmartForm`).
>
> **Source/confidence caveat.** Live web search and fetch were unavailable in this run, so competitor-by-competitor citations could not be captured. Findings rest on well-established, slow-moving UX patterns (guided wizards, first-run onboarding, microcopy/empty-state conventions, mobile-first interaction). Treat the *pattern guidance* as HIGH confidence and the *competitor-specific* claims as LOW until verified. See Sources + Gaps.

## Feature Landscape

### Table Stakes (Users Expect These)

The guided "decide what to cook" journey fails without these. They are the minimum for a first-timer to reach a planned meal unaided.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Single obvious entry point** ("Hôm nay ăn gì?" / "What do we eat today?") on Home | First-timers must not have to guess which admin screen starts the journey. One hero button beats six menu items. | LOW | Add a primary CTA to `Home` module that launches the wizard route. Reuses existing `DishSuggester` underneath. |
| **Step-by-step wizard with one decision per screen** | Phone-first users can't parse a dense form. One question per step = lower cognitive load, higher completion. | MEDIUM | New wizard screen(s) in a module (e.g. extend `DishSuggester` or `ScheduledMeal`). Each step is a thin UI over existing selectors; no new state domain. |
| **Visible progress + back navigation** | Users need to know "how many steps left" and to undo a choice without losing the flow. | LOW | Ant Design `Steps`/progress dots + per-step local state. Back must not reset earlier answers. |
| **Sensible defaults / skippable steps** | A tired cook wants to reach a result in 2 taps. Every step must have a "skip / no preference" path. | LOW | Each input optional; wizard produces a result even with zero answers (falls back to current `DishSuggester` behavior). |
| **A concrete result the user can act on** (a suggested dish → "Add to today's meals") | The journey only succeeds if it ends in a *scheduled meal*, not a list to ponder. | MEDIUM | Wire wizard result → existing `ScheduledMeal` add action. This is the success metric ("reach a planned meal"). |
| **Empty states that teach, not scold** | First run, every list is empty. "No data" looks broken; "Chưa có món nào — thêm món đầu tiên nhé" invites action. | LOW | App-wide empty-state copy pass using Ant Design `Empty` with custom description + primary action. |
| **Friendly, familiar Vietnamese labels (no English/jargon)** | "Inventory", "Schedule", "Suggester" read as admin software. Home cooks expect kitchen language. | MEDIUM (breadth) | App-wide copy pass across all modules + nav. High effort = surface area, not difficulty. See Vietnamese microcopy section below. |
| **Mobile-first touch targets & layout** | It's a phone-first PWA. Tap targets, bottom-reachable CTAs, no hover-only affordances. | MEDIUM | Audit `MasterPage` shell + wizard. Primary action within thumb reach; min 44px targets. |
| **Resume / don't-lose-progress on a multi-step flow** | Mobile users get interrupted. Re-opening shouldn't dump them back at step 1 with answers gone. | MEDIUM | Hold wizard answers in component/RTK transient state; survive route changes within the flow. Full persistence across app restart is a differentiator, not table stakes. |
| **Clear confirmation after the action** | "Đã thêm vào bữa hôm nay" closes the loop so the user knows they succeeded. | LOW | Reuse existing `Message` toast provider + a result screen state. |

### Differentiators (Make It Feel Delightful/Intuitive)

Not required for the journey to work, but these turn "admin tool" into "friendly kitchen helper" — directly serving the Core Value.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **"Who's eating?" step driving portions** | Cooking for 2 vs 6 changes everything; asking up front feels personal and tunes the suggestion. | MEDIUM | Reuse `normalizeHouseholdMembers` / household config already in state. Step pre-fills from saved household, editable per session. |
| **"What's in the fridge?" quick-pick step** | Suggesting dishes you can cook *now* (using on-hand ingredients) is the magic moment vs a generic recipe list. | MEDIUM | Read existing inventory/`Ingredient` state; filter `DishSuggester` candidates by available ingredients. No new domain — a new *lens* on existing data. |
| **"How much time / how lazy today?" step** | Maps to real home-cook mood ("nấu nhanh" vs "nấu kỹ"). Feels human, not like a database query. | LOW-MEDIUM | Needs a time/effort attribute on dishes; if absent, derive a coarse proxy or make it a soft filter. Flag for requirements. |
| **Conversational, encouraging microcopy** | Wizard prompts phrased as a friendly question ("Nhà mình mấy người ăn?") not field labels make it feel guided. | LOW | Copy work, biggest perceived-quality lever per effort. |
| **One-tap "Bất kỳ / Tùy bạn" (surprise me) at every step** | Decision fatigue is the core problem; letting the app decide is a feature, not a fallback. | LOW | Same as skip, but framed positively as a deliberate choice. |
| **Result with light reasoning** ("Gợi ý vì nhà còn đủ nguyên liệu") | A one-line "why" builds trust in the suggestion and teaches how the app thinks. | LOW-MEDIUM | Surface which inputs drove the match. Cheap if the filter already knows. |
| **Smooth step transitions / momentum** | Subtle forward animation signals progress and makes a multi-step flow feel fast rather than tedious. | LOW | CSS/AntD motion; keep light for PWA perf. |
| **Inline "add to shopping list" when an ingredient is missing** | If the chosen dish needs something not on hand, offering to add it bridges plan → shop seamlessly. | MEDIUM | Connects wizard result to existing `ShoppingList` add. Reframe, not new domain. |
| **Remember last session's answers as defaults** | Households cook in patterns; pre-filling yesterday's "who's eating" shaves taps daily. | MEDIUM | Persist last-used wizard inputs in `personal` root. Respect the offline-first persist contract. |

### Anti-Features (Over-Engineering for a Single-Household Local App)

Things that look like good meal-planning features but are wrong for a *single-household, local-first, no-backend* app. Documenting to prevent scope creep.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Account login / user profiles in the wizard** | Big meal-planning apps have accounts. | App is explicitly local-first, PIN-only, no backend (PROJECT out-of-scope). Adds friction that *defeats* the "reach a meal without help" goal. | Use device-local household config already in state. No auth in the journey. |
| **AI/LLM chat to "ask what to cook"** | Trendy, feels smart. | Heavy, needs network (breaks offline-first), unpredictable for a fixed household catalog, large effort vs a 3-step picker. | A deterministic guided wizard over the existing `DishSuggester` is faster, offline, and predictable. |
| **Nutrition tracking / calorie counting steps** | Common in Western meal apps. | Out of scope (no such domain exists), wrong cultural fit, balloons the wizard, demands data the app doesn't have. | Leave out entirely. Keep the journey about *deciding*, not measuring. |
| **Multi-week meal calendar / batch planning in the wizard** | "Plan the whole week!" sounds powerful. | The hero journey is *tonight*. Weekly planning is a different, heavier flow; bundling it bloats the first-run path and hurts mobile. | Keep wizard = "what to cook now → schedule it." Existing `ScheduledMeal` already covers planning ahead separately. |
| **Social / sharing / community recipes** | Recipe apps often have feeds. | Single household, no backend, no audience. Pure complexity, zero value here. | None. Sharing already exists narrowly via admin publish/Gist backup — don't surface it in the cook journey. |
| **Onboarding tour with multi-slide carousel before first use** | "Teach the user the app." | Intro carousels are widely skipped/ignored; they delay the user from the goal. | Teach *in context*: helpful empty states + the wizard itself is the tutorial. Maybe one optional tip on the hero button. |
| **Configurable wizard (user reorders/adds steps)** | Power-user flexibility. | Single household doesn't need it; settings UI is admin-feel, the exact thing we're removing. | Opinionated fixed step order chosen by good defaults. |
| **Mandatory full ingredient inventory before suggesting** | "Need data to suggest." | Forcing data entry up front is the #1 first-run drop-off. The fridge step must be optional. | Suggest from the whole catalog by default; the fridge filter is an optional enhancement step. |
| **Highly granular per-step validation / error gating** | Form-builder instinct. | Blocking progress on a *preference* wizard is hostile; nothing here is truly required. | Every step skippable; never block forward motion on a non-critical input. |

## Anatomy of the Guided "Decide What to Cook" Wizard

Recommended step order (each step: one question, big options, a skip/"tùy bạn" path, visible progress, back enabled):

```
Step 0  Hero entry on Home: "Hôm nay ăn gì?" → launches wizard
Step 1  Ai ăn? (Who's eating / how many)      [pre-filled from household, skippable]
Step 2  Nấu nhanh hay nấu kỹ? (Time / effort)  [skippable — differentiator]
Step 3  Trong bếp có gì? (What's on hand)       [optional filter — differentiator]
        (optional) Kiểu món / vị (cuisine/type) [skippable, only if catalog supports it]
Step 4  Kết quả: suggested dish(es) + one-line "why"
Step 5  Action: "Thêm vào bữa hôm nay" → ScheduledMeal
        + optional "Thiếu nguyên liệu? Thêm vào đi chợ" → ShoppingList
Done    Confirmation toast + clear next step (view today's meals)
```

Design rules that make it work for first-timers on mobile:
- **Result reachable from step 1.** If the user skips everything, step 1 → result must still produce a dish.
- **Forward is always one tap.** Defaults pre-selected; "Tiếp tục / Tùy bạn" always available.
- **Primary CTA in thumb zone** (bottom), back/skip secondary.
- **The wizard is the tutorial.** No separate onboarding tour needed.

## Onboarding / First-Run Patterns (Get to First Success Fast)

| Pattern | Use here? | Notes |
|---------|-----------|-------|
| Single hero CTA as the "start" | **Yes — table stakes** | The first-run path *is* the meal wizard. |
| Helpful empty states with action | **Yes — table stakes** | Every empty list teaches the next step. |
| Contextual coachmark on the hero button (1 tip max) | Optional differentiator | Only if testing shows users miss the entry point. |
| Pre-seeded sample household / defaults | Differentiator | Reduces the "blank app" problem on first open. |
| Progress persistence within the flow | Table stakes | Don't lose answers on interruption. |
| Multi-slide intro carousel | **Anti-feature** | Skipped, delays the goal. |
| Forced data entry before value | **Anti-feature** | #1 drop-off cause; keep inputs optional. |

## Vietnamese Microcopy / Labeling Conventions

Shift from administrative to kitchen-familiar language across all modules. Examples (illustrative, validate with a native target user):

| Current admin-feel | Friendlier home-cook framing |
|--------------------|------------------------------|
| "Dishes" / module label | "Món ăn" |
| "Ingredient" / "Inventory" | "Nguyên liệu" / "Trong bếp" |
| "Shopping List" | "Đi chợ" / "Cần mua" |
| "Scheduled Meal" | "Bữa ăn" / "Bữa hôm nay" |
| "Dish Suggester" | "Hôm nay ăn gì?" |
| "No data" / empty | "Chưa có gì ở đây — thêm cái đầu tiên nhé" |
| "Submit" / "Save" | "Xong" / "Lưu lại" |
| "Add to schedule" | "Thêm vào bữa hôm nay" |

Conventions:
- Prefer **questions and verbs** the cook would say aloud over noun labels ("Hôm nay ăn gì?" not "Suggestions").
- **Address the user warmly** ("nhà mình", "nhé") — natural, not corporate.
- **Empty states invite**, never report failure.
- **No leftover English or technical jargon** in any user-facing string (incl. errors, toasts, button labels, nav).
- Keep terms **consistent** across nav, screens, and toasts (one word per concept).

## Feature Dependencies

```
[Friendly Vietnamese copy pass] ──enables──> [All journey patterns feel coherent]

[Guided wizard]
    └──requires──> [Single hero entry point on Home]
    └──requires──> [Existing DishSuggester logic]
    └──ends in───> [ScheduledMeal add]  (success metric)
    └──enhanced by─> ["Who's eating" step]   (needs household config)
    └──enhanced by─> ["Fridge" filter step]  (needs Ingredient/inventory state)
    └──enhanced by─> ["Time/effort" step]    (needs effort attribute on dishes ← may be missing)
    └──enhanced by─> [Inline add-to-shopping] (needs ShoppingList add)

[Empty-state copy] ──enhances──> [First-run success]
[Remember last answers] ──enhances──> [Wizard]  (needs personal persist root)

[Mobile-first shell audit] ──conflicts──> [Oversized MasterPage.tsx]  (refactor pressure)
```

### Dependency Notes
- **Wizard requires a hero entry point:** without one obvious launch on Home, first-timers never find the flow.
- **Wizard must end in ScheduledMeal:** the named success signal is "reach a *planned* meal," so the action step is non-negotiable.
- **"Time/effort" step depends on a dish attribute that may not exist:** flag for requirements — if dishes carry no effort/time data, this step is deferred or uses a proxy.
- **Copy pass is cross-cutting and gates perceived quality:** it touches every module + the shell; sequence it so wizard screens are written in the new voice from the start (avoid double work).
- **Mobile audit collides with `MasterPage.tsx` (>1300 lines):** journey + responsiveness work will pressure the shell; expect extraction of `CookingPill` / `BottomTabNavigator` (see codebase CONCERNS).

## MVP Definition

### Launch With (v1) — the hero journey
- [ ] Single hero entry on Home ("Hôm nay ăn gì?") — without it the journey is undiscoverable
- [ ] Step-by-step wizard (one question/screen, progress, back, skip) over existing `DishSuggester` — the core reframe
- [ ] Result → "Thêm vào bữa hôm nay" (ScheduledMeal add) — the success metric
- [ ] Friendly Vietnamese copy + inviting empty states across the journey screens — the "not admin" feel
- [ ] Mobile-first layout for the wizard (thumb-zone CTA, touch targets) — phone-first requirement
- [ ] In-flow progress preservation — don't lose answers on interruption

### Add After Validation (v1.x)
- [ ] "Who's eating?" portion step — once household config is comfortably wired
- [ ] "What's in the fridge?" filter step — once inventory-driven filtering is validated
- [ ] Inline "add missing ingredient to Đi chợ" — after the plan→shop bridge tests well
- [ ] Remember last session's answers — after the base flow is stable
- [ ] One-line "why this dish" reasoning — when filter inputs are exposed

### Future Consideration (v2+)
- [ ] "Time/effort" step — defer until dishes carry effort/time data
- [ ] Optional cuisine/type step — only if the catalog supports meaningful categories
- [ ] Contextual coachmark on hero button — only if usability testing shows users miss it

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Hero entry point on Home | HIGH | LOW | P1 |
| Step-by-step wizard over DishSuggester | HIGH | MEDIUM | P1 |
| Result → ScheduledMeal add | HIGH | MEDIUM | P1 |
| Friendly Vietnamese copy + empty states | HIGH | MEDIUM | P1 |
| Mobile-first wizard layout | HIGH | MEDIUM | P1 |
| In-flow progress preservation | MEDIUM | MEDIUM | P1 |
| "Who's eating?" step | MEDIUM | MEDIUM | P2 |
| "What's in the fridge?" filter | HIGH | MEDIUM | P2 |
| Inline add-to-shopping | MEDIUM | MEDIUM | P2 |
| Remember last answers | MEDIUM | MEDIUM | P2 |
| "Why this dish" reasoning | MEDIUM | LOW | P2 |
| "Time/effort" step | MEDIUM | MEDIUM (blocked on data) | P3 |
| Cuisine/type step | LOW | LOW | P3 |
| Coachmark on hero | LOW | LOW | P3 |

**Priority key:** P1 = must have for launch · P2 = should have, add when possible · P3 = nice to have / future.

## Competitor Feature Analysis

Live competitor research could not be captured this run (web tools unavailable). The patterns below reflect commonly observed conventions in consumer meal-planning apps and should be **verified** before being treated as authoritative.

| Pattern | Common in consumer meal apps | Our approach |
|---------|------------------------------|--------------|
| "What should I cook?" guided picker | Frequently a multi-filter screen or quiz | One-question-per-step wizard, fully skippable, offline |
| Cook-with-what-you-have | Premium/differentiator feature | Optional fridge filter over existing inventory |
| Onboarding | Often multi-slide carousel | In-context: empty states + wizard *is* the tutorial |
| Accounts/cloud sync | Standard | Out of scope — local-first, PIN only |
| AI chat assistant | Emerging trend | Deliberate anti-feature here (offline, deterministic catalog) |

## Sources

- Established UX pattern knowledge: guided/wizard flow design, first-run onboarding, microcopy and empty-state conventions, mobile-first interaction (e.g. Nielsen Norman Group guidance on wizards, onboarding, and empty states). *Confidence: HIGH for pattern guidance.*
- Project + codebase context: `.planning/PROJECT.md`, `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`. *Confidence: HIGH.*
- Competitor-specific claims: **NOT verified this run** — live web search/fetch were unavailable. *Confidence: LOW; verify before relying.*

## Gaps to Address (need verification or phase research)
- **Live competitor review** of "what to cook" apps (step inventories, result framing) — couldn't fetch; do a targeted pass when web tools are available.
- **Native Vietnamese copy validation** — the microcopy table is illustrative; confirm phrasing/tone with a target household user.
- **Dish effort/time data** — does the `Dishes` model carry a time or effort attribute? Determines whether the "nấu nhanh/nấu kỹ" step is v1.x or v2+.
- **Fridge-filter feasibility** — confirm inventory state granularity supports "can cook now" filtering of `DishSuggester` candidates.

---
*Feature research for: UX/journey refactor of an existing Vietnamese household meal-planning PWA*
*Researched: 2026-06-14*
