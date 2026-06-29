import { expect, test } from './fixtures/appTest';

// SheetPicker touch-gesture e2e (08-06). Runs on the WebKit/iPhone `mobile-safari`
// project so the Phase 7 pointer-drag reducer and the Wave-1/2 picker commit/revert
// flows receive REAL pointer events in a hasTouch/isMobile context — the integration
// proof jsdom cannot give (08-RESEARCH §Validation Architecture: gestures live in e2e,
// selection/draft logic lives in the units, which already cover it).
//
// Every assertion checks POST-gesture state (sheet present/absent, trigger summary
// text) — never a mid-drag transform, which is timing-flaky.
//
// The four pickers are mounted by the test-only fixture route /__sheet-picker-fixture
// (src/Routing/SheetPickerFixture.screen.tsx), which the product screens do not expose
// deterministically.

const FIXTURE_ROUTE = '__sheet-picker-fixture';
const GRABBER_LABEL = 'Kéo để đóng';
const OVERLAY = '.my-recipes-fast-overlay';

/**
 * Drag a sheet's grabber straight down by `deltaPx` using real pointer events.
 * Copied from native-sheet.spec.ts (e2e uses 2-space indent per CONVENTIONS): the
 * grabber is always a drag handle, so this exercises the full pointerdown →
 * pointermove* → pointerup → dragDecision path. mouse.up lands at the last move
 * position, so release velocity is ~0 — outcomes are decided by distance vs the 40%
 * threshold.
 */
const dragGrabberDown = async (
  page: import('@playwright/test').Page,
  sheetTestId: string,
  deltaPx: number,
  steps = 12,
) => {
  const grabber = page.getByTestId(sheetTestId).getByRole('button', { name: GRABBER_LABEL });
  const box = await grabber.boundingBox();
  expect(box, `grabber for ${sheetTestId} should have a box`).not.toBeNull();
  const startX = box!.x + box!.width / 2;
  const startY = box!.y + box!.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  for (let i = 1; i <= steps; i += 1) {
    await page.mouse.move(startX, startY + (deltaPx * i) / steps);
  }
  await page.mouse.up();
};

const sheetHeight = async (page: import('@playwright/test').Page, sheetTestId: string) => {
  const box = await page.getByTestId(sheetTestId).boundingBox();
  expect(box, `${sheetTestId} should have a box`).not.toBeNull();
  return box!.height;
};

test.describe('SheetPicker touch gestures (WebKit/iPhone)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FIXTURE_ROUTE);
    await expect(page.getByTestId('sheet-picker-fixture')).toBeVisible({ timeout: 15_000 });
  });

  test('SheetSelect: tap-to-commit dismisses and updates the trigger (PICK-01)', async ({ page }) => {
    // Open the single-select sheet from its closed trigger.
    await page.getByTestId('select-field').getByRole('button').click();
    await expect(page.locator(OVERLAY)).toHaveCount(1);

    // Tap an option row: single-select commits on tap → auto-dismiss (D-05).
    await page.getByRole('option', { name: 'Phở bò' }).click();

    // Sheet (and its backdrop) torn down, and the closed trigger now shows the pick.
    await expect(page.locator(OVERLAY)).toHaveCount(0);
    await expect(page.getByTestId('select-field')).toContainText('Phở bò');
  });

  test('SheetMultiSelect: stays open, "Xong (N)" reflects count and commits (PICK-03)', async ({ page }) => {
    await page.getByTestId('multiselect-field').getByRole('button').click();
    const sheet = page.getByTestId('sheet-multiselect');
    await expect(sheet).toBeVisible();

    // Toggle two checkbox rows: the sheet must STAY open (draft editing, not auto-commit).
    await sheet.locator('label').filter({ hasText: 'Buổi sáng' }).click();
    await sheet.locator('label').filter({ hasText: 'Buổi trưa' }).click();
    await expect(sheet).toBeVisible();

    // The commit button label reflects the live draft count.
    const done = sheet.getByRole('button', { name: /^Xong/ });
    await expect(done).toHaveText('Xong (2)');

    // Commit: sheet dismisses and the trigger shows the multi summary (first + "+N").
    await done.click();
    await expect(sheet).toHaveCount(0);
    await expect(page.getByTestId('multiselect-field')).toContainText('Buổi sáng');
  });

  test('SheetMultiSelect: "Hủy" reverts and a dirty drag-dismiss springs back (PICK-04)', async ({ page }) => {
    const trigger = () => page.getByTestId('multiselect-field').getByRole('button').first();

    // Flow 1: toggle (dirty) then "Hủy" → draft discarded, trigger reverts to placeholder.
    await trigger().click();
    const sheet = page.getByTestId('sheet-multiselect');
    await expect(sheet).toBeVisible();
    await sheet.locator('label').filter({ hasText: 'Buổi tối' }).click();
    await sheet.getByRole('button', { name: 'Hủy' }).click();

    await expect(sheet).toHaveCount(0);
    // Reverted: the trigger shows the placeholder, never the toggled label.
    await expect(page.getByTestId('multiselect-field')).toContainText('Chọn bữa');
    await expect(page.getByTestId('multiselect-field')).not.toContainText('Buổi tối');

    // Flow 2: toggle (dirty) then drag the grabber past the 40% threshold. A dirty
    // multiselect is maskClosable={false}, so the drag must spring back — the draft
    // cannot be lost via an accidental drag-dismiss (PICK-04 / Phase 7 D-04).
    await trigger().click();
    await expect(sheet).toBeVisible();
    await sheet.locator('label').filter({ hasText: 'Buổi sáng' }).click();
    await expect(sheet.getByTestId('sheet-multiselect-dirty')).toHaveAttribute('data-dirty', 'true');

    const height = await sheetHeight(page, 'sheet-multiselect');
    await dragGrabberDown(page, 'sheet-multiselect', height * 0.7);

    // Dirty sheet survives the over-threshold drag (spring-back, draft intact).
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole('button', { name: /^Xong/ })).toHaveText('Xong (1)');
  });
});
