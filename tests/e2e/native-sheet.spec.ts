import { expect, test } from './fixtures/appTest';

// Native Sheet touch-gesture e2e (07-03). Runs on the WebKit/iPhone `mobile-safari`
// project so the 07-02 pointer-drag reducer (setPointerCapture + dragDecision)
// receives real pointer events in a hasTouch/isMobile context — the integration
// proof chromium-without-touch cannot give.
//
// Gestures are driven by page.mouse (move/down/move*/up): genuine pointerdown/
// pointermove/pointerup the Sheet's onPointerDown/onPointerMove/onPointerUp
// handlers consume, dispatched through the browser input pipeline (the same path
// that makes real clicks reach React handlers inside the body-portaled Sheet).
// Every assertion checks POST-gesture state (sheet present/absent, body scrollTop,
// body scroll-lock, z-stacking, computed padding/height) — never a mid-drag
// transform, which is timing-flaky.
//
// Sheet variants are mounted by the test-only fixture route
// /__sheet-gesture-fixture (src/Routing/SheetGestureFixture.screen.tsx), which the
// product screens do not expose deterministically (maskClosable=false, nested A→B).

const FIXTURE_ROUTE = '__sheet-gesture-fixture';
const GRABBER_LABEL = 'Kéo để đóng';

/**
 * Drag a sheet's grabber straight down by `deltaPx` using real pointer events.
 * The grabber is always a drag handle (reducer branch B1), so this exercises the
 * full pointerdown → pointermove* → pointerup → dragDecision path. mouse.up lands
 * at the last move position, so the release velocity is ~0 — outcomes are decided
 * by distance vs the 40% threshold, which is what these flows assert.
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

/** Drag the scroll body straight down by `deltaPx` (reducer branch B3 at top). */
const dragBodyDown = async (
  page: import('@playwright/test').Page,
  sheetTestId: string,
  deltaPx: number,
  steps = 12,
) => {
  const body = page.getByTestId(sheetTestId).locator('.my-recipes-fast-overlay__body');
  const box = await body.boundingBox();
  expect(box, `body for ${sheetTestId} should have a box`).not.toBeNull();
  const startX = box!.x + box!.width / 2;
  const startY = box!.y + 8;

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

test.describe('Native Sheet touch gestures (WebKit/iPhone)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FIXTURE_ROUTE);
    await expect(page.getByTestId('sheet-gesture-fixture')).toBeVisible({ timeout: 15_000 });
  });

  test('drag past 40% dismisses (SHEET-01/02)', async ({ page }) => {
    await page.getByTestId('open-basic-sheet').click();
    const sheet = page.getByTestId('sheet-basic');
    await expect(sheet).toBeVisible();

    const height = await sheetHeight(page, 'sheet-basic');
    // Past the 40% distance threshold (reducer D2) → dismiss.
    await dragGrabberDown(page, 'sheet-basic', height * 0.7);

    await expect(sheet).toHaveCount(0);
    // Backdrop overlay torn down with the sheet.
    await expect(page.locator('.my-recipes-fast-overlay')).toHaveCount(0);
  });

  test('drag under 40% springs back (SHEET-01/02)', async ({ page }) => {
    await page.getByTestId('open-basic-sheet').click();
    const sheet = page.getByTestId('sheet-basic');
    await expect(sheet).toBeVisible();

    const height = await sheetHeight(page, 'sheet-basic');
    // Short pull below the threshold and low release velocity (reducer D4) → spring back.
    await dragGrabberDown(page, 'sheet-basic', height * 0.2);

    await expect(sheet).toBeVisible();
    await expect(page.getByTestId('sheet-basic-body')).toBeVisible();
  });

  test('scroll-then-drag keeps sheet open then dismisses at top (SHEET-03)', async ({ page }) => {
    await page.getByTestId('open-scroll-sheet').click();
    const sheet = page.getByTestId('sheet-scroll');
    await expect(sheet).toBeVisible();

    const body = sheet.locator('.my-recipes-fast-overlay__body');
    // Scroll the list away from the top: a downward body drag must now be consumed
    // by native scroll, not the sheet (reducer B5) — the sheet stays open.
    await body.evaluate((el) => { el.scrollTop = 200; });
    const scrolledTop = await body.evaluate((el) => el.scrollTop);
    expect(scrolledTop).toBeGreaterThan(0);

    const height = await sheetHeight(page, 'sheet-scroll');
    await dragBodyDown(page, 'sheet-scroll', height * 0.7);

    await expect(sheet).toBeVisible();
    // Still scrolled (the drag did not dismiss; list position preserved).
    expect(await body.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);

    // Reset to the very top: the same downward body drag now dismisses (reducer B3 + D2).
    await body.evaluate((el) => { el.scrollTop = 0; });
    await dragBodyDown(page, 'sheet-scroll', height * 0.7);

    await expect(sheet).toHaveCount(0);
  });

  test('maskClosable=false springs back (SHEET-04)', async ({ page }) => {
    await page.getByTestId('open-protected-sheet').click();
    const sheet = page.getByTestId('sheet-protected');
    await expect(sheet).toBeVisible();

    const height = await sheetHeight(page, 'sheet-protected');
    // Over-threshold drag on a protected sheet: reducer D1 short-circuits to spring-back.
    await dragGrabberDown(page, 'sheet-protected', height * 0.8);

    await expect(sheet).toBeVisible();
    // The non-gesture affordance (grabber) is still present after the protected drag.
    await expect(sheet.getByRole('button', { name: GRABBER_LABEL })).toBeVisible();
    // Body keeps its bottom padding (safe-area floor) — layout intact, not collapsed.
    const paddingBottom = await sheet
      .locator('.my-recipes-fast-overlay__body')
      .evaluate((el) => parseFloat(getComputedStyle(el).paddingBottom));
    expect(paddingBottom).toBeGreaterThanOrEqual(16);
  });

  test('nested sheet stacks and dismisses independently (SHEET-06)', async ({ page }) => {
    await page.getByTestId('open-nested-a').click();
    const sheetA = page.getByTestId('sheet-nested-a');
    await expect(sheetA).toBeVisible();

    await page.getByTestId('open-nested-b').click();
    const sheetB = page.getByTestId('sheet-nested-b');
    await expect(sheetB).toBeVisible();

    // B stacks above A: its backdrop overlay carries a higher resolved z-index.
    const zIndexOf = (testId: string) =>
      page.getByTestId(testId).evaluate((el) => Number(getComputedStyle(el.parentElement as Element).zIndex));
    expect(await zIndexOf('sheet-nested-b')).toBeGreaterThan(await zIndexOf('sheet-nested-a'));

    // Body is scroll-locked while the stack is open.
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');

    // Dismiss B independently; A must remain open and still scroll-locked.
    const heightB = await sheetHeight(page, 'sheet-nested-b');
    await dragGrabberDown(page, 'sheet-nested-b', heightB * 0.7);

    await expect(sheetB).toHaveCount(0);
    await expect(sheetA).toBeVisible();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  });

  test('safe-area + dvh layout on iPhone (SHEET-05)', async ({ page }) => {
    await page.getByTestId('open-basic-sheet').click();
    const sheet = page.getByTestId('sheet-basic');
    await expect(sheet).toBeVisible();

    // The sheet enters via a 180ms slide-in (translateY 24px → 0). Measuring
    // layout mid-animation reports a bottom edge below the viewport. Wait for
    // the transform to settle at the rest position (translateY ≈ 0) before
    // asserting geometry. The resting transform computes to the identity
    // matrix `matrix(1, 0, 0, 1, 0, 0)`, whose 6th component is translateY.
    await expect
      .poll(async () =>
        sheet.evaluate((el) => {
          const t = getComputedStyle(el).transform;
          if (t === 'none') return 0;
          const m = t.match(/matrix\(([^)]+)\)/);
          if (!m) return 999;
          return Math.abs(parseFloat(m[1].split(',')[5]));
        }),
      )
      .toBeLessThan(0.5);

    const viewport = page.viewportSize()!;
    const box = await sheet.boundingBox();
    expect(box).not.toBeNull();
    // dvh-capped height is not clipped by the URL bar (top on-screen)…
    expect(box!.y).toBeGreaterThanOrEqual(-1);
    // …and the sheet bottom sits within the viewport (clears the home indicator area).
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);

    // Body bottom padding provides at least the 16px floor (env(safe-area-inset-bottom)
    // adds more on a physically notched device; headless reports 0 for the inset).
    const paddingBottom = await sheet
      .locator('.my-recipes-fast-overlay__body')
      .evaluate((el) => parseFloat(getComputedStyle(el).paddingBottom));
    expect(paddingBottom).toBeGreaterThanOrEqual(16);

    // The dvh/vh max-height cascade resolves to a concrete cap no taller than the viewport.
    const maxHeight = await sheet.evaluate((el) => parseFloat(getComputedStyle(el).maxHeight));
    expect(maxHeight).toBeGreaterThan(0);
    expect(maxHeight).toBeLessThanOrEqual(viewport.height + 1);
  });
});
