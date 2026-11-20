import { test, expect } from '@playwright/test';

test.use({
  viewport: { width: 360, height: 800 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});

test('WorshipVerse mobile home smoke test', async ({ page }) => {
  const errors: string[] = [];

  page.on('pageerror', error => {
    errors.push(error.message);
  });

  await page.goto('http://localhost:8081', {
    waitUntil: 'domcontentloaded',
  });

  await expect(
    page.getByText('WorshipVerse', { exact: false }).first()
  ).toBeVisible({ timeout: 30000 });

  await page.screenshot({
    path: 'tests/home-mobile.png',
    fullPage: true,
  });

  expect(errors).toEqual([]);
});
