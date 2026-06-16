# Phase 4: Wizard UI & Hero Entry - Pattern Map

**Mapped:** 2026-06-16
**Files analyzed:** 11 (7 new, 4 modified)
**Analogs found:** 10 / 11

> Brownfield Ant Design v5 React app. Conventions (`.planning/codebase/CONVENTIONS.md`): `.screen.tsx`/`.widget.tsx`/`.modal.tsx` suffixes, selector-only reads (FND-03), Vietnamese inline copy, inline-style idiom (no CSS modules), `strict: false` (guard nullables manually), path aliases (`@components`, `@modules`, `@store`, `@routing`, `@common`, `@hooks`). Match the surrounding file's indentation (existing module files use 4 spaces).

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/Modules/MealPlanning/Routing/MealPlanningRouteConfig.ts` | config (route) | request-response | `src/Modules/ScheduledMeal/Routing/ScheduledMealRouteConfig.ts` | exact |
| `src/Modules/MealPlanning/Routing/MealPlanningRouter.tsx` | route wrapper | request-response | `src/Modules/ScheduledMeal/Routing/ScheduledMealRouter.tsx` | exact |
| `src/Modules/MealPlanning/Screens/Wizard.screen.tsx` | screen (container) | event-driven (step-key → screen) | `src/Modules/DishSuggester/Screens/DishSuggester.screen.tsx` (step state machine) | role-match |
| `src/Modules/MealPlanning/Screens/WizardIngredientStep.widget.tsx` | widget | request-response | `DishSuggester.screen.tsx` ingredients step (`:742-761`) + `IngredientPicker.widget.tsx` | exact |
| `src/Modules/MealPlanning/Screens/WizardPreferenceStep.widget.tsx` | widget | request-response | `DishSuggester.screen.tsx` `NutritionGoalPicker` (`:600-645`) | role-match |
| `src/Modules/MealPlanning/Screens/WizardResult.widget.tsx` | widget | transform + CRUD | `SuggestionRow` (`Dashboard.screen.tsx:425-443`) + `ScheduledMealAdd.widget.tsx` (`addScheduledMeal`) | role-match |
| `src/Modules/MealPlanning/Components/WizardProgress.tsx` | component | request-response | `ModeTabs` (`DishSuggester.screen.tsx:550-591`) — pill/step chrome | partial |
| `src/Routing/RootRoutes.ts` | config | request-response | self (`AuthorizedRoutes` object `:87-105`) | exact |
| `src/Routing/RootRouter.tsx` | route tree | request-response | self (sub-router blocks `:66-84`) | exact |
| `src/Routing/Shell/BottomTabNavigator.tsx` | component (nav) | event-driven | self (`onNavigate` `:193-196`, other tabs `:202-227`) | exact |
| `src/Modules/Home/Screens/Dashboard.screen.tsx` | screen | request-response | self (`DashboardHero` `:255-338`, `openRoute` `:537-539`) | exact |

---

## Pattern Assignments

### `src/Modules/MealPlanning/Routing/MealPlanningRouteConfig.ts` (config, request-response)

**Analog:** `src/Modules/ScheduledMeal/Routing/ScheduledMealRouteConfig.ts` (whole file, 1-12)

Copy verbatim, swapping the base path and sub-routes. `CreateRoutes(base, fn)` returns an object with a `.Root()` plus each named sub-route; sub-path segments are array members in `CreateRoute(root, [segments])`. Default-export the route object (matches every sibling route config and CONVENTIONS "default exports reserved for route configs").

```typescript
import { RouteHelpers } from "@common/Helpers/RouteHelper"

const MealPlanningRoutes = RouteHelpers.CreateRoutes('/meal-planning', (root) => ({
    Wizard: () => RouteHelpers.CreateRoute(root, ["wizard"]),
}))

export default MealPlanningRoutes
```
Resolves to `/meal-planning/wizard`.

---

### `src/Modules/MealPlanning/Routing/MealPlanningRouter.tsx` (route wrapper, request-response)

**Analog:** `src/Modules/ScheduledMeal/Routing/ScheduledMealRouter.tsx` (whole file, 1-8)

Copy verbatim, rename the component. `<Container>` wraps `<Outlet/>` so child step routes render inside the shell's content frame (same as Ingredient/Dishes/ShoppingList/ScheduledMeal routers). Named export.

```tsx
import { Container } from '@components/Layout/Container';
import { Outlet } from 'react-router-dom';

