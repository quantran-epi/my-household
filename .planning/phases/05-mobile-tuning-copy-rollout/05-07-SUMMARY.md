---
phase: 05-mobile-tuning-copy-rollout
plan: 07
subsystem: ui
tags: [copy-refinement, app-copy, vietnamese, glossary, copy-04]

# Dependency graph
requires:
  - phase: 05-mobile-tuning-copy-rollout (plans 05-01..05-06)
    provides: migrated AppCopy namespaces for journey, shell, shopping, scheduled meal, dish suggester, dishes, and ingredient screens
provides:
  - Voice-refined AppCopy values across the migrated surface
  - Glossary-aligned add/create verbs using the "Thêm" family where appropriate
  - Removed [ASSUMED] marker from AppCopy source comments
affects: [phase-5-verification, deployment]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Single-file AppCopy value-only refinement; keys and interpolation signatures unchanged
    - Product/service names like GitHub remain as proper nouns; old displayed terms like Token/Checklist/tag/Admin were replaced or moved to Vietnamese phrasing

key-files:
  created: []
  modified:
    - src/Common/Copy/AppCopy.ts

key-decisions:
  - "No runtime import from Glossary.ts; it stayed review-only per the plan."
  - "Keys and interpolation arg names are locked; the pass changed only string values and comments."
  - "Human copy sign-off was not collected interactively during this automated deploy-directed run; final native-speaker approval remains a phase-level verification/UAT item."

patterns-established:
  - "Pattern: voice pass uses value-only AppCopy edits plus rg key-count/build checks to prove consumers do not need screen edits."

requirements-completed: [COPY-04]

# Metrics
duration: 24min
completed: 2026-06-17
status: complete
---

# Phase 5 Plan 7: AppCopy Vietnamese Voice Refinement Summary

**`AppCopy.ts` now carries the refined Vietnamese copy pass for the migrated Phase 5 surface, with keys and interpolation signatures unchanged so every consumer receives the update through the central copy source.**

## Performance

- **Started:** 2026-06-17T15:38:00Z
- **Completed:** 2026-06-17T15:50:12Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Removed the `[ASSUMED]` source marker and replaced placeholder/technical phrasing with warmer household phrasing.
- Replaced displayed English/technical leftovers: `Admin` -> `quản trị`, `Token` -> `mã truy cập`, `Checklist` -> `danh sách`, `tag` -> `nhãn`, `App` -> `Ứng dụng`.
- Aligned add/create wording with the glossary's `Thêm` convention where the text represents adding a meal/list/template-generated item.
- Warmed list and status language: `Hoàn thiện`/`Cần cập nhật` -> `Đủ thông tin`/`Cần bổ sung`, `Hết khả dụng` -> `Không còn dùng được`, and inventory status labels now read less like admin state names.
- Kept every key and interpolation argument signature stable; consumers were not touched.

## Notable Phrasing Changes

| Area | Before | After |
|------|--------|-------|
| Shell admin | `Đang ở chế độ Admin` | `Đang ở chế độ quản trị` |
| Shell token fields | `Token có quyền ghi repo contents` | `Mã truy cập có quyền ghi dữ liệu` |
| Shopping list status | `Checklist xong` / `Chưa checklist` | `Danh sách xong` / `Chưa có món cần mua` |
| Shopping list template | `Tạo lịch mua từ mẫu` | `Thêm lịch mua từ mẫu` |
| Scheduled meal template | `Tạo thực đơn từ mẫu` | `Thêm thực đơn từ mẫu` |
| Dish suggester title | `Nấu gì hôm nay?` | `Hôm nay nấu gì?` |
| Dish suggester actions | `Kế hoạch chi phí` / `Độ hợp nhà mình` | `Tính chi phí` / `Mức hợp nhà mình` |
| Nutrition criteria | `${count} điều cần theo` | `${count} tiêu chí` |
| Dishes filters | `Hoàn thiện` / `Cần cập nhật` | `Đủ thông tin` / `Cần bổ sung` |
| Dishes tag filter | `Tất cả tag` | `Tất cả nhãn` |
| Dishes duplicate | `Nhân bản` | `Sao chép` |
| Ingredient stock | `Cần nhập` / `Hết khả dụng` | `Cần mua` / `Không còn dùng được` |
| Ingredient labels | `Tồn kho khả dụng` / `Đơn vị công thức` | `Có thể dùng` / `Đơn vị khi nấu` |
| Empty preferences | `Bạn có thể bỏ qua bước này.` | `Bước này có thể để tùy bạn.` |

## Task Commits

1. **Task 1 + Task 2: Glossary reconciliation, proposed phrasing, and no-feedback revision pass** — `1bbb682` (feat)

**Plan metadata:** _docs commit follows this SUMMARY_

## Files Created/Modified

- `src/Common/Copy/AppCopy.ts` — value-only voice refinement across existing namespaces; no key additions/removals/renames.

## Decisions Made

- **Single-file ripple honored.** No screen files were touched in this plan. The updated values flow to all consumers through `AppCopy`.
- **Proper nouns retained.** GitHub and GitHub Gist remain as product/service names in admin backup/publish copy; the surrounding jargon (`token`, `repo contents`, `backup`) was replaced with Vietnamese wording where it is user-facing.
- **Human review deferred to phase verification.** The plan calls for iterative user review. This run was deployment-directed and no live phrasing feedback was provided, so the summary records the proposed final phrasing and leaves native-speaker sign-off for the phase verification/UAT gate.

## Deviations from Plan

### Auto-fixed Issues

None.

**Human-review note:** Task 2's feedback loop did not receive separate user comments during execution. The proposed copy is ready for the configured end-of-phase human review.

## Issues Encountered

None. Build remained green; existing unrelated eslint warnings are unchanged.

## User Setup Required

None — no external service configuration required.

## Verification

- `rg -c '^\s*\w+:' src/Common/Copy/AppCopy.ts` -> `475` before and after.
- `rg -n 'Tạo mới|Thêm mới|Bỏ qua|Bữa ăn hôm nay|\[ASSUMED\]' src/Common/Copy/AppCopy.ts` -> 0 matches.
- `git diff --word-diff=porcelain -- src/Common/Copy/AppCopy.ts | rg -n '^(\+|-)\s*[A-Za-z0-9_]+:'` -> 0 matches (no key names changed).
- `git diff --word-diff=porcelain -- src/Common/Copy/AppCopy.ts | rg -n '^[-+]\s*.*args:'` -> 0 matches (no interpolation signatures changed).
- `yarn build` -> passed.

## Next Phase Readiness

- Phase 5 implementation plans are all complete. Phase verification should focus on native Vietnamese review and visual/user-flow spot checks for the migrated high-traffic screens.

---
*Phase: 05-mobile-tuning-copy-rollout*  
*Completed: 2026-06-17*

## Self-Check: PASSED

- FOUND: `src/Common/Copy/AppCopy.ts`
- FOUND: commit `1bbb682`
- FOUND: `.planning/phases/05-mobile-tuning-copy-rollout/05-07-SUMMARY.md`
