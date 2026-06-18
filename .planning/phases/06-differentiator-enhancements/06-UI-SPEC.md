---
phase: 06
slug: differentiator-enhancements
status: approved
shadcn_initialized: false
preset: none
created: 2026-06-18
---

# Phase 6 — UI Design Contract

> Visual and interaction contract for frontend differentiator work in the existing meal-planning wizard.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | not applicable |
| Component library | Ant Design through local wrappers |
| Icon library | `@ant-design/icons` already used in this app |
| Font | existing app font stack |

---

## Spacing Scale

Declared values must remain multiples of 4.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, compact inline affordances |
| sm | 8px | Button rows, chip gaps, checkbox rows |
| md | 16px | Card padding, sheet body padding, section gaps |
| lg | 24px | Wizard step padding |
| xl | 32px | Major wizard section breaks |
| 2xl | 48px | Avoid inside wizard panels |
| 3xl | 64px | Not used in Phase 6 |

Exceptions: existing surrounding files may keep their established values when untouched.

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 16px | 400 | 1.5 |
| Label | 13px | 600 | 1.3 |
| Heading | 20px | 600 | 1.25 |
| Display | Not used | Not used | Not used |

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#ffffff` | Wizard screens and sheet surfaces |
| Secondary (30%) | `#f5f5f5` | Result cards, selection rows, subtle hint panels |
| Accent (10%) | `#7436dc` | Primary wizard controls, selected member/tag state, reset links |
| Success | `#389e0d` | Ready-to-cook group and availability labels |
| Warning | `#d48806` | Near-match or missing-few labels |
| Destructive | Ant Design danger token | Clear-defaults / undo-danger only |

Accent reserved for: selected chips/cards, primary CTA backgrounds, small action text, and progress affordances. Do not recolor every clickable element.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Portions step title | `Nhà mình có ai ăn bữa này?` |
| Cook-now toggle | `Ưu tiên nấu được ngay` |
| Weak inventory hint | `Kho chưa đủ rõ, mình vẫn xếp món theo nguyên liệu bạn chọn.` |
| Reason detail title | `Vì sao gợi ý món này?` |
| Missing ingredient action | `Thêm vào Đi chợ` |
| Default hint | `Đang dùng lựa chọn lần trước` |
| Reset current run | `Chọn lại từ đầu` |
| Clear defaults | `Xóa lựa chọn đã nhớ` |
| Error state | Use problem + next step; never expose raw score or technical jargon |
| Destructive confirmation | `Xóa lựa chọn đã nhớ` with a clear body; no silent deletion |

All new visible strings must live in `AppCopy.wizard` or existing `common` keys. Reason text must be natural household Vietnamese and non-numeric.

---

## Interaction Contract

- Insert the portions step after ingredients and before preferences.
- Steps stay skippable; skip uses the same `Tùy bạn` posture.
- The portions UI uses member selection when household members exist, otherwise a serving-count stepper.
- `+ / -` serving controls and any primary CTAs have at least 44px touch targets.
- Result cards show a one-line reason plus a small question-mark icon button for detail.
- Detail and missing-ingredient flows use `Sheet` and `SheetActions`.
- One sheet action stretches full width; two sheet actions sit horizontally through `SheetActions`.
- Adding missing ingredients keeps the user on the result page and shows inline success/undo state.
- Cook-now mode groups results as `Nấu ngay`, `Cần mua thêm ít`, and `Dự phòng`; it never dead-ends on an empty ready group.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required |
| third-party | none | not required |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-06-18