export const MealPlanningRouter = () => {
    return <Container>
        <Outlet />
    </Container>
}
```

---

### `src/Modules/MealPlanning/Screens/Wizard.screen.tsx` (screen container, event-driven)

**Analog:** `src/Modules/DishSuggester/Screens/DishSuggester.screen.tsx` (step state machine: `step` state `:140`, `_onNext`/`_onBack` `:353-354`, conditional step render `:742-779`)

The DishSuggester uses **local** `useState` step (`0`/`1`); the wizard instead reads the **persisted** step from Redux (D-05, resume-on-reload). Map step-key → step widget. Reads via selectors only (FND-03).

**Selector imports** (verified `Selectors.ts:57-64`):
```typescript
import { useSelector, useDispatch } from "react-redux";
import { selectWizardStep, selectWizardAnswers } from "@store/Selectors";
import { commitWizardAnswer, advanceWizardStep, goBackWizardStep, completeWizard } from "@store/Reducers/WizardReducer";
import { WizardStepKey } from "@store/Models/Wizard";
```

**Step-key list as a module-local constant** (RESEARCH §3, D-03 lean flow — `servings`/`time` keys exist in the union but are not steps this phase):
```typescript
const WIZARD_STEPS: WizardStepKey[] = ['ingredients', 'preferences', 'result'];
```

**Container body — read current step, render matching widget** (mirrors DishSuggester `:742-779` conditional render, but keyed on the persisted step):
```tsx
const step = useSelector(selectWizardStep);
const dispatch = useDispatch();
const idx = Math.max(0, WIZARD_STEPS.indexOf(step));

const goNext = (answer: Partial<WizardAnswers>) => {
    dispatch(commitWizardAnswer(answer));
    const next = WIZARD_STEPS[idx + 1];
    if (next) dispatch(advanceWizardStep(next));
};
const goBack = () => {
    const prev = WIZARD_STEPS[idx - 1];
    if (prev) dispatch(goBackWizardStep(prev));
};

return <Box data-testid="wizard-screen">
    <WizardProgress current={idx} total={WIZARD_STEPS.length} onBack={idx > 0 ? goBack : undefined} />
    {step === 'ingredients' && <WizardIngredientStep onNext={goNext} />}
    {step === 'preferences' && <WizardPreferenceStep onNext={goNext} onBack={goBack} />}
    {step === 'result' && <WizardResult />}
</Box>;
```
**Action-creator contracts** (verified `WizardReducer.ts:63-70`): `commitWizardAnswer(Partial<WizardAnswers>)` shallow-merges + flips `idle`→`in_progress`; `advanceWizardStep(key)` sets step + `in_progress`; `goBackWizardStep(key)` sets step only; `completeWizard()` sets `completed`.

---

### `src/Modules/MealPlanning/Screens/WizardIngredientStep.widget.tsx` (widget, request-response)

**Analog:** `DishSuggester.screen.tsx:742-761` (ingredients step) + `src/Modules/DishSuggester/Screens/IngredientPicker.widget.tsx`

`IngredientPickerWidget` is a self-contained controlled `{ selectedIds, onChange }` component — drop it straight in (reads `selectIngredients`/`selectIngredientsById` itself; do not re-fetch). RESEARCH §1/§9.

**Picker contract** (verified `IngredientPicker.widget.tsx:17-22`):
```typescript
type IngredientPickerWidgetProps = { selectedIds: string[]; onChange: (ids: string[]) => void; }
```

**Reuse pattern** (verified `DishSuggester.screen.tsx:744-759` — local state + primary advance button; the DishSuggester wraps it directly, no Sheet, but RESEARCH §8/D-01 wants it hosted in a `Sheet`):
```tsx
const [ids, setIds] = useState<string[]>(answers.selectedIngredientIds ?? []);
// ...
<IngredientPickerWidget selectedIds={ids} onChange={setIds} />
<Stack justify="flex-end" style={{ marginTop: 14 }}>
    <Button type="primary" onClick={() => onNext({ selectedIngredientIds: ids })}
        style={{ borderRadius: 20, paddingInline: 20 }}>
        Gợi ý món ({ids.length})
    </Button>
