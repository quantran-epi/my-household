---
phase: 05-mobile-tuning-copy-rollout
plan: 03
subsystem: ui
tags: [react, antd, copy, i18n, vietnamese, mobile, touch-targets, appcopy, bottom-sheet, shell]

# Dependency graph
requires:
  - phase: 01-copy-infrastructure
    provides: typed AppCopy source-of-truth (@common/Copy), build-gated CopyKey union, review-only glossary
  - phase: 05-mobile-tuning-copy-rollout
    plan: 01
    provides: AppCopy.wizard/emptyStates migration template + touch-target idiom
provides:
  - New AppCopy.shell namespace covering every MasterPage + SidebarDrawer user-facing string
  - MasterPage + SidebarDrawer reading copy via @common/Copy with zero inline user-facing literals
  - SidebarDrawer PIN + Backup confirmations hosted in @components/Sheet (bottom sheets), FastDrawerShell nav intact
  - >=44px touch targets on the shell controls this plan touched (data/help/account drawer buttons)
affects: [05-07 voice-refinement, copy-rollout, mobile-tuning]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Shell copy migration: inline VN literal -> AppCopy.shell.* / common.* direct object access (D-07)"
    - "Confirmation Modal -> @components/Sheet with primary-CTA-in-body (no onOk/footer), mirroring WizardResult"
    - "Touch-target tuning via minHeight within the inline-style idiom (no responsive framework, D-05)"

key-files:
  created: []
  modified:
    - src/Common/Copy/AppCopy.ts
    - src/Routing/MasterPage.tsx
    - src/Routing/Shell/SidebarDrawer.tsx

key-decisions:
  - "Migrated shell literals verbatim into AppCopy.shell (no rewording) — rewording is deferred to 05-07 per D-03 order"
  - "Left headerVisualByFeatureName map keys in MasterPage as VN literals — they are behavior-load-bearing lookup keys (feature-name -> visual tone), not rendered copy"
  - "Kept the publish-confirm as an imperative modal.confirm (PATTERNS case c) — migrated only its copy; the PIN and Backup JSX Modals are the two MOB-03 Sheet swaps"
  - "Reused common.cancel for the publish-confirm cancel label rather than a duplicate shell key"

patterns-established:
  - "Pattern 1: interpolated shell copy is a single named-arg arrow fn (backupSyncFailed, publishLastAt)"
  - "Pattern 2: a confirmation Sheet renders the confirm action as a full-width primary Button inside the Sheet body"

requirements-completed: [COPY-03, MOB-03, MOB-01, MOB-02]

# Metrics
duration: 12min
completed: 2026-06-17
---

# Phase 5 Plan 03: Shell & Nav Copy Migration + Bottom-Sheet Confirmations Summary

**Every high-traffic shell/nav string in MasterPage and SidebarDrawer now reads from the typed AppCopy.shell namespace, the SidebarDrawer PIN and Backup confirmations open as bottom sheets while the FastDrawerShell nav stays intact, and the shell controls this plan touched meet the >=44px phone-first bar.**

## Performance

- **Duration:** ~12 min
- **Completed:** 2026-06-17
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added an additive `AppCopy.shell` namespace (~60 leaves) covering MasterPage chrome (search aria-label, offline banner) and the full SidebarDrawer surface (nav group/item labels, data/help/account sections, PIN sheet, backup sheet, inventory config, publish admin, personal backup)
- Migrated `MasterPage.tsx` and `SidebarDrawer.tsx` to read every user-facing string from `AppCopy.shell.*` / `AppCopy.common.*` — quoted attributes, JSX text nodes, and `message.success/error` calls
- Swapped the SidebarDrawer PIN `Modal` and Backup `Modal` onto `@components/Sheet` (MOB-03): `onCancel`->`onClose`, dropped `footer`/`onOk`, rendered the PIN confirm as a full-width primary `Button` inside the Sheet body; kept `FastDrawerShell` left-nav exactly as-is (PATTERNS case d)
- Carried over a stable `data-testid` to each new sheet (`sidebar-pin-sheet`, `sidebar-backup-sheet`)
- Bumped the touched data/help/account drawer buttons to `minHeight: 44` (MOB-01/MOB-02) without introducing any responsive framework (D-05)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add shell namespace + migrate MasterPage strings to AppCopy** - `0f7004d` (feat)
2. **Task 2: SidebarDrawer copy migration + PIN/backup Modal -> Sheet + touch targets** - `5206cc2` (feat)

