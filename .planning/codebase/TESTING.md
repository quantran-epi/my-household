# Testing Patterns

**Analysis Date:** 2026-06-14

## Test Framework

**Unit/Component Runner:**
- Jest via `react-scripts test` (CRA's built-in Jest config). No standalone `jest.config.*` file.
- React Testing Library (`@testing-library/react` ^13.4.0) for component rendering.
- `@testing-library/user-event` ^13.5.0 for interaction simulation (available; not yet used in committed tests).

**Assertion Library:**
- Jest `expect` plus `@testing-library/jest-dom` custom matchers (`toBeInTheDocument`, `toHaveTextContent`). Imported globally in `src/setupTests.ts`.

**E2E Runner:**
- Playwright (`@playwright/test` ^1.60.0). Config: `playwright.config.ts`.

**Run Commands:**
```bash
yarn test                        # Jest unit/component tests (watch by default via CRA)
yarn test:e2e                    # Playwright e2e suite
yarn test:e2e:report             # Open the last Playwright HTML report
yarn test:e2e:performance        # Performance regression spec only
yarn test:e2e:performance:baseline    # Capture a performance baseline
yarn test:e2e:performance:diagnostic  # Run with tracing on (PERF_DIAGNOSTIC=1)
yarn test:e2e:performance:phase3 # Scenario runner via runPerformanceCommand.cjs
```
No coverage script is defined; use `react-scripts test --coverage` ad hoc.

## Test File Organization

**Unit tests (Jest):**
- Co-located with source using `.test.ts(x)`: `src/App.test.tsx`, `src/Store/Reducers/CookingSessionReducer.test.ts`.
- Coverage is sparse — only two unit tests exist across 286 `.ts(x)` source files. Reducers are the primary unit-tested layer.

**E2E tests (Playwright):**
- Live under `tests/e2e/` as `*.spec.ts`: `shopping-list.spec.ts`, `dashboard.spec.ts`, `dish-suggester.spec.ts`, `global-search.spec.ts`, `app-shell-navigation.spec.ts`, `dish-serving-and-modal.spec.ts`, `performance-baseline.spec.ts`, `performance-regression.spec.ts`.
- Shared helpers and seed data live in `tests/e2e/fixtures/`.

**Structure:**
```
src/
  App.test.tsx                              # smoke render test
  Store/Reducers/CookingSessionReducer.test.ts   # reducer unit test
tests/e2e/
  *.spec.ts                                 # Playwright specs
  runPerformanceCommand.cjs                 # perf scenario CLI wrapper
  fixtures/
    appTest.ts            # extended `test` that auto-seeds the page
    seedApp.ts            # writes persisted state into IndexedDB before each test
    testData.ts           # regression dataset + TEST_IDS
    performanceSeed.ts     # large datasets for perf runs
    performanceNetwork.ts  # network throttling/mode helpers
    performanceReport.ts   # perf metric reporting
```

## Test Structure

**Suite Organization (unit):**
```typescript
jest.mock('nanoid', () => ({ nanoid: () => 'test-id' }));

import reducer, { clearCookingHistory } from './CookingSessionReducer';
import type { CookingSessionState } from './CookingSessionReducer';

describe('CookingSessionReducer', () => {
    it('keeps durable feedback and cook-time data when clearing cooking history', () => {
        const initialState: CookingSessionState = { /* full hand-built fixture */ };
        const nextState = reducer(initialState, clearCookingHistory());
        expect(nextState.sessions).toHaveLength(1);
        expect(nextState.cookTimeStats).toEqual(initialState.cookTimeStats);
    });
});
```

**Suite Organization (e2e):**
```typescript
import { expect, test } from './fixtures/appTest';
import { TEST_IDS } from './fixtures/testData';

const openShoppingList = async (page: Page) => {
  await page.goto(`shoppingList/detail?shoppingList=${TEST_IDS.shoppingLists.regression}`);
  await expect(page.getByRole('heading', { name: 'Regression shopping list' })).toBeVisible();
};

test.describe('Shopping list detail', () => {
  test('keeps grouped recipe amounts ...', async ({ page }) => {
    await openShoppingList(page);
    const chicken = page.getByTestId(`shopping-list-ingredient-${TEST_IDS.ingredients.chicken}`);
    await expect(chicken).toContainText('Cần 700g');
  });
});
```

**Patterns:**
- Unit tests build the full state object inline (no shared factories) and assert against `reducer(state, action)` output.
- E2E tests use `test.describe` blocks with a local navigation helper, then drive the real UI.
- Element selection prefers `getByTestId` (with IDs from `TEST_IDS`) and `getByRole` with Vietnamese accessible names (`getByRole('button', { name: /Hoàn tất mua sắm/ })`).
- Assertions are mostly `expect(locator).toContainText(...)` / `.toBeVisible()` / `.toBeChecked()`.

## Mocking

**Framework:** Jest (`jest.mock`) for unit tests; Playwright network interception for e2e.

**Patterns (unit):**
```typescript
// Make nanoid deterministic so generated IDs are assertable
jest.mock('nanoid', () => ({ nanoid: () => 'test-id' }));
```

**Patterns (e2e):**
- No component mocking. Tests run the full app against a real dev server (`webServer.command: 'npm start'` in `playwright.config.ts`).
- State is injected by seeding IndexedDB directly before navigation rather than mocking modules — see `seedApp.ts`, which writes `persist:shared` / `persist:personal` blobs, clears `localStorage`/`sessionStorage`, and unregisters service workers + caches.
- Network behavior is shaped via `performanceNetwork.ts` (`applyPerformanceNetworkMode`) for performance specs.

**What to Mock:**
- Non-deterministic primitives in unit tests (ID generators like `nanoid`; mock `Date.now`/timers when asserting timer math).

**What NOT to Mock:**
- The store, persistence, or UI components in e2e — seed real persisted state and exercise the real app instead.

## Fixtures and Factories

**Auto-seeding fixture** (`tests/e2e/fixtures/appTest.ts`):
```typescript
export const test = base.extend({
  page: async ({ page }, use) => {
    await seedApp(page);   // every test starts with the regression dataset loaded
    await use(page);
  },
});
```
Import `test`/`expect` from `./fixtures/appTest` (not directly from `@playwright/test`) so seeding runs automatically.

**Test data** (`tests/e2e/fixtures/testData.ts`):
- Declares local `Test*` types mirroring store models (independent from `src/` types to keep fixtures decoupled).
- Exposes `TEST_IDS` for stable selector references and `createRegressionSeed()` for the default dataset.
- `createPerformanceSeed(dataset)` / `performanceSeed.ts` provide large datasets for perf runs.

**Location:** All fixtures and factories live in `tests/e2e/fixtures/`. Unit tests use inline state objects, not shared factories.

## Coverage

**Requirements:** None enforced. No coverage threshold or `--coverage` script.

**View Coverage:**
```bash
yarn test --coverage --watchAll=false
```

## Test Types

**Unit Tests:**
- Reducer-level only so far (`CookingSessionReducer.test.ts`). Pure functions in `src/Common/Helpers/` and selectors in `src/Store/Selectors.ts` are good candidates but currently untested.

**Component Tests:**
- One smoke test (`src/App.test.tsx`) using `render` + `screen.getByText`. Note: it asserts on `/learn react/i`, the CRA default string — likely stale relative to the actual UI.

**Integration / E2E Tests:**
- Playwright specs cover real user flows (shopping list, dashboard, dish suggester, global search, navigation, modals) against a seeded app.

**Performance Tests:**
- Dedicated specs (`performance-baseline.spec.ts`, `performance-regression.spec.ts`) with baseline capture, network shaping, and reporting helpers; driven via `runPerformanceCommand.cjs`.

## Common Patterns

**Async Testing (e2e):**
```typescript
test('...', async ({ page }) => {
  await openShoppingList(page);
  await page.getByRole('tab', { name: /Chi phí/ }).click();
  await expect(page.getByTestId('shopping-list-cost-tab')).toBeVisible();
});
```

**Layout/geometry assertions (e2e):**
```typescript
const [contentBox, itemBox] = await Promise.all([appContent.boundingBox(), lastItem.boundingBox()]);
expect(itemBox!.y + itemBox!.height).toBeLessThanOrEqual(contentBox!.y + contentBox!.height + 1);
```

**Reducer state assertions (unit):**
```typescript
const nextState = reducer(initialState, clearCookingHistory());
expect(nextState.sessions).toHaveLength(1);
expect(nextState.dishFeedback).toEqual(initialState.dishFeedback);
```

**Notes for new tests:**
- Add reducer tests beside the reducer as `*.test.ts`; mock `nanoid` for deterministic IDs.
- Add e2e flows under `tests/e2e/` importing from `./fixtures/appTest`; extend `TEST_IDS`/seed data in `fixtures/` rather than hardcoding ids.
- The Playwright base URL is `http://localhost:3010/my-recipes/`; `goto` paths are relative to that base.

---

*Testing analysis: 2026-06-14*