</Stack>
```

**Skip-with-default (D-04, RESEARCH §3):** a "Tùy bạn" button commits `{ selectedIngredientIds: [] }` then advances (empty → full-catalog fallback in result). The DishSuggester *disables* the advance button when nothing is selected (`:752`); the wizard must NOT — skipping is allowed.

**Sheet host (D-01, RESEARCH §8)** — verified `@components/Sheet` props `{ open, title, onClose, children, height?, data-testid? }`:
```tsx
import { Sheet } from "@components/Sheet";
<Sheet open={pickerOpen} title="Chọn nguyên liệu" onClose={...} data-testid="wizard-ingredient-sheet">
    <IngredientPickerWidget selectedIds={ids} onChange={setIds} />
</Sheet>
```

---

### `src/Modules/MealPlanning/Screens/WizardPreferenceStep.widget.tsx` (widget, request-response)

**Analog:** `DishSuggester.screen.tsx:600-645` (`NutritionGoalPicker` — single-choice pill/card picker with inline styles)

The lean preference step collects a `WizardPreferenceAnswers` subset (RESEARCH §5 recommends `preferredTags`). **Do not duplicate `HouseholdPreferenceProfile`** — the type is already `Partial<Pick<...>>` (verified `Wizard.ts:108`). The result is driven by `DishScorer.score` on ingredients, NOT the preference (RESEARCH §5 scoping note), so this step persists answers only.

Mirror `NutritionGoalPicker`'s selectable-card grid idiom (`:616-643`): `display: grid; gridTemplateColumns: repeat(auto-fit, minmax(...))`, active card = `2px solid {tone}` + tinted background, inline-styled `<button>`s. Commit on advance:
```tsx
onNext({ preferredTags: selectedTags });
```
Skip ("Tùy bạn") commits `{}` (neutral) and advances (D-04). Host the tag picker in a `Sheet` (§8).

---

### `src/Modules/MealPlanning/Screens/WizardResult.widget.tsx` (widget, transform + CRUD)

**Analog (presentation):** `SuggestionRow` (`Dashboard.screen.tsx:425-443`) — compact `ScoredDish` row.
**Analog (add-to-meal — CRITICAL):** `ScheduledMealAdd.widget.tsx` `transformFunc` (`:95-103`) + `onSubmit` dispatch (`:74-81`).

**Scoring — PINNED, READ-ONLY** (verified `DishScorer.ts:275-304`, returns pre-sorted by score desc then missing-count asc — do NOT re-sort):
```typescript
import { DishScorer, ScoredDish } from "@modules/DishSuggester/Helpers/DishScorer";
const scored = DishScorer.score(dishes, ids, dishes); // [] when ids.length === 0
```
`ScoredDish` shape (verified `DishScorer.ts:13-31`): `{ dish, score, matchedIngredientIds, missingIngredientIds, partialIngredientIds?, ... }`.

**Fallback ladder (D-08, RESEARCH §4)** — order matters:
```
(c) dishes.length === 0        → route to RootRoutes.AuthorizedRoutes.DishesRoutes.List()
                                  copy e.g. "Chưa có món nào — thêm món đầu tiên" (NOT inline composer)
