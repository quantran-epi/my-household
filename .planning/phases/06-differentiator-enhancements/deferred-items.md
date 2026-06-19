# Deferred Items — Phase 06

Out-of-scope discoveries logged during plan execution. Not fixed by the
discovering plan; tracked for the owning plan / a follow-up.

## From Plan 06-04 (cook-now grouping fix)

- **Pre-existing build break: `SheetActions` import in `WizardResult.widget.tsx`**
  - `src/Modules/MealPlanning/Screens/WizardResult.widget.tsx:11` imports
    `SheetActions` from `@components/Sheet`, but `src/Components/Sheet/index.ts`
    only re-exports `Sheet` and `SheetProps` — `SheetActions` is not exported
    anywhere in `src/Components`. `yarn build` / `tsc --noEmit` fail with
    `TS2305: Module '"@components/Sheet"' has no exported member 'SheetActions'`.
  - Present at the wave base commit `f16ef2e`; unrelated to the DishScorer
    cook-now grouping change. Owned by the sibling WizardResult plan (06-05),
    which edits this file. Left untouched here per the executor scope boundary.
