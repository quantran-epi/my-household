# UI / UX Convention Specs

A reusable, project-agnostic contract for consistent UI and UX across a component-based
app (built originally for a React + Ant Design SPA, but the rules are framework-neutral).

Each convention has: the **intent**, the **rule**, and **PASS / FAIL** criteria so it can be
audited mechanically. Where a rule names a concrete component (e.g. `ActionButton`,
`NumberStepper`), treat that as a **reference implementation** — in a new project, create the
equivalent shared primitive once and point the rule at it.

Conventions are numbered C1–C14. C9 is the meta "be consistent everywhere" rule.

---

## C1 — Page-header global action menu (three-dot)

**Intent:** page-level actions should live in one predictable place, not scattered across the
page body.

**Rule:**
- If a page has **global/page-level actions** (add, export, settings, bulk ops, mode toggles),
  those actions move into a **three-dot (⋮) dropdown** in the **app header**, positioned to the
  **right of the global search button**.
- Remove any per-page feature icon to make room for the ⋮ button.
- A page needs a shared mechanism to inject its actions into the header (e.g. a
  `usePageActions(items)` hook backed by context/state that the header reads). Don't duplicate the
  header per page.

**PASS:** page has no global actions, OR its global actions are in the header ⋮ menu and the
feature icon is removed.
**FAIL:** global actions live in a top card, inline toolbar, or non-search-scoped search-row button.

---

## C2 — List-item action overflow (three-dot per item)

**Intent:** keep list/card items scannable; don't line up four buttons on every row.

**Rule:**
- A list/card item with **more than 2 actions** must extract the extras into a **⋮ icon button at
  the item's top-right corner**.
- Keep a **maximum of 1–2 focus buttons** visible (the primary actions); the rest go in the ⋮ menu.

**PASS:** item shows ≤ 2 actions, OR has a top-right ⋮ menu plus only 1–2 focus buttons.
**FAIL:** item shows 3+ inline action buttons with no overflow menu; or the ⋮ trigger isn't top-right.

---

## C3 — Item help (?) button placement + ordering

**Intent:** help affordances are predictable and never compete with the primary actions.

**Rule:**
- An item's **help (?) button** sits at the **top-right corner**.
- If the item also has a ⋮ tool button, the order is **⋮ first, then ?** — both at top-right.

**PASS:** ? is top-right; if ⋮ present, order is `[⋮][?]`.
**FAIL:** ? placed elsewhere, order reversed, or ? not grouped with ⋮.

---

## C4 — In-item actions use the shared compact action button

**Intent:** one consistent button style for everything inside a repeated item.

**Rule:**
- Every action **inside a list/card item** uses the shared compact action button
  (reference: `ActionButton`), never a bare/default button, never an ad-hoc styled button.
