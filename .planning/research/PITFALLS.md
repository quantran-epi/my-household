# Pitfalls Research

**Domain:** UI/UX refactor of an existing local-first meal-planning PWA (React 18 + RTK + Ant Design 5) — guided wizard + app-wide Vietnamese copy pass + mobile-first tuning, with a hard "no capability lost" constraint
**Researched:** 2026-06-14
**Confidence:** HIGH (codebase-verified pitfalls); MEDIUM (Vietnamese copy specifics, untested logic risk)

> **Framing.** This is a *refactor* milestone on a working, feature-rich app. The dominant risk class is not "can we build it" — it is **silent regression**: losing reachability of an existing feature, breaking desktop while fixing mobile, or introducing copy inconsistency. The codebase makes this worse in three specific ways the roadmap must respect:
> 1. **~408 user-facing Vietnamese strings are hardcoded inline in JSX** — there is no central strings module (only a 2-key `src/Common/Constants/CommonMessage.ts`). The copy pass touches ~408 edit sites.
> 2. **Zero responsive grid usage app-wide** — no breakpoint handling exists today, so "mobile-first tuning" is net-new behavior layered onto desktop-shaped layouts, not a tweak.
> 3. **Almost no test coverage** (2 unit tests / ~284 files; shallow e2e) — there is no safety net to catch a lost feature or a broken flow automatically.

## Critical Pitfalls

### Pitfall 1: Wizard dead-end — first-timer can't reach a planned meal

**What goes wrong:**
The guided "Hôm nay ăn gì?" wizard is built, looks polished, but a first-time user with an empty app (no inventory, no household config, no dishes scheduled) hits a step that requires data they don't have, or reaches a "result" screen that shows zero suggestions and no escape hatch. The named success criterion — "first-timer reaches a planned meal" — silently fails in exactly the state every new user is in.

**Why it happens:**
The wizard is wired over `DishSuggester` (1280 lines) and/or `SmartMealPlanner` (1997 lines), both of which assume populated inventory/dish data. Developers test with their own seeded data and never exercise the cold-start path. A "fridge filter" or "who's eating" step gets made mandatory because the form-builder instinct is to gate progress. The result step renders an empty `DishSuggester` list instead of a guaranteed fallback dish.

