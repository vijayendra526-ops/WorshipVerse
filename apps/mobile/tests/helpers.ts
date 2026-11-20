import { expect, Page } from '@playwright/test';

export async function openHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('WorshipVerse', { exact: true }).first()).toBeVisible();
}

export function songSearchInput(page: Page) {
  // React Native Web renders TextInput with its placeholder. This matches both UI languages.
  return page.getByPlaceholder(/పాట పేరు వెతకండి|Search song titles/i);
}

export async function openSongs(page: Page, language: 'te' | 'en' = 'te') {
  await openHome(page);
  const collection = language === 'te' ? 'తెలుగు పాటలు' : 'English Songs';
  await page.getByText(collection, { exact: true }).first().click();
  await expect(songSearchInput(page)).toBeVisible();
}

export async function openAccountMenu(page: Page) {
  await openHome(page);
  await page.getByRole('button', { name: 'Account menu' }).click();
}

export async function openSignIn(page: Page) {
  await openAccountMenu(page);
  // The Home account menu contains a bilingual sign-in action.
  await page.getByText(/^(లాగిన్ \/ నమోదు|Sign In \/ Sign Up)$/).click();
  await expect(page.getByPlaceholder('name@domain.com')).toBeVisible();
}
