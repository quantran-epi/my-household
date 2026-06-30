---
phase: 09-ios-visual-baseline-safe-area-shell
verified: 2026-06-30T09:30:00Z
status: human_needed
score: 11/11 must-haves verified
overrides_applied: 0
human_verification:
  - test: "On a notched iPhone (or iOS Simulator), open the installed PWA with at least one active cooking session and navigate so the bottom tab nav + cooking pill are visible."
    expected: "Both the bottom tab nav dock and the floating cooking pill sit fully above the home indicator with no overlap; the scrollable content's last row is not clipped under the iOS toolbar or home indicator."
    why_human: "env(safe-area-inset-*) resolves to non-zero only on real notched hardware/simulator; jsdom and headless WebKit report 0, so the real clearance cannot be observed programmatically (per 09-VALIDATION.md Manual-Only)."
  - test: "Run the authored WebKit e2e specs: `npx playwright test tests/e2e/cooking-pill.spec.ts tests/e2e/sheet-picker.spec.ts --project=mobile-safari` (run `npx playwright install webkit` first if the binary is absent)."
    expected: "cooking-pill clearance test (pill bottom edge <= nav top edge) passes, and sheet-picker touch-target test (trigger + sheet row boundingBox height >= 44) passes on the iPhone 13 descriptor."
    why_human: "The mobile-safari WebKit runner / dev server is not available in this verification environment; the specs are authored and type-check clean but were not executed end-to-end."
---

# Phase 9: iOS Visual Baseline & Safe-Area Shell Verification Report

**Phase Goal:** Define and apply a lightweight iOS token baseline and a `viewport-fit=cover` safe-area shell so the picker layer and app chrome read as native and thumb-friendly app-wide.
**Verified:** 2026-06-30T09:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | An iOS token baseline (spacing, radius, type scale, sheet surface) exists as a single typed module | ✓ VERIFIED | `src/Theme/iosTokens.ts` exports `iosTokens = {...} as const` with 8 categories (spacing/radius/type/color/surface/motion/touchTarget/layout); all promoted verbatim from Phase 7/8 literals |
| 2 | The sheet-picker layer renders from the token baseline (IOS-01) | ✓ VERIFIED | `App.tsx:25-32` ConfigProvider reads `iosTokens.color.*`/`type.*`/`radius.md`; `FastOverlay.tsx:49,152,331-332,587-588` read `motion.ease`/`radius.xl/md`/`surface.sheetGradient`; SheetTrigger/SheetSelect read tokens |
| 3 | The `safeAreaInset` helper returns the same `calc(... + env())` string the working BottomTabNavigator used | ✓ VERIFIED | `src/Theme/safeArea.ts` `bottom(8)` → `calc(8px + env(safe-area-inset-bottom))`; pinned by `iosTokens.test.ts` (passing) |
| 4 | `@theme` resolves in editor (tsc), dev/build (craco), and tests (jest) | ✓ VERIFIED | Node check: tsconfig paths `['./src/Theme/index.ts']`, jest mapper `<rootDir>/src/Theme/index`, craco alias present (`@theme` matched) |
| 5 | The shell sets `viewport-fit=cover` (IOS-02) | ✓ VERIFIED | `public/index.html:7` viewport meta = `width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover` |
| 6 | The scrollable content box subtracts both safe-area insets exactly once with one unit family, last row never clipped (IOS-02) | ✓ VERIFIED | `Content.tsx:17-20` scoped `<style>` block: `100vh` fallback then `100dvh` winner, each `- chrome - env(safe-area-inset-top) - env(safe-area-inset-bottom)`; no double-padding; Content.test.tsx passes |
| 7 | The cooking pill clears the safe-area-raised bottom nav and never rides the home indicator (IOS-02, CR-01 fix) | ✓ VERIFIED | `CookingPill.tsx:58` `bottom: safeAreaInset.bottom(iosTokens.layout.bottomNavContainerMinHeight)` — clears the 88px container (not 80px dock), matching the nav's painted `minHeight` at `BottomTabNavigator.tsx:37` |
| 8 | All sticky bottom chrome routes through one safe-area convention (nav, pill, content math) | ✓ VERIFIED | Content chrome (line 9) = `headerHeight + bottomNavContainerMinHeight`; CookingPill = `safeAreaInset.bottom(bottomNavContainerMinHeight)`; nav = `safeAreaInset.bottom(spacing.sm)` + `bottomNavContainerMinHeight` — all single-sourced from tokens |
| 9 | BottomTabNavigator reference values read from tokens so convention and tokens stay equal (D-07) | ✓ VERIFIED | `BottomTabNavigator.tsx:37,38,60,62,80,82,84,124,170` read `layout`/`radius`/`surface.shadowNav`/`color`/`touchTarget`/`safeAreaInset`; documented exceptions left verbatim |
| 10 | Converted picker trigger meets the >=44px thumb-zone bar (IOS-03) | ✓ VERIFIED | `SheetTrigger.tsx:30` `minHeight: iosTokens.touchTarget.min`; `radius.sm` for borderRadius; SheetTrigger.test.tsx asserts `'44px'` + `'6px'` (passing) |
| 11 | Sheet rows meet the >=44px thumb-zone bar (IOS-03) | ✓ VERIFIED | `SheetSelect.tsx:48` `rowBaseStyle.minHeight: iosTokens.touchTarget.min`; `11px 16px` padding kept verbatim |

