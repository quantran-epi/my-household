import { expect, test } from './fixtures/appTest';
import { TEST_IDS } from './fixtures/testData';

test.describe('Dish suggestor', () => {
  // NAV-02 reachability gate: after 04-04 repointed the center `bottom-tab-suggester`
  // button to the wizard route, the in-place suggester must STILL be reachable via its
  // surviving entry — the `/dish-suggester` sidebar route (sidebar-nav-dishSuggester →
  // DishSuggesterPageScreen). This spec proves that entry works and the expense-planner
  // action is still reachable from the suggester results. The page renders the suggester
  // with actionMode='modal', so the expense action opens an in-place modal rather than
  // navigating to /expense-planner.
  test('reaches the in-place suggester via /dish-suggester and opens the expense planner', async ({ page }) => {
    await page.goto('dish-suggester');
    await expect(page.getByTestId('dish-suggester-page')).toBeVisible();
    await expect(page.getByText('Hôm nay nấu gì?').first()).toBeVisible();

    // The page opens directly in inventory ("Tủ lạnh") mode; selecting it explicitly keeps
    // the spec robust against the initial-mode default.
    await page.getByRole('button', { name: /Tủ lạnh/ }).click();
    const suggestionItem = page.getByTestId(`dish-suggestion-item-${TEST_IDS.dishes.comGa}`);
    await expect(suggestionItem).toBeVisible({ timeout: 10_000 });
    await suggestionItem.click();
    await expect(page.getByTestId('dish-suggester-selected-count')).toHaveText('(1)');

    // Expense planner now lives behind the "more actions" dropdown (ResultsActions surface),
    // and in modal action-mode it opens an in-place modal instead of navigating.
    const moreActions = page.getByTestId('dish-suggester-more-actions-button');
    await expect(moreActions).toBeEnabled();
    await moreActions.click();
    await page.getByRole('menuitem', { name: /Tính chi phí/ }).click();

    // The expense planner opens as an in-place modal (actionMode='modal'); scope assertions
    // to that dialog via its modal-only heading ("Món cần tính") so the always-open sidebar
    // drawer (also role=dialog) and the bottom-nav "Tính chi phí" label can't satisfy them.
    const expenseModal = page.getByRole('dialog').filter({ hasText: 'Món cần tính' });
    await expect(expenseModal).toBeVisible({ timeout: 10_000 });
    await expect(expenseModal.getByText('Com ga regression')).toBeVisible();
  });
});