(a) ids.length > 0 && scored.length > 0 → show scored.slice(0, N)   (N ≈ 5, RESEARCH §4)
(b) otherwise                  → full-catalog fallback dishes.slice(0, N)
```

**Result row reuse** (verified `Dashboard.screen.tsx:425-443` — uses `ActionRow`; for the wizard build a small purpose-built row rather than the suggester's coupled `DishSuggestionList`, RESEARCH §4):
```tsx
const matchPercent = Math.round(item.score * 100);
const accent = matchPercent >= 100 ? '#389e0d' : matchPercent >= 50 ? '#d48806' : '#d46b08';
const matchLabel = matchPercent >= 100 ? 'Đủ đồ' : matchPercent >= 50 ? 'Gần đủ' : 'Cần mua';
// row: item.dish.name + `${item.matchedIngredientIds.length} đủ · ${item.missingIngredientIds.length} thiếu`
```

**Add-to-meal — construct + dispatch inline (CRITICAL, RESEARCH §6, D-07).** Mirror the widget's `transformFunc` (`ScheduledMealAdd.widget.tsx:95-103`): `nanoid` id, `plannedDate` as a `Date`, full `meals` record. Default day = today (single-tap); slot default `'dinner'`. Verified action `addScheduledMeal(payload: ScheduledMeal)` (`ScheduledMealReducer.ts`) and model (`ScheduledMeal.ts:25-37`):
```tsx
import { nanoid } from "@reduxjs/toolkit";
import { addScheduledMeal } from "@store/Reducers/ScheduledMealReducer";
import { ScheduledMeal } from "@store/Models/ScheduledMeal";
import { useMessage } from "@components/Message";

const addDishToDay = (dish: Dishes, day: Date, slot: keyof ScheduledMeal["meals"] = 'dinner') => {
    const meal: ScheduledMeal = {
        id: nanoid(12),
        name: dish.name,
        plannedDate: day,
        meals: { breakfast: [], lunch: [], dinner: [], [slot]: [dish.id] },
        memberIds: [],
        dishServings: {},
        createdDate: new Date(),
    };
    dispatch(addScheduledMeal(meal));
    message.success("Đã thêm vào thực đơn");
    dispatch(completeWizard());
};
```
"Chọn ngày khác" reveals `@components/Form/DatePicker` (used by the widget at `:3,158`) inside a `Sheet`. `useMessage()` from `@components/Message` is the toast idiom (verified `ScheduledMealAdd.widget.tsx:6,77`). **Reads via selectors:** `selectDishes`, `selectWizardAnswers`.

---

### `src/Modules/MealPlanning/Components/WizardProgress.tsx` (component, request-response — partial analog)

**Closest analog:** `ModeTabs` (`DishSuggester.screen.tsx:550-591`) for the inline-styled segmented/pill chrome and the back-button idiom (`ActionButton shape="circle"` + `LeftOutlined`, `:543`, `backIconButtonStyle :432-439`).

No dedicated progress component exists in the codebase — build a small one (step dots/bar + a back affordance) in the inline-style idiom. Reuse the back-button pattern verbatim:
```tsx
import { LeftOutlined } from "@ant-design/icons";
import { ActionButton } from "@components/Button";
// back affordance (verified DishSuggester.screen.tsx:543 + :432-439)
<ActionButton shape="circle" height={40} aria-label="Quay lại" onClick={onBack} icon={<LeftOutlined />}
    style={{ width: 40, height: 40, minWidth: 40, paddingInline: 0, borderRadius: 999, color: "#595959" }} />
```
Add a `data-testid` for the progress indicator and back button (RESEARCH §10).

---

### `src/Routing/RootRoutes.ts` (config — MODIFY, exact self-analog)

**Analog:** the `AuthorizedRoutes` object and its sibling imports (`:1-5`, `:101-105`).

Add the import alongside the other route-config imports and register the object in `AuthorizedRoutes` (mirrors `ScheduledMealRoutes` at `:104`):
```typescript
import MealPlanningRoutes from '@modules/MealPlanning/Routing/MealPlanningRouteConfig';
// ...
const AuthorizedRoutes = {
    // ...existing...
    ScheduledMealRoutes,
    MealPlanningRoutes,
}
```

---

### `src/Routing/RootRouter.tsx` (route tree — MODIFY, exact self-analog)

**Analog:** the `ScheduledMealRoutes` sub-router block (`:78-84`) and its imports (`:24-25`).

Add imports (top, with the other module imports) and a sub-router `<Route>` inside the `Root()` layout tree (sibling to `:66-84`), child route under it (RESEARCH §2d recommends the sub-router wrapper for `<Container>` consistency):
```tsx
import { MealPlanningRouter } from "@modules/MealPlanning/Routing/MealPlanningRouter";
import { WizardScreen } from "@modules/MealPlanning/Screens/Wizard.screen";
// ...inside Root() layout <Route> tree, sibling to ScheduledMealRoutes block...
<Route path={RootRoutes.AuthorizedRoutes.MealPlanningRoutes.Root()} element={<MealPlanningRouter />}>
    <Route path={RootRoutes.AuthorizedRoutes.MealPlanningRoutes.Wizard()} element={<WizardScreen />} />