- The ⋮ overflow trigger and the ? help toggle are **exempt** (they're icon affordances, see C2/C3).

**PASS:** all in-item actions use the shared action button.
**FAIL:** an in-item action rendered with a normal/default button or custom inline-styled button.

---

## C5 — The normal/primary `Button` is restricted to specific slots

**Intent:** reserve the "big" button for moments that deserve emphasis; everything repeated uses
the compact action button (C4).

**Rule — the normal `<Button>` is ALLOWED only in:**
1. **Modal footers** (cancel / save / confirm).
2. **Top/hero section of a page** (the primary tool area) — e.g. a top-section "Add", a "trigger
   suggestion" CTA.
3. A **single important standalone CTA**.
4. **Page-header** buttons — unchanged (exempt).
5. **Search-box buttons** in list pages — unchanged (exempt).

**FAIL:** a normal `<Button>` used for an in-item/list-row action (that's C4), or as a scattered
section-level secondary action that should be a compact action button.

---

## C6 — Numeric inputs are flush ± steppers

**Intent:** one tappable, consistent numeric control everywhere; great for touch.

**Rule:**
- Every numeric field renders as **[−][ input ][+]** with minus and plus on **both sides**, joined
  with **no gap** (a connected/compact group).
- A bare number input (with or without tiny built-in controls) does **not** satisfy this.
- Reference: a shared `NumberStepper` component that all numeric fields use.

**PASS:** numeric field uses the flush ± stepper.
**FAIL:** bare number input, controls-only input, or a stepper with visible gaps between buttons
and input.

---

## C7 — Tags are rounded pill style

**Intent:** one tag shape across the whole app.

**Rule:**
- Every tag/chip uses the **rounded pill** style (high border-radius, ~16px+ or `999`).
- Fix this once in the shared `Tag` component so all usages inherit the pill; ad-hoc chips must set
  the pill radius explicitly.

**PASS:** tag rendered with pill radius.
**FAIL:** default squared-radius tag, or an ad-hoc chip that isn't pill-rounded.

---

## C8 — Page background + padding consistency

**Intent:** every page feels like the same app; cards float on a consistent backdrop.

**Rule:**
- Every page sits on a **non-white background** distinct from the white content cards (e.g. a
  subtle gradient provided once by the content shell).
- Every page uses the **same padding** as the shared content shell — don't double-pad or fight it
  with negative margins.

**PASS:** page lets the shell background show, cards float on it, padding matches the standard.
**FAIL:** page paints itself white edge-to-edge, adds its own extra padding, or uses inconsistent
padding.

---

## C9 — Consistency across ALL features (meta)

The whole app must be consistent. When auditing, report per-screen PASS/FAIL for every convention
with file:line evidence and a one-line fix recommendation. Specifics over summaries: list **every**
violating site so the fix plan has the full inventory.

---

## C10 — Modal button roles (footer vs in-body tools)

**Intent:** inside a modal, footer buttons and in-body tools have clearly different weights and
colors.

**Rule — inside a modal:**
- **Footer buttons** use the normal `<Button>`:
  - **Save/confirm** = `<Button type="primary">` with the **theme-color background**.
  - **Cancel/dismiss** = normal `<Button>` with a **white background** (no primary fill).
- **One whole-modal focus button** (a single modal-level primary action outside the footer, if one
  exists) may also be a normal `<Button>`.
- **Every other button inside the modal** — tool actions, item-row actions, per-section
  affordances — uses the compact action button (C4).
- If a modal item/row has **2+ actions**, collapse them into a **top-right ⋮ menu** (same overflow
  rule as C2), keeping at most 1–2 focus actions visible.

**PASS:** footer = normal buttons (save = primary/theme, cancel = white); ≤ 1 whole-modal focus
button; all other in-modal actions are compact action buttons; modal items with 2+ actions use a ⋮
menu.
**FAIL:** in-modal tool/item action rendered as a normal button; save without theme bg; cancel with
a filled/primary bg; a modal item showing 3+ inline actions with no ⋮ overflow.

---

## C11 — Icon buttons are consistent circles, one size

**Intent:** all icon-only buttons look like one family.

**Rule:**
- Every **icon-only button** is a **circle** and shares **one consistent size** across the app.
- **Exemptions (leave exactly as-is):**
  1. Page-header icon buttons.
  2. Search-box icon buttons in list pages.
  3. The modal close (×) button at the top-right of a modal.

**PASS:** all non-exempt icon-only buttons are circular and the same size; exempt buttons unchanged.
**FAIL:** a non-exempt icon-only button is square/rounded-rect, or icon buttons use mismatched sizes.

---

## C12 — Modal footer button layout (count-driven)

**Intent:** footer layout is predictable from the number of actions.

**Rule — decided by how many footer actions a modal has:**
- **1 button** → **full width** (`block`/`fullwidth`).
- **2 buttons** → both **align right** (cancel/white left, save/primary right).
- **3+ buttons** → show exactly **one focus button** plus a **⋮ dropdown** holding the rest; the
  focus button and the ⋮ button **align right** together.

This composes with C10: C10 governs button *roles/colors*; C12 governs *how many show inline and
how they align*. Overflow actions in the ⋮ menu are menu items, not buttons.

**PASS:** 1-button footer is full width; 2-button footer is right-aligned; 3+ collapses to one focus
button + right-aligned ⋮ menu.
**FAIL:** a lone footer button at intrinsic width; 2 footer buttons not right-aligned; 3+ footer
buttons inline with no ⋮ overflow.

---

## C13 — List-item tag placement (corner vs under-name)

**Intent:** a single status tag reads cleanly in the corner; multiple tags need their own row.

**Rule:**
- A list/card item with **exactly one** tag, whose **top-right corner is free** (no ⋮ overflow menu
  and no tool/action buttons there), places that **single tag in the top-right corner**.
- An item with **more than one** tag places all tags in a row **under the item name/description** —
  never crammed into the corner.
- If the corner **already holds** a ⋮ or action buttons (C2/C3), tags always go **under the
  name/description** regardless of count.

**PASS:** lone tag + free corner → tag top-right; multiple tags → under name/description; corner
with ⋮/actions → under name/description.
**FAIL:** multiple tags in the corner; a lone tag under the name when the corner is free; a tag
overlapping the ⋮/action area.

---

## C14 — Copy quality: labels & descriptions (specific, clear, natural language)

**Intent:** copy should describe the specific thing it sits on and read like a native speaker wrote
it.

**Rule:**
- **Specific, not boilerplate:** a description must describe **the current item/state** it annotates.
  Don't reuse one generic description across different items just to fill the slot. A **shared,
  fixed instruction** (a how-to hint, an empty-state guide, a reusable helper sentence) is the only
  allowed exception — instructions may be common.
- **Not too short / not cryptic:** labels and descriptions carry enough words to be understood on
  their own. Avoid one-word or abbreviated labels that need outside context to decode. Be relevant —
  say what this specific control/item does or means.
- **Natural, idiomatic language:** all copy reads as a native speaker would phrase it — natural
  grammar and word order, not a word-by-word translation from another language. (In this project the
  target is natural Vietnamese; for a new project, substitute the product's primary language.)

**PASS:** description is tailored to its item (or is a deliberately shared instruction);
labels/descriptions are clear, adequately worded, relevant; copy reads naturally.
**FAIL:** the same generic description copy-pasted onto unrelated items (non-instruction); a label so
short/cryptic it can't be understood alone; copy that is an obvious word-by-word translation with
unnatural grammar.

This is a **copy/content** convention — it composes with the button rules: C5/C10 keep *action*
labels to short verbs; C14 governs the surrounding descriptive text and any non-action labels.

---

## Additional binding rules

These aren't numbered but are part of the contract.

**Plain slot/label text (no action-prefixed names).** UI that shows a recurring label (e.g. a
meal slot) must not bake an action verb into the displayed name (e.g. "Finish breakfast",
"Cook lunch"). Strip the action prefix and show only the plain label, unless a real user-given name
follows a separator. *(This example is domain-specific to meal planning; generalize as: never use a
verb-prefixed action phrase where a plain noun label belongs.)*

**No long-text state buttons.** Never encode a blocking state or instruction in a button label
(e.g. "Need enough ingredients to start"). Surface the state with an alert/banner (with a title +
description) at the top of the modal/section, and keep action buttons to short verb labels
("Cook", "Shop", "Save"). Descriptions and alerts explain; buttons only act.

---

## How to audit a screen

For each screen/widget, record PASS / FAIL / N/A per convention with concrete evidence:

```
# <Module> audit

## <Screen/Widget file>
- C1  header actions:  PASS|FAIL|N/A — evidence (file:line) — fix
- C2  item overflow:   PASS|FAIL|N/A — evidence — fix
- C3  help button:     PASS|FAIL|N/A — evidence — fix
- C4  action button:   PASS|FAIL|N/A — evidence — fix
- C5  Button slots:    PASS|FAIL|N/A — evidence — fix
- C6  number stepper:  PASS|FAIL|N/A — evidence — fix
- C7  tag pill:        PASS|FAIL|N/A — evidence — fix
- C8  bg/padding:      PASS|FAIL|N/A — evidence — fix
- C10 modal buttons:   PASS|FAIL|N/A — evidence — fix
- C11 icon circles:    PASS|FAIL|N/A — evidence — fix
- C12 footer layout:   PASS|FAIL|N/A — evidence — fix
- C13 tag placement:   PASS|FAIL|N/A — evidence — fix
- C14 copy quality:    PASS|FAIL|N/A — evidence — fix
```

List **every** violating site (every bare number input, every default-radius tag, every in-item
normal button), because the fix plan needs the full inventory. Prefer specifics over summaries.

---

## Reusing this in a new project

1. Build the shared primitives first: a compact **action button** (C4), a flush **number stepper**
   (C6), a pill **tag** (C7), a **header action menu** mechanism (C1), and a content shell that
   owns the page **background + padding** (C8).
2. Adopt the **modal contract** (C10 roles, C12 layout) as a single modal wrapper if possible, so
   footers are consistent by default.
3. Set the **primary language** for C14 and keep copy specific + idiomatic from day one.
4. Audit every screen against the table above; fix by full inventory, not spot checks.