**Score:** 11/11 truths verified (programmatic). Real-device home-indicator clearance + WebKit e2e execution routed to human verification.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/Theme/iosTokens.ts` | Typed `as const` token object, 8 categories | ✓ VERIFIED | All categories present; verbatim values; `as const` terminates module |
| `src/Theme/safeArea.ts` | `safeAreaInset.bottom/top` calc helpers | ✓ VERIFIED | Both methods return `calc(${base}px + env(...))` |
| `src/Theme/index.ts` | `@theme` barrel re-export | ✓ VERIFIED | Re-exports `iosTokens` + `safeAreaInset` |
| `src/Theme/iosTokens.test.ts` | Token shape + exact-value assertions | ✓ VERIFIED | Suite passes (part of 34/34) |
| `src/App.tsx` | ConfigProvider fed from tokens (D-04) | ✓ VERIFIED | 6 scalar slots + borderRadius read tokens; zIndex blocks untouched |
| `src/Components/FastOverlay/FastOverlay.tsx` | Sheet gradient/radius/ease from tokens | ✓ VERIFIED | `surface.sheetGradient`, `radius.xl/md`, `motion.ease` wired |
| `src/Components/SheetPicker/shared/SheetTrigger.tsx` | Trigger min-height/radius/type/colors from tokens | ✓ VERIFIED | `touchTarget.min`, `radius.sm`, `type.control`, `color.*` |
| `src/Components/SheetPicker/SheetSelect/SheetSelect.tsx` | Row min-height + control type from tokens | ✓ VERIFIED | `touchTarget.min` + `type.control` spread |
| `src/Components/Layout/Content/Content.tsx` | dvh-primary height subtracting both insets (D-05) | ✓ VERIFIED | Scoped `<style>` cascade, both insets once, chrome from tokens |
| `src/Components/Layout/Content/Content.test.tsx` | Regression guard: both insets, single unit family | ✓ VERIFIED | Suite passes |
| `src/Routing/Shell/CookingPill.tsx` | Pill bottom rebased on nav-clearance + inset (D-06) | ✓ VERIFIED | Reads `safeAreaInset.bottom(bottomNavContainerMinHeight)`, `touchTarget.comfortable`, `radius.pill` |
| `tests/e2e/cooking-pill.spec.ts` | Pill-clears-nav boundingBox assertion | ✓ AUTHORED | Clearance test present (line 40); unrun — WebKit unavailable (human) |
| `tests/e2e/sheet-picker.spec.ts` | boundingBox >=44 on mobile-safari | ✓ AUTHORED | Touch-target test present (line 124); unrun — WebKit unavailable (human) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| tsconfig/craco/package.json | src/Theme/index.ts | `@theme` alias in all three | ✓ WIRED | Node assertion confirms all three present |
| App.tsx | @theme | `iosTokens.color.primary` feeds ConfigProvider | ✓ WIRED | Import + usage at lines 16,25-32 |
| SheetTrigger.tsx | iosTokens.touchTarget.min | `baseStyle.minHeight` reads token | ✓ WIRED | Line 30 |
| CookingPill.tsx | iosTokens.layout + safeAreaInset.bottom | bottom offset reads token + helper | ✓ WIRED | Line 58 (clears 88px container — CR-01 fix) |
| Content.tsx | iosTokens.layout | chrome = headerHeight + bottomNavContainerMinHeight | ✓ WIRED | Line 9 (CR-01 fix — was bottomNavHeight 80) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Token + Content + Trigger suites pass | `react-scripts test src/Theme/iosTokens.test.ts src/Components/Layout/Content src/.../SheetTrigger.test.tsx` | 3 suites, 34 tests passed | ✓ PASS |
| `@theme` alias in all three configs | node assertion | tsconfig + jest + craco all present | ✓ PASS |
| Fix commit 1592686 present | `git cat-file -t 1592686` | commit (`fix(09): clear bottom nav container min-height...`) | ✓ PASS |
| No leftover literals in fixed files | grep `bottom: 76` / `100vh - 156px` | none found | ✓ PASS |
| WebKit e2e (cooking-pill + sheet-picker) | `playwright test --project=mobile-safari` | not runnable — no WebKit binary/dev server | ? SKIP → human |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| IOS-01 | 09-01, 09-02 | Lightweight iOS token baseline defined + applied to sheet-picker layer | ✓ SATISFIED | iosTokens module + ConfigProvider/FastOverlay/SheetTrigger/SheetSelect wiring (truths 1,2) |
| IOS-02 | 09-03 | Shell sets `viewport-fit=cover` + safe-area insets so sticky bottom chrome clears home indicator | ✓ SATISFIED (code) / NEEDS HUMAN (device) | viewport meta + Content/CookingPill/nav safe-area math (truths 5-9); real-device clearance is manual-only |
| IOS-03 | 09-02 | Every converted picker trigger + sheet row meets >=44px thumb-zone bar | ✓ SATISFIED (jsdom) / NEEDS HUMAN (WebKit) | SheetTrigger/SheetSelect token + jsdom assertions (truths 10,11); WebKit boundingBox authored but unrun |

All three requirement IDs from PLAN frontmatter (IOS-01/02/03) are accounted for. No orphaned requirements — REQUIREMENTS.md maps only IOS-01/02/03 to Phase 9, all claimed by plans.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| SheetTrigger.tsx | 24 | `const PLACEHOLDER = '#bfbfbf'` | ℹ️ Info | False positive — `PLACEHOLDER` is the placeholder-text *color* value, not a stub/debt marker. No action needed. |

No `TBD`/`FIXME`/`XXX` debt markers in any phase-modified file. No stub returns, empty handlers, or disconnected data sources.

Out-of-scope review findings (noted, NOT phase blockers): 09-REVIEW.md WR-02 (nested interactive control in SheetTrigger) and 3 Info items are pre-existing/advisory and outside this phase's must-haves.

### Human Verification Required

**1. Real-device home-indicator clearance (IOS-02)**
- **Test:** On a notched iPhone (or iOS Simulator), open the installed PWA with an active cooking session and view the bottom nav + cooking pill.
- **Expected:** Both nav dock and floating pill sit fully above the home indicator with no overlap; content's last row not clipped.
- **Why human:** `env(safe-area-inset-*)` is non-zero only on real notched hardware; jsdom/headless WebKit report 0.

**2. WebKit e2e execution (IOS-02 / IOS-03)**
- **Test:** `npx playwright test tests/e2e/cooking-pill.spec.ts tests/e2e/sheet-picker.spec.ts --project=mobile-safari` (install webkit first if needed).
- **Expected:** Pill-clears-nav and >=44px touch-target tests pass on iPhone 13 descriptor.
- **Why human:** mobile-safari runner / dev server unavailable in this environment; specs are authored and type-check clean but unrun.

### Gaps Summary

No gaps. All 11 observable truths are verified against the codebase. The CR-01 nav-clearance bug flagged in 09-REVIEW.md is confirmed FIXED on disk (commit 1592686): both `CookingPill.tsx:58` and `Content.tsx:9` now clear the 88px `bottomNavContainerMinHeight` rather than the 80px dock height, matching the nav container's painted min-height — closing the ~8px overlap that would have failed the phase's own clearance test.

The phase is code-complete and fully verified at the automatable level (tokens, wiring, jsdom 44px bar, viewport meta, safe-area math). Two items inherently require human confirmation — they were anticipated as manual-only in 09-VALIDATION.md and are not implementation gaps: (1) real-device home-indicator clearance, since `env()` insets only resolve non-zero on notched hardware, and (2) execution of the authored WebKit e2e specs, since the mobile-safari runner is unavailable here. Status is `human_needed` per the decision tree because these human items exist; no automated check failed.

---

_Verified: 2026-06-30T09:30:00Z_
_Verifier: Claude (gsd-verifier)_