</Route>
```
**Note:** name the screen export consistently with the import (`WizardScreen`). `.Root()` is auto-exposed by `CreateRoutes` (used by every sub-router, e.g. `:66`).

---

### `src/Routing/Shell/BottomTabNavigator.tsx` (nav component — MODIFY, exact self-analog)

**Analog:** this file's own `onNavigate` helper (`:193-196`) and the other tab buttons (`:202-227`) that already route via it.

**Current state (verified):** center button toggles an in-place `DishSuggesterScreen` modal — `const toggleSuggester = useToggle()` (`:17`), button `onClick={toggleSuggester.show}` with `aria-pressed={toggleSuggester.value}` / `data-testid="bottom-tab-suggester"` (`:228-240`), and `{toggleSuggester.value && <DishSuggesterScreen .../>}` (`:269`).

**Change (D-02, NAV-04, RESEARCH §7a):** point the center button at the wizard route via the existing `onNavigate`/`navigateWithFeedback`. Compute the route alongside the others (`:19-22`) and swap the handler:
```tsx
const wizardRoute = RootRoutes.AuthorizedRoutes.MealPlanningRoutes.Wizard();
const wizardActive = isRouteActive(wizardRoute);
// center button:
//   onClick={() => onNavigate(wizardRoute)}
//   aria-pressed={wizardActive}
//   keep data-testid="bottom-tab-suggester" and aria-label (preserve for e2e)
```
Remove the `useToggle` import/usage and the trailing `<DishSuggesterScreen>` render block (`:17`, `:269`). **NAV-02 gate (RESEARCH §7a, §11):** the suggester stays reachable via the `/dish-suggester` sidebar route (`RootRouter.tsx:58`) — do NOT remove that. **Required e2e migration:** `tests/e2e/dish-suggester.spec.ts:9-10` clicks `bottom-tab-suggester` expecting the suggester — after this change it lands on the wizard; flag to planner (RESEARCH §10).

---

### `src/Modules/Home/Screens/Dashboard.screen.tsx` (screen — MODIFY, exact self-analog)

**Analog:** `DashboardHero` component (`:255-338`), its usage site (`:756-762`), and `openRoute` (`:537-539`).

**Reframe in place (D-09, Option A, RESEARCH §7b):** add a dedicated top CTA inside `DashboardHero` navigating to the wizard; keep the existing `priorityAction`/metrics content below (NAV-01 is entry-points-only). Pass a handler down from `DashboardScreen` (which has `openRoute` at `:537-539`):
```tsx
// in DashboardScreen render (mirror :756-762)
<DashboardHero
    item={priorityAction}
    dateLabel={dateLabel}
    mainValue={todayActionCount}
    mainLabel='việc cần nhìn trong hôm nay'
    metrics={heroMetrics}
    onStartJourney={() => openRoute(RootRoutes.AuthorizedRoutes.MealPlanningRoutes.Wizard())}
/>
```
Inside `DashboardHero`, add an `onStartJourney?: () => void` prop and render a dominant CTA button reusing the hero's existing white-pill button style (`:289`):
```tsx
<Button onClick={onStartJourney} style={{ borderRadius: 999, background: '#fff', borderColor: '#fff', color: '#5e2bbf', fontWeight: 750, boxShadow: '0 10px 22px rgba(34,17,83,0.18)' }}>
    Hôm nay ăn gì?
