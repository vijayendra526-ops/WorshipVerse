import { test, expect } from '@playwright/test';
import { openAccountMenu } from './helpers';

// Opt-in only. Never use a production account or credentials in a source file.
test.skip(!process.env.WV_TEST_EMAIL || !process.env.WV_TEST_PASSWORD,
  'Set WV_TEST_EMAIL and WV_TEST_PASSWORD for a dedicated Supabase test account');

async function login(page: import('@playwright/test').Page) {
  await openAccountMenu(page);
  await page.getByText(/sign in|login|లాగిన్|ప్రవేశ/i).last().click();
  await page.getByPlaceholder('name@example.com').fill(process.env.WV_TEST_EMAIL!);
  await page.getByPlaceholder('••••••••').fill(process.env.WV_TEST_PASSWORD!);
  // Use submit button; label may be translated, so use the enclosing form's last button.
  await page.getByText(/Sign In|లాగిన్|ప్రవేశించండి/i).last().click();
  await expect(page.getByRole('button', { name: 'Account menu' })).toBeVisible({ timeout: 20000 });
}

test('test account signs in and sees account menu', async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: 'Account menu' }).click();
  await expect(page.getByText(/profile|ప్రొఫైల్|favourites|ఇష్టమైన|playlists|ప్లేలిస్ట్/i).first()).toBeVisible();
});
