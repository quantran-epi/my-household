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

  // IOS-02: the pill's bottom edge must sit at or above the nav's top edge so it clears the
  // safe-area-raised bottom nav and the home indicator. The real home-indicator inset is
  // non-zero only on notched hardware (manual-only per VALIDATION); this asserts the no-overlap
  // geometry the safeAreaInset.bottom(bottomNavHeight) rebase guarantees. Run via
  // `--project=mobile-safari` (devices['iPhone 13'], hasTouch+isMobile).
  test('the floating pill clears the bottom nav (no overlap) on mobile-safari', async ({ page }) => {
    await page.goto('./');

    const pill = page.getByTestId('active-cooking-floating-button');
    const nav = page.getByTestId('bottom-tab-navigator');
    await expect(pill).toBeVisible();
    await expect(nav).toBeVisible();

    const pillBox = await pill.boundingBox();
    const navBox = await nav.boundingBox();
    expect(pillBox).not.toBeNull();
    expect(navBox).not.toBeNull();

    // Pill's bottom edge sits above (or at) the nav's top edge — +1px tolerance for sub-pixel rounding.
    expect(pillBox!.y + pillBox!.height).toBeLessThanOrEqual(navBox!.y + 1);
  });
});