</Button>
```
Copy: "Hôm nay ăn gì?" (WIZ-01). Do NOT repurpose `priorityAction` (Option B is riskier — loses the urgency signal, RESEARCH §7b).

---

## Shared Patterns

### Selector-only reads (FND-03)
**Source:** `src/Store/Selectors.ts` (wizard family `:57-64`)
**Apply to:** every wizard screen/widget.
```typescript
selectWizard, selectWizardStep, selectWizardAnswers, selectWizardStatus, selectIsWizardResumable
// + selectDishes, selectIngredients, selectInventory for the result/ingredient steps
```
Never read `state.shared.*` / `state.personal.*` directly. Selectors provide safe fallbacks (`strict: false` — manual nullable guards elsewhere).

### Wizard action creators
**Source:** `src/Store/Reducers/WizardReducer.ts:63-70`
**Apply to:** all step screens + container.
`commitWizardAnswer(Partial<WizardAnswers>)`, `advanceWizardStep(key)`, `goBackWizardStep(key)`, `restartWizard()`, `completeWizard()`. Step commits its answer then advances; back dispatches `goBackWizardStep(prevKey)`; result dispatches `completeWizard()` after add.

### Bottom-sheet wrapper (D-01)
**Source:** `@components/Sheet` (re-exported from `@components/FastOverlay`; props verified `FastOverlay.tsx:312-323`)
**Apply to:** ingredient picker, preference tag picker, "chọn ngày khác" day picker.
```tsx
import { Sheet } from "@components/Sheet";
<Sheet open={open} title="..." onClose={...} data-testid="wizard-*-sheet">{children}</Sheet>
```

### Toast feedback
**Source:** `useMessage()` from `@components/Message` (verified `ScheduledMealAdd.widget.tsx:6,77`)
**Apply to:** result step add confirmation — `message.success("Đã thêm vào thực đơn")`.

### Inline-style + Vietnamese copy idiom
**Source:** `IngredientPicker.widget.tsx`, `DashboardHero`, `DishSuggester.screen.tsx` (pervasive `style={}` objects, no CSS modules)
**Apply to:** all new wizard UI. Write new strings in Vietnamese inline ("Hôm nay ăn gì?", "Tùy bạn", "Thêm vào hôm nay", "Chọn ngày khác", "Gợi ý món") — NO `AppCopy` migration (Phase 5).

### data-testid naming
**Source:** `bottom-tab-*` (`BottomTabNavigator.tsx`), `dashboard-suggestion-${id}` (`Dashboard.screen.tsx:430`), `nutrition-suggestion-item-${id}` (`DishSuggester.screen.tsx:670`)
**Apply to:** wizard container, each step, ingredient sheet, result list items, "thêm vào hôm nay", skip, back, progress (RESEARCH §10). Preserve `bottom-tab-suggester` on the center button.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/Modules/MealPlanning/Components/WizardProgress.tsx` | component | request-response | No dedicated progress/stepper component exists. Build new in the inline-style idiom; reuse `ModeTabs` (`DishSuggester.screen.tsx:550-591`) for segmented chrome and the `ActionButton`+`LeftOutlined` back-button (`:543`, `:432-439`). |

---

## Open Decisions Carried From RESEARCH §14 (planner resolves)

1. Add-to-meal slot — recommend `'dinner'` default + optional picker (D-07 single-tap).
2. Preference influence — recommend persist-only (lean ingredient-driven `score`); wiring `scoreCookNow` needs inventory + full profile.
3. "Top few" N — recommend 5.
4. Empty-catalog route — recommend `DishesRoutes.List()`.
5. Hero CTA — Option A (dedicated top CTA, keep `priorityAction` below).
6. WIZ-07 empty-catalog seed — add a `seedApp` empty variant vs. raw IndexedDB clear (note `my-recipes-welcome-complete-v1` flag, `seedApp.ts:69`).
7. Wizard sub-router vs. flat route — recommend sub-router wrapper.

---

## Metadata

**Analog search scope:** `src/Modules/{MealPlanning analogs: ScheduledMeal, DishSuggester, Home}`, `src/Routing/{Shell,Root*}`, `src/Store/{Selectors,Reducers,Models}`
**Files scanned:** 9 source files (route config/router pair, RootRoutes, RootRouter, BottomTabNavigator, IngredientPicker, DishSuggester screen, ScheduledMealAdd widget, Dashboard hero region, DishScorer types)
**Pattern extraction date:** 2026-06-16
