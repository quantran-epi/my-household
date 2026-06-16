import { expect, test } from './fixtures/appTest';
import { seedApp } from './fixtures/seedApp';
import { TEST_IDS } from './fixtures/testData';

// WIZ-07 headline acceptance: a first-timer reaches a scheduled meal through the wizard.
// Two scenarios prove the metric end-to-end:
//   1. POPULATED cold-start — Home/center → wizard → result → add → scheduledMeal exists.
//   2. EMPTY catalog — a first-timer with no dishes is routed to add their first dish
//      instead of hitting a dead-end.
//
// NAV-03 (global search still reaches existing features after the nav reframe) is covered
// by `global-search.spec.ts`, which is unchanged this phase — it is intentionally not
// re-asserted here.
//
// Entry is the repointed center button (`bottom-tab-suggester` → /meal-planning/wizard,
// NAV-04). We skip the ingredient/preference steps to land on the result step via the
// full-catalog fallback; we do NOT re-assert DishScorer ranking (pinned upstream).

test.describe('WIZ-07 wizard cold-start', () => {
  test('populated: center button → wizard → result → adds a scheduled meal for today', async ({ page }) => {
    // The default regression seed already schedules `Com ga regression` for today, so we
    // add a DIFFERENT catalog dish (`Canh nuoc regression`) through the wizard — its
    // presence on the meal list afterward proves the wizard created the scheduled meal.
    const targetDishId = TEST_IDS.dishes.waterSoup;
    const targetDishName = 'Canh nuoc regression';

    await page.goto('./');
    await expect(page.getByTestId('dashboard')).toBeVisible();

    // NAV-04: the center button now routes into the guided wizard.
    await page.getByTestId('bottom-tab-suggester').click();
    await expect(page.getByTestId('wizard-screen')).toBeVisible();

    // Skip ingredients + preferences to reach the result step via the full-catalog fallback.
    await page.getByTestId('wizard-skip-ingredients').click();
    await expect(page.getByTestId('wizard-step-preferences')).toBeVisible();
    await page.getByTestId('wizard-skip-preferences').click();

    await expect(page.getByTestId('wizard-step-result')).toBeVisible();
    await expect(page.getByTestId(`wizard-result-item-${targetDishId}`)).toBeVisible();

    await page.getByTestId(`wizard-add-today-${targetDishId}`).click();
    await expect(page.getByText('Đã thêm vào thực đơn')).toBeVisible();

    // The added dish must now appear on today's scheduled-meal list (defaults to today).
    await page.goto('scheduledMeal/list');
    await expect(page.getByText(targetDishName)).toBeVisible({ timeout: 10_000 });
  });

  test('empty catalog: wizard routes a first-timer to add their first dish', async ({ page }) => {
    // Re-seed this page with an empty catalog (Task 1). The welcome-complete flag is still
    // set inside seedApp, so a cold-start lands on the app rather than /guide/welcome.
    await seedApp(page, { emptyCatalog: true });

    await page.goto('./');
    await expect(page.getByTestId('dashboard')).toBeVisible();

    await page.getByTestId('bottom-tab-suggester').click();
    await expect(page.getByTestId('wizard-screen')).toBeVisible();

    await page.getByTestId('wizard-skip-ingredients').click();
    await expect(page.getByTestId('wizard-step-preferences')).toBeVisible();
    await page.getByTestId('wizard-skip-preferences').click();

    // No dishes → never a dead-end; the empty-catalog state offers adding the first dish.
    await expect(page.getByTestId('wizard-empty-catalog')).toBeVisible();
    await page.getByRole('button', { name: 'Thêm món đầu tiên' }).click();
    await expect(page).toHaveURL(/\/dishes\/list/);
  });
});
