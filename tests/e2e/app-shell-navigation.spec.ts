import type { Page } from '@playwright/test';
import { expect, test } from './fixtures/appTest';

const routeFeedback = (page: Page) => page.getByTestId('app-route-feedback');

test.describe('App-shell navigation', () => {
  test('shows drawer primary navigation, deferred tools, and the backup-center modal', async ({ page }) => {
    await page.goto('dishes/list');
    await expect(page.getByTestId('dish-virtual-list')).toBeVisible();

    // Bottom-tab active state reflects the current route (we are on dishes/list).
    const bottomTabs = page.getByTestId('bottom-tab-navigator');
    await expect(bottomTabs).toBeVisible();
    await expect(page.getByTestId('bottom-tab-dishes')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('bottom-tab-scheduled-meals')).toHaveAttribute('aria-pressed', 'false');

    await page.getByTestId('sidebar-drawer-button').click();
    const primaryNav = page.getByTestId('sidebar-drawer-primary-nav');
    await expect(primaryNav).toBeVisible();
    await expect(primaryNav).toContainText('Tổng quan');
    await expect(primaryNav).toContainText('Nguyên liệu');
    await expect(primaryNav).toContainText('Món ăn');
    // Source label is "Tính chi phí" (MasterPage.tsx) — the stale spec asserted a label
    // that does not exist in current source.
    await expect(primaryNav).toContainText('Tính chi phí');
    await expect(primaryNav).toContainText('Lịch mua sắm');
    await expect(primaryNav).toContainText('Thực đơn');
    // "Lịch sử nấu ăn" is a primary-nav item, not a tools-region item.
    await expect(primaryNav).toContainText('Lịch sử nấu ăn');

    const tools = page.getByTestId('sidebar-drawer-tools');
    // Genuinely-present tools entries (rendered after the deferred-frames gate).
    await expect(tools).toContainText('Hướng dẫn sử dụng', { timeout: 5_000 });
    await expect(tools).toContainText('Dữ liệu & sao lưu');
    await expect(tools.getByText(/Đăng nhập Admin|Đang ở chế độ Admin/)).toBeVisible();

    // "Đồng bộ mới" and "Sao lưu cá nhân" live inside the backup-center modal that
    // only opens after clicking "Dữ liệu & sao lưu" — they are NOT in the always-rendered tools region.
    await tools.getByRole('button', { name: 'Dữ liệu & sao lưu' }).click();
    // Scope to the backup-center modal specifically: getByRole('dialog') also matches the
    // always-open sidebar drawer (an <aside>). The modal renders as a <section role="dialog">,
    // so target that element to avoid the strict-mode collision with the drawer.
    const backupModal = page.locator('section[role="dialog"]');
    await expect(backupModal).toContainText('Đồng bộ mới', { timeout: 5_000 });
    await expect(backupModal).toContainText('Sao lưu cá nhân');
  });

  test('does not leave route feedback visible after same-route drawer close or completed navigation', async ({ page }) => {
    await page.goto('dishes/list');
    await expect(page.getByTestId('dish-virtual-list')).toBeVisible();

    await page.getByTestId('sidebar-drawer-button').click();
    await expect(page.getByTestId('sidebar-drawer-primary-nav')).toBeVisible();
    await page.getByTestId('sidebar-nav-dishes').click();
    await expect(routeFeedback(page)).toHaveCount(0);

    await page.getByTestId('sidebar-drawer-button').click();
    await expect(page.getByTestId('sidebar-nav-shoppingList')).toBeVisible();
    await page.getByTestId('sidebar-nav-shoppingList').click({ force: true, noWaitAfter: true });
    await expect(page.getByTestId('shopping-list-virtual-list')).toBeVisible({ timeout: 5_000 });
    await expect(routeFeedback(page)).toHaveCount(0, { timeout: 3_000 });

    await page.getByRole('button', { name: /^Món ăn$/ }).click();
    await expect(page.getByTestId('dish-virtual-list')).toBeVisible({ timeout: 5_000 });
    await expect(routeFeedback(page)).toHaveCount(0, { timeout: 3_000 });
  });
});