**How to avoid:**
- Make every step skippable with a positively-framed "Tùy bạn / Bất kỳ" path (anti-feature #8/#9 in FEATURES.md: never block forward motion on a preference).
- Guarantee the result step **always** produces at least one actionable suggestion even with zero answers and empty inventory — fall back to the full dish catalog, and if the catalog itself is empty, route to "add your first dish" rather than a dead empty state.
- The success metric is reaching `ScheduledMeal` add — the action step ("Thêm vào bữa hôm nay") is non-negotiable and must wire to the existing `ScheduledMeal` add action.
- Test the wizard against a **freshly wiped IndexedDB** (cold start), not a developer's populated store.

**Warning signs:**
- A step has a "Next" button that stays disabled until input is given.
- The result screen can render an empty list with no primary action.
- QA only ever runs the wizard on an account that already has dishes/inventory.
- No e2e test starts from an empty `personal` persist root.

**Phase to address:**
Wizard-build phase. Add a cold-start e2e spec (empty IndexedDB → wizard → scheduled meal) as the phase's exit criterion.

---

### Pitfall 2: Lost capability — reframed entry points orphan existing features

**What goes wrong:**
Reframing the app "from admin tool to guided journey" means changing/hiding entry points (renaming nav, replacing the Home screen with a hero CTA, folding `DishSuggester`/`SmartMealPlanner` into the wizard). A feature that shipped — editing a dish, managing ingredient units, the cooking session pill, Gist backup/restore, admin publish, dashboard analytics — becomes **unreachable** because its only navigation link was removed or buried. The constraint "no capability lost" is violated not by deleting code but by deleting the *path to it*.

**Why it happens:**
The reframe is visual/navigational, so developers focus on the new happy path and treat the old screens as "still there in the code." Reachability is never enumerated. `MasterPage.tsx` holds the bottom tab nav, sidebar drawer, cooking pill, and global search all in one 1366-line file; editing nav there is fiddly and easy to drop a link. Admin-only and rarely-used flows (publish, restore, unit management) are the first to be forgotten because they don't appear in the hero journey.

**How to avoid:**
- **Before touching navigation, build a reachability inventory:** list every route in `RootRoutes`/module routers and the UI path(s) that reach it. This becomes the regression checklist.
- Reframe = re-label and re-sequence entry points; do **not** remove a route or its sole entry without a replacement path. Admin/power flows can move behind a "More / Khác" surface but must stay reachable.
- Keep global search functional — it is a safety net that keeps features reachable even when nav is reorganized.
- Diff the route table before/after each nav change; every prior route must still resolve.

**Warning signs:**
- A PR changes `MasterPage.tsx` nav arrays without a corresponding "still reachable via X" note.
- The only way to reach a screen was a menu item that's now gone.
- Admin mode, Gist restore, or unit management aren't in the post-refactor click-through test.
- The route count in `RootRoutes` is unchanged but several routes have no inbound link.

**Phase to address:**
Navigation/reframe phase. Exit criterion: a reachability checklist where every pre-refactor route is reachable in ≤3 taps from Home (or via search).

---

### Pitfall 3: Copy pass breaks JSX or introduces inconsistency at ~408 edit sites

**What goes wrong:**
The app-wide Vietnamese copy pass touches ~408 inline strings across every module. Hand-editing strings in JSX introduces (a) syntax breakage — an unescaped quote or brace, a deleted closing tag, a broken template literal; (b) **inconsistency** — the same concept ("Bữa hôm nay" vs "Bữa ăn hôm nay" vs "Bữa ăn") rendered three ways across nav, screen, and toast; and (c) silent loss of interpolated values when a developer "translates" a string that contained `{variable}` and drops the binding.

**Why it happens:**
Strings live inline, so the only way to change them is to touch hundreds of files by hand — high volume, high error rate, no single review surface. There is no central strings module to diff or lint against. Vietnamese diacritics and the warm register ("nhà mình", "nhé") encourage rephrasing that can accidentally mangle JSX expressions. With no type-checking on string keys (strings aren't keys today) and shallow tests, breakage only surfaces at runtime on the specific screen.

**How to avoid:**
- **Establish the centralized typed strings module first** (per STACK.md: `as const` object under `@common`, derived `CopyKey` union). Migrate inline strings into it, then do the wording pass against that single file — turning a 408-site edit into a single-file review where inconsistency is visible and greppable.
- One word per concept: keep a small glossary (the FEATURES.md microcopy table) and reference it so nav/screen/toast agree.
- Migrate mechanically first (extract string → reference), *then* reword — never reword and relocate in the same edit.
- Run the production build (`craco` type-check is on) after each batch; for interpolated strings, keep them as functions `(name) => \`...${name}...\`` so the binding is preserved by the type system.
- Audit for leftover English/jargon with a search pass (Latin-only user-facing strings, "Submit", "Inventory", "Suggester", etc.).

**Warning signs:**
- Copy is being edited directly in `.screen.tsx`/`.widget.tsx` files instead of a strings module.
- The same concept appears with different wording in different files.
- A build error or blank screen appears after a "just text" change.
- Interpolated values render as literal `{count}` or disappear.

**Phase to address:**
A dedicated copy-infrastructure phase (build the strings module + migrate) *before or alongside* the wording pass. Sequence so wizard screens are written in the new voice from the start (avoid double work — noted in FEATURES.md dependencies).

---

### Pitfall 4: Mobile changes silently break desktop (and vice versa)

**What goes wrong:**
"Mobile-first tuning" changes shared layouts, bumps `ConfigProvider` token heights, and introduces bottom-sheet `Drawer`s / responsive `Steps`. Because the same components render on both viewports, a mobile fix (e.g. stacking, larger `controlHeightLG`, hiding desktop chrome) regresses the desktop layout — overlapping elements, oversized controls, a bottom nav that now covers content on wide screens, or a hover-only affordance that no longer works on touch.

**Why it happens:**
The app has **zero responsive grid usage today** — layouts are implicitly desktop-shaped. Adding the *first* responsive behavior means there is no existing breakpoint convention to follow, so each developer invents one. Global token changes (`fontSize` is already 18 app-wide) cascade to every screen. There is no visual regression testing, and the e2e suite is shallow, so desktop breakage isn't caught.

**How to avoid:**
- Treat responsiveness as net-new infrastructure: pick one breakpoint strategy (antd `Grid`/`useBreakpoint`, or a single responsive hook) and apply it consistently rather than ad hoc per screen.
- Prefer token tuning via `ConfigProvider` (`controlHeightLG`, `size="large"` on wizard controls) so local wrappers inherit larger targets — but verify the change on desktop too, since tokens are global.
- Scope mobile-only chrome (bottom nav, bottom `Drawer`) behind explicit breakpoints so it doesn't render/overlap on desktop.
- Test both a phone viewport and a desktop viewport for every layout change; capture a desktop performance/visual baseline before starting (the repo already has `performance-baseline.spec.ts`).

**Warning signs:**
- A global token bump shipped without a desktop screenshot check.
- Bottom-fixed elements overlap content on wide screens.
- Hover-only interactions (Dropdown on hover, tooltips as primary info) remain on touch surfaces.
- "Looks great on my phone" with no desktop verification.

**Phase to address:**
Mobile-first/layout phase. Establish the breakpoint convention as the first task; exit criterion includes desktop-viewport verification of every touched screen.

---

### Pitfall 5: Refactoring the oversized `MasterPage.tsx` (1366 lines) destabilizes the whole shell

**What goes wrong:**
Mobile work and the hero-entry reframe both pressure `MasterPage.tsx`, which holds the header, bottom tab nav, sidebar drawer, cooking pill, global search, and data-backup in one 1366-line file. Extracting `CookingPill` / `BottomTabNavigator` / `DataBackup` (recommended in ARCHITECTURE.md) while *also* changing behavior in the same pass breaks the cooking session indicator, the sync/backup trigger, or navigation — app-wide, since this is the shell every route renders inside.

**Why it happens:**
The file mixes many concerns with shared local state and `useDeferredDrawerTools` timing logic; it imports some `antd` primitives directly (legacy). Refactor-and-change-at-once means a regression can't be isolated to either the move or the behavior change. There's no error boundary (CONCERNS.md), so a shell crash blanks the entire app with no recovery UI. No tests cover the shell.

**How to avoid:**
- **Separate "move" from "change."** First extract `CookingPill`, `BottomTabNavigator`, `DataBackup` as behavior-preserving pure moves (no logic change), verify the app is identical, commit. *Then* change behavior in the extracted, smaller files.
- Add a top-level error boundary (App.tsx / MasterPage) *before* heavy shell surgery so a mistake degrades gracefully instead of white-screening.
- Don't refactor the sync/backup reload coordination as part of UX work — it's fragile timing-based code (see Pitfall 6); leave it untouched unless it's the explicit task.
- Click-through the shell on every change: cooking pill appears during a session, bottom nav navigates, drawer opens, search works, backup triggers.

**Warning signs:**
- A single PR both moves code out of `MasterPage.tsx` and changes its behavior.
- The cooking pill stops appearing, or sync/backup stops triggering, after a shell edit.
- Shell edits land with no manual click-through of pill/nav/drawer/search/backup.

**Phase to address:**
Any phase touching the shell (mobile + reframe). Add an error boundary early; gate shell extraction behind "pure move, verified identical" before behavior changes.

---

### Pitfall 6: Wizard progress wiped by the reload-as-recovery behavior

**What goes wrong:**
The wizard is designed to resume after interruption (a PWA win, per STACK.md — persist answers in the `personal` root). But the app already triggers a **full page reload** after Gist sync/restore and on service-worker update (CONCERNS.md known bug, `useGistBackup.ts`, `MasterPage.tsx:389`, arbitrary 1500ms/900ms timeouts). If a reload fires mid-wizard, in-memory step state and in-progress form input are lost — unless wizard state was committed to the persisted slice *before* the reload.

**Why it happens:**
Wizard answers are held in transient component/`useReducer` state for speed, and only written to the RTK persisted slice "at the end." A background sync or SW update reloads the app between steps. The reload drops in-memory UI state by design (the existing bug), so the half-finished flow vanishes and the user lands back at step 1 — the exact "lose progress" failure FEATURES.md lists as table stakes.

**How to avoid:**
- Persist wizard answers to the `personal` RTK slice **on each step commit**, not only at the end, so a reload rehydrates mid-flow (STACK.md's recommended pattern). New slices are migration-safe (`serializableCheck` off, selectors default missing slices).
- On wizard mount, rehydrate from the slice and resume at the saved step.
- Don't let background sync reload while a wizard is active if avoidable; at minimum ensure resume works after reload.

**Warning signs:**
- Wizard state lives only in `useState`/`useReducer` with no slice write until the final step.
- Re-opening the app mid-flow restarts at step 1.
- A sync/SW-update reload during the flow loses answers.

**Phase to address:**
Wizard-build phase (state design). Verify by triggering a reload mid-flow and confirming resume.

---

### Pitfall 7: Refactoring meal-planning logic with no test net causes silent suggestion regressions

**What goes wrong:**
Wrapping `DishSuggester` / `SmartMealPlanner` (which use `SmartPlannerEngine.ts`, 1391 lines) in a wizard tempts developers to "lightly adjust" the scoring/filtering to fit step inputs. With only 2 unit tests in the repo and none covering helpers (scoring, nutrition, inventory math, `InventoryHelper`/`IngredientUnitHelper` full of `as any` legacy reads), a change quietly degrades suggestion quality or breaks on older persisted inventory shapes — invisibly, because nothing tests it.

**Why it happens:**
The planning logic is embedded in large render components and untested. The fridge-filter step needs to read inventory, which goes through fragile `as any` legacy-shape handling. "It still returns dishes" looks fine in a demo even when scoring is wrong.

**How to avoid:**
- Treat the wizard as a *thin UI over existing selectors* (FEATURES.md): pass answers as inputs, don't rewrite the engine.
- If logic must change, extract the touched pure functions into `Helpers` and add unit tests first (characterization tests pinning current behavior), then change.
- Don't change inventory data shapes during this UX milestone; if reading inventory for the fridge step, use existing helpers as-is.

**Warning signs:**
- Wizard PRs edit `SmartPlannerEngine.ts` or scoring helpers.
- New `as any` casts appear around inventory reads.
- Suggestions "feel different" with no test explaining why.

**Phase to address:**
Wizard-build phase. Gate any engine change behind characterization tests.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Reword copy inline in JSX instead of extracting to a strings module | No upfront infra; "just edit the text" | 408-site sprawl, inconsistency, no single review surface, JSX-breakage risk, re-do next milestone | Never for this milestone — the copy pass is the reason to build the module |
| Hold wizard state only in component memory | Faster to build, fewer slice files | Lost progress on reload/SW-update (existing reload bug); fails "don't lose progress" table stake | Only if the wizard is explicitly ephemeral (it isn't — PWA resume is a goal) |
| Refactor `MasterPage.tsx` and change behavior in one pass | One PR, feels efficient | Can't isolate regressions in the shell every route depends on | Never — separate pure move from behavior change |
| Make a wizard step mandatory to "ensure good input" | Cleaner data | First-run drop-off; first-timer can't reach a meal | Never — every step must be skippable |
| Bump global `ConfigProvider` tokens for mobile without desktop check | Quick touch-target win | Desktop layout regressions cascade everywhere | Only with desktop-viewport verification |
| Skip cold-start / empty-IndexedDB testing | Faster QA | The exact new-user state ships broken | Never — it's the named success path |
| Leave the missing error boundary while reorganizing the shell | Defer the chore | A shell mistake white-screens the whole app, no recovery | Only if shell stays untouched (it won't this milestone) |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| redux-persist (`personal` root) — new wizard slice | Assuming older devices have the slice; reading it without defaults | Add the slice defensively (selectors already default missing slices with `?? {}`); `serializableCheck` is off so it's migration-safe |
| GitHub Gist sync / SW update reload | Building a resumable wizard unaware the app force-reloads (1500ms/900ms timeouts) mid-flow | Persist step answers per-commit; rehydrate + resume on mount; don't add reload coordination to UX work |
| Ant Design version drift | Following antd v6 docs (`orientation`, new height semantics) while the app runs 5.16.1 | Stay on the 5.x API: `Steps` `direction`/`progressDot`/`responsive`, `Drawer` `height`, `placement="bottom"` (STACK.md) |
| antd locale (`viVN`) already wired | Re-adding i18n/locale infra for the copy pass | Locale is set in `App.tsx`; the copy pass is content, not infrastructure — no i18next (out of scope) |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Heavy planning/scoring run inside wizard render (inherits `DishSuggester` in-render computation) | Janky step transitions, slow result step on phones | Push aggregation into `reselect` selectors (already a dep); compute result once on commit, not every render | Noticeable on mid/low-end phones with a large dish catalog |
| Re-rendering the whole wizard on each keystroke/answer | Laggy inputs on mobile | Keep step state local per step; commit to slice on step advance, not on every change | Larger forms / slower devices |
| Shipping heavy screens (recharts analytics, full module) into the first-run path | Slow PWA cold start, hurts first-timer | Keep the wizard lean; lazy-load chart-heavy/admin screens via route-level `React.lazy` | Bundle already large (moment+dayjs+antd+recharts, es5 target) |
| Mounting bottom `Drawer`s/Steps without cleanup | Memory/layout thrash on repeated open/close | Use antd `destroyOnClose` for sheet content; avoid mounting all steps at once | Long sessions, repeated wizard runs |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Surfacing admin publish / Gist token entry inside the friendly cook journey | Exposes baked-token / PIN gate (already a known weakness) to ordinary users; widens attack surface of an already-compromised client token | Keep admin/publish/backup out of the hero journey (FEATURES.md anti-feature); reframe doesn't mean surface privileged flows |
| Echoing the stored GitHub PAT in new copy/empty-state/error strings | Token leakage into UI/logs | Reference tokens by absence/presence only; never render token values in copy |
| Treating the admin PIN gate as real access control while reframing | False sense of protection; PIN is client-side only | Keep PIN as a UX gate only (per CONCERNS.md); don't build new "secure" flows on it |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Result screen shows an empty suggestion list | First-timer hits a dead end, journey fails | Always produce ≥1 actionable result; if catalog empty, route to "add first dish" |
| Mandatory steps / disabled "Next" | Decision-fatigued cook abandons | Every step skippable; "Tùy bạn / Bất kỳ" framed positively |
| Multi-slide intro carousel before first use | Delays the goal, widely skipped | The wizard *is* the tutorial; teach via empty states |
| "No data" / blank empty states that look broken | App feels broken on first run (everything empty) | Inviting empty copy + primary action ("Chưa có món nào — thêm món đầu tiên nhé") |
| Primary CTA out of thumb reach on phone | Hard to complete one-handed | Hero/continue CTA in bottom thumb zone (`FloatButton`/fixed footer) |
| Inconsistent terminology across nav/screen/toast | App feels incoherent, untrustworthy | One word per concept via the strings module + glossary |
| Back navigation resets earlier answers | Frustration, re-entry | Back preserves prior step answers (slice-backed) |

## "Looks Done But Isn't" Checklist

- [ ] **Wizard:** Often missing the cold-start path — verify it completes from a freshly wiped IndexedDB with zero data and still reaches a scheduled meal
- [ ] **Wizard:** Often missing resume — verify a mid-flow reload (or SW update) lands the user back on their step with answers intact
- [ ] **Reframe/nav:** Often missing reachability for admin/rare flows — verify Gist restore, admin publish, unit management, cooking pill, dashboard are all still reachable
- [ ] **Copy pass:** Often missing consistency — verify each concept uses one term across nav, screens, toasts, and errors; verify no leftover English/jargon
- [ ] **Copy pass:** Often missing interpolation — verify strings with variables still render the value, not literal `{x}`
- [ ] **Mobile tuning:** Often missing desktop verification — verify every touched screen still renders correctly on a desktop viewport
- [ ] **Mobile tuning:** Often missing touch conversion — verify no hover-only affordances remain as the only way to act
- [ ] **Shell refactor:** Often missing behavior parity — verify cooking pill, bottom nav, drawer, search, and backup all still work after extraction
- [ ] **Empty states:** Often missing the action — verify each empty state offers a primary next step, not just a message

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Lost capability (orphaned route) | LOW–MEDIUM | Restore the entry point or expose via "More"/search; add to reachability checklist; the feature code still exists |
| Wizard dead-end on empty data | MEDIUM | Add a guaranteed catalog fallback + "add first dish" route; make blocking steps skippable; add cold-start e2e |
| Copy inconsistency / JSX breakage | MEDIUM–HIGH | Build the strings module retroactively, migrate inline strings, dedupe terms against a glossary, run build to catch breakage — costlier than doing it first |
| Mobile change broke desktop | LOW–MEDIUM | Scope the change behind a breakpoint; revert global token bumps; re-verify both viewports |
| Shell refactor regression | MEDIUM–HIGH | Revert to the "pure move" commit (only possible if move and behavior change were separated); add error boundary; re-verify pill/nav/drawer/search/backup |
| Wizard progress wiped by reload | MEDIUM | Move slice writes to per-step commit; rehydrate on mount |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Wizard dead-end (first-timer) | Wizard-build | Cold-start e2e: empty IndexedDB → wizard → scheduled meal |
| Lost capability / orphaned routes | Reframe/navigation | Reachability checklist: every pre-refactor route reachable ≤3 taps or via search |
| Copy inconsistency / broken JSX | Copy-infrastructure (build strings module) before wording pass | Build passes; single-file copy review; glossary dedupe; no Latin-only user strings |
| Mobile breaks desktop | Mobile-first/layout | Both phone + desktop viewport verified per touched screen; desktop perf baseline holds |
| `MasterPage.tsx` shell destabilization | Any shell-touching phase (add error boundary early) | Pure-move commit verified identical before behavior change; pill/nav/drawer/search/backup click-through |
| Wizard progress wiped by reload | Wizard-build (state design) | Mid-flow reload resumes at saved step with answers |
| Suggestion logic regression | Wizard-build | Characterization tests pin engine behavior before any change; no new `as any` |

## Sources

- Codebase audit (verified this run): `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/CONCERNS.md` — oversized files, reload-as-recovery bug, no error boundary, ~no tests, fragile inventory `as any`, serializableCheck off, defensive selectors. *Confidence: HIGH.*
- Direct codebase inspection this run: ~408 inline VN strings in JSX, `CommonMessage.ts` (2 keys, no strings module), zero responsive grid usage, `MasterPage.tsx` 1366 lines, `SmartMealPlanner` 1997 / `DishSuggester` 1280 lines, `App.tsx` global `fontSize: 18` + `viVN` locale, shallow e2e suite. *Confidence: HIGH.*
- `.planning/research/STACK.md`, `.planning/research/FEATURES.md`, `.planning/PROJECT.md` — wizard pattern, antd 5.x APIs, anti-features, success criteria, out-of-scope constraints. *Confidence: HIGH.*
- Established UX pattern knowledge (wizard dead-ends, mandatory-step drop-off, empty-state conventions, touch-target/hover pitfalls). *Confidence: HIGH for patterns; MEDIUM for Vietnamese-specific phrasing.*

---
*Pitfalls research for: UI/UX refactor (guided wizard + Vietnamese copy + mobile-first) on a brownfield React 18 / RTK / antd 5 local-first PWA*
*Researched: 2026-06-14*
