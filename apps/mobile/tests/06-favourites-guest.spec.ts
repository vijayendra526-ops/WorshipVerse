import { test, expect } from '@playwright/test';
import { openSongs } from './helpers';

async function openGuestFavouritesPrompt(page: import('@playwright/test').Page) {
  await openSongs(page, 'te');
  await page.getByRole('tab', { name: 'ఇష్టమైనవి' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  return dialog;
}

test('guest sees login requirement for favourites', async ({ page }) => {
  const dialog = await openGuestFavouritesPrompt(page);

  await expect(dialog.getByText('లాగిన్ అవసరం')).toBeVisible();
  await expect(dialog.getByText('లాగిన్ / నమోదు')).toBeVisible();
});

test('guest can cancel favourites login prompt', async ({ page }) => {
  const dialog = await openGuestFavouritesPrompt(page);

  await dialog.getByText('రద్దు').click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('tab', { name: 'హోమ్' })).toBeVisible();
});

test('guest can navigate to login from favourites', async ({ page }) => {
  const dialog = await openGuestFavouritesPrompt(page);

  await dialog.getByText('లాగిన్ / నమోదు').click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByPlaceholder('name@domain.com')).toBeVisible();
});