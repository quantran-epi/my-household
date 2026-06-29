# Phase 8: Sheet-Picker Component Layer - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-29
**Phase:** 8-Sheet-Picker Component Layer
**Areas discussed:** API & conversion strategy, Trigger element, Date picker engine, ActionMenu layout

> **Note:** The user delegated all four decisions to Claude ("do not need to ask me, do what you recommended, what you think is best for UI, UX and usability"). The tables below record the options Claude weighed and the choice made, with rationale, rather than user selections.

---

## API & conversion strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Mirror existing AntD wrapper API | `value`/`onChange`/`options`/`mode`/`showSearch`/`allowClear`/`picker`/`showTime`; Phases 10-11 become near drop-in import swaps | ✓ |
| Fresh picker-specific API | Cleaner surface, but every one of ~114 sites becomes a hand rewrite | |

**Claude's choice:** Mirror existing AntD wrapper API (D-01, D-02).
**Notes:** Biggest downstream-effort lever — prop compatibility turns Phase 10-11 conversion into mechanical, low-risk swaps. Pickers are controlled components honoring the `value`/`onChange`/`id`/`status` that `Form.Item` injects (PICK-08).

---

## Trigger element

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated owned trigger | A button styled to match the AntD input box; forwards `id`/`status`/`disabled`, opens the sheet, restylable by Phase 9 tokens | ✓ |
| Reuse AntD Select/DatePicker with popup suppressed | Less new markup, but drags along the AntD popup/z-index machinery Phase 11 is removing | |

**Claude's choice:** Dedicated owned trigger (D-03, D-04).
**Notes:** Clean ownership of focus-return, status ring, and disabled state; sidesteps the `z-index:4200` popup hacks entirely.

---

## Date picker engine

| Option | Description | Selected |
|--------|-------------|----------|
| Host AntD's calendar panel in the sheet | Reuses AntD's `disabledDate`/`showTime`/range/`viVN` — lowest parity risk | ✓ |
| Custom calendar grid | Full visual control, but re-implements (and re-bugs) min/max, time, range, locale | |

**Claude's choice:** Host AntD's calendar panel (D-08, D-09).
**Notes:** Value stays `Dayjs`; "Hôm nay" shortcut + range commit-on-"Xong" so a half-picked range can't escape.

---

## ActionMenu layout

| Option | Description | Selected |
|--------|-------------|----------|
| iOS grouped action-sheet | Action rows in one rounded card, destructive red, "Hủy" detached below | ✓ |
| Single list with Cancel as last row | Simpler, but less recognizably native-iOS | |

**Claude's choice:** iOS grouped action-sheet (D-10).
**Notes:** Canonical iOS action-sheet shape — best serves the "native iOS feel" milestone goal. Replaces ~17 AntD `Dropdown` overflow menus in later phases.

---

## Claude's Discretion

All four areas were delegated to Claude. Further fine-grained discretion (search threshold, row height pre-Phase-9, iconography, exact Vietnamese copy for "Xong"/"Hủy"/"Hôm nay"/"Bỏ chọn", calendar embed mechanism) is noted in CONTEXT.md §Claude's Discretion.

## Deferred Ideas

- Migrating real picker sites — Phases 10-11.
- iOS token baseline + app-shell safe-area + ≥44px audit — Phase 9.
- Removing old AntD wrappers and `z-index:4200` hacks — Phase 11 (CONV-05).
- Multi-detent snapping / haptics / spring physics — out of v1.1.
