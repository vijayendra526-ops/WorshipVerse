import { test, expect } from '@playwright/test';
import { openHome } from './helpers';

test('home loads with WorshipVerse branding', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await openHome(page);
  expect(errors).toEqual([]);
});

test('home includes both song collections', async ({ page }) => {
  await openHome(page);
  await expect(page.getByText('తెలుగు పాటలు', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('English Songs', { exact: true }).first()).toBeVisible();
});

test('home language switch changes visible copy', async ({ page }) => {
  await openHome(page);
  await page.getByRole('button', { name: 'English interface' }).click();
  await expect(page.getByText('Telugu Songs', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Telugu interface' }).click();
  await expect(page.getByText('తెలుగు పాటలు', { exact: true }).first()).toBeVisible();
});

test('home account menu opens', async ({ page }) => {
  await openHome(page);
  await page.getByRole('button', { name: 'Account menu' }).click();
  await expect(page.getByText(/sign in|login|ప్రవేశ|ఖాతా|account/i).first()).toBeVisible();
});
