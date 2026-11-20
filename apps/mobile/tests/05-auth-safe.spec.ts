import { test, expect } from '@playwright/test';
import { openSignIn } from './helpers';

// These tests only trigger client-side validation; they never submit valid credentials.
test('guest can return to browsing from sign in', async ({ page }) => {
  await openSignIn(page);
  await page.getByRole('button', { name: 'Continue browsing songs' }).click();
  await expect(page.getByText('WorshipVerse', { exact: true }).first()).toBeVisible();
});

test('auth interface switches to English', async ({ page }) => {
  await openSignIn(page);
  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.getByText('Welcome Back', { exact: true })).toBeVisible();
});

test('registration screen opens without submitting', async ({ page }) => {
  await openSignIn(page);
  await page.getByRole('button', { name: 'English' }).click();
  await page.getByRole('button', { name: /Don't have an account\? Sign up/ }).click();
  await expect(page.getByText('Create Your Account', { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder('name@domain.com')).toBeVisible();
});

test('forgot-password screen opens without sending email', async ({ page }) => {
  await openSignIn(page);
  await page.getByRole('button', { name: 'English' }).click();
  await page.getByRole('button', { name: 'Forgot password?' }).click();
  await expect(page.getByText('Password Recovery', { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder('name@domain.com')).toBeVisible();
});
