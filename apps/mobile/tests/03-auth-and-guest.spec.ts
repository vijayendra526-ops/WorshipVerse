import { test, expect } from '@playwright/test';
import { openAccountMenu, openHome, openSignIn } from './helpers';

test('guest can browse without logging in', async ({ page }) => {
  await openHome(page);
  await expect(page.getByText('English Songs', { exact: true }).first()).toBeVisible();
});

test('guest account menu contains sign-in entry', async ({ page }) => {
  await openAccountMenu(page);
  await expect(page.getByText(/^(లాగిన్ \/ నమోదు|Sign In \/ Sign Up)$/)).toBeVisible();
});

test('guest sign-in form loads with email and password', async ({ page }) => {
  await openSignIn(page);
  await expect(page.getByPlaceholder('name@domain.com')).toBeVisible();
  await expect(page.getByPlaceholder('••••••••')).toBeVisible();
});

test('email field accepts input without submitting', async ({ page }) => {
  await openSignIn(page);
  const email = page.getByPlaceholder('name@domain.com');
  await email.fill('qa-example@example.com');
  await expect(email).toHaveValue('qa-example@example.com');
  // Never submit: avoid changing production accounts and auth rate limits.
});