## Files Created/Modified
- `src/Common/Copy/AppCopy.ts` - Added the `shell` namespace covering all MasterPage + SidebarDrawer strings
- `src/Routing/MasterPage.tsx` - Reads search aria-label + offline banner from `AppCopy.shell`; data-testid + route paths preserved
- `src/Routing/Shell/SidebarDrawer.tsx` - Reads all copy from AppCopy; PIN/Backup are bottom sheets; FastDrawerShell intact; touched buttons >=44px

## Decisions Made
- Kept current phrasing verbatim — this plan migrates, it does not reword (rewording is 05-07 per D-03).
- The `headerVisualByFeatureName` map keys (e.g. `"Món ăn"`, `"Nguyên liệu"`) in MasterPage are NOT user-facing copy — they are lookup keys that map the `currentFeatureName` selector value to a header visual tone. Leaving them as literals is correct; migrating them would break the visual-tone lookup. Recorded as an intentional diacritic-grep exception.
- The publish-confirm uses the imperative `modal.confirm({...})` API (PATTERNS case c, D-06 ambiguous case). Per planner discretion it was left as an imperative confirm — only its copy was migrated. The two declarative JSX `Modal`s (PIN, Backup) are the MOB-03 Sheet swaps.
- Reused `common.cancel` ("Hủy") for the publish-confirm cancel label rather than adding a duplicate `shell` key.
- Removed the now-unused `Modal` import from SidebarDrawer (kept `DeferredModalContent`, still used inside the backup Sheet).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed unused `Modal` import**
- **Found during:** Task 2
- **Issue:** After swapping both JSX `Modal`s to `Sheet`, the `Modal` named import from `@components/Modal` became unused, which CRA/eslint flags.
- **Fix:** Narrowed the import to `import { DeferredModalContent } from "@components/Modal";` (the imperative `modal.confirm` still comes from the separate `useModal` provider import).
- **Files modified:** src/Routing/Shell/SidebarDrawer.tsx
- **Commit:** 5206cc2

## Threat Surface Notes (from plan threat_model)
- **T-05-05 (Information Disclosure, PIN):** mitigated — the existing `AntInput.Password` masked input + `tryUnlock`/`onUnlock` validation were moved verbatim into the Sheet body. No PIN logging, echoing, or new persistence introduced.
- **T-05-06 (Tampering, backup/restore):** mitigated — the backup/restore actions remain behind explicit primary-CTA taps inside the Sheet; the `tone="danger"` clear-token affordance is preserved; no implicit confirm added.
- No new network calls, no package installs. PIN/backup logic moved, not re-implemented — behavior preserved.

## Verification

- `yarn build` — green after both tasks (derived CopyKey union compiles; no malformed copy key)
- Acceptance greps confirmed:
  - `AppCopy.ts` contains `shell:` (1 match)
  - MasterPage + SidebarDrawer both import `@common/Copy`; SidebarDrawer imports `@components/Sheet`
  - `FastDrawerShell` still used in SidebarDrawer (nav intact)
  - `onOk=` and `footer={null}` return 0 in SidebarDrawer
  - Post-migration diacritic grep (double-quote, single-quote, and JSX-text variants) returns 0 user-facing literals in SidebarDrawer; only the intentional `headerVisualByFeatureName` lookup keys remain in MasterPage
  - No glossary `avoid` term (`Tạo mới`/`Thêm mới`/`Bữa ăn hôm nay`) introduced
  - `minHeight: 44` present on 5 touched controls
- No unit/spec test references `MasterPage`/`SidebarDrawer`; the build (CopyKey union) is the gating automated verification per the plan's `<verify>` block.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- The `shell` key surface joins `wizard`/`emptyStates` as the migration template; 05-07 voice-refinement can reword these keys in place without re-touching the shell files.
- Manual/e2e spot-check (open drawer, PIN gate, backup flow, FastDrawerShell slide-in) is deferred to phase-level UAT — consistent with the 05-01 note that the seeded-dashboard e2e cannot boot in this environment.

## Self-Check: PASSED

All claimed files exist on disk and both task commits are present in git history:
- Files: AppCopy.ts, MasterPage.tsx, SidebarDrawer.tsx, 05-03-SUMMARY.md — all FOUND
- Commits: 0f7004d, 5206cc2 — all FOUND

---
*Phase: 05-mobile-tuning-copy-rollout*
*Completed: 2026-06-17*
