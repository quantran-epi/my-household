import { expect, test } from '@playwright/test';

test.describe('Error boundary', () => {
  test('a render-phase throw shows the Vietnamese recovery UI instead of a white screen', async ({ page }) => {
    // The /__crash-test route renders a component that throws during render
    // (not in an event handler), which is exactly what a React error boundary
    // catches. The top-level ErrorBoundary around RootRouter should swap in the
    // recovery fallback rather than white-screening the app. No seeded data is
    // needed: the throw happens in the render body regardless of store state, so
    // this spec deliberately skips the seedApp fixture and boots the app fresh.
    await page.goto('./__crash-test');

    const reloadButton = page.getByRole('button', { name: 'Tải lại trang' });
    await expect(reloadButton).toBeVisible();
    await expect(reloadButton).toBeEnabled();

    await expect(page.getByText('Ứng dụng gặp chút trục trặc rồi')).toBeVisible();
  });
});
