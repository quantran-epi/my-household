import { expect, test } from './fixtures/appTest';

test.describe('Cooking pill', () => {
  test('renders the floating pill for a seeded cooking session and opens the cooking modal', async ({ page }) => {
    await page.goto('./');

    // The seed contains a single status:"cooking" session, so the floating pill renders.
    const pill = page.getByTestId('active-cooking-floating-button');
    await expect(pill).toBeVisible();
    // Single active session => the pill surfaces the focused dish name.
    await expect(pill).toContainText('Com ga regression');

    // Clicking the pill (single session) opens the cooking modal with the CookingSessionWidget.
    await pill.click();
    const cookingModal = page.locator('section[role="dialog"]', { hasText: 'Đang nấu' });
    await expect(cookingModal).toBeVisible();
    // The widget renders the seeded dish content (the active session's step text).
    await expect(cookingModal).toContainText('So che ga va uop gia vi.');
  });
});
