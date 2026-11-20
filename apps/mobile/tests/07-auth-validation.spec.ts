import { test, expect } from '@playwright/test';
import { openSignIn } from './helpers';

async function openEnglishLogin(page: import('@playwright/test').Page) {
  await openSignIn(page);
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await expect(page.getByText('Welcome Back', { exact: true })).toBeVisible();
}

async function openRegistration(page: import('@playwright/test').Page) {
  await openEnglishLogin(page);
  await page.getByRole('button', {
    name: "Don't have an account? Sign up",
  }).click();
  await expect(page.getByText('Create Your Account', { exact: true })).toBeVisible();
}

test('login rejects invalid email', async ({ page }) => {
  await openEnglishLogin(page);

  await page.getByPlaceholder('name@domain.com').fill('invalid-email');
  await page.getByRole('button', { name: /^Sign In\s*→?$/ }).click();

  await expect(page.getByText('Enter a valid email address.')).toBeVisible();
});

test('login requires a password', async ({ page }) => {
  await openEnglishLogin(page);

  await page.getByPlaceholder('name@domain.com').fill('test@example.com');
  await page.getByRole('button', { name: /^Sign In\s*→?$/ }).click();

  await expect(page.getByText('Please complete the required fields.')).toBeVisible();
});

test('registration rejects a short password', async ({ page }) => {
  await openRegistration(page);

  await page.getByPlaceholder('name@domain.com').fill('test@example.com');
  await page.getByPlaceholder('Full name').fill('Test User');
  await page.getByPlaceholder('••••••••').first().fill('123456');

  await page.getByRole('button', { name: /^Create Account\s*→?$/ }).click();

  await expect(
    page.getByText('Password must be at least 8 characters.')
  ).toBeVisible();
});

test('registration rejects mismatched passwords', async ({ page }) => {
  await openRegistration(page);

  await page.getByPlaceholder('name@domain.com').fill('test@example.com');
  await page.getByPlaceholder('Full name').fill('Test User');

  const passwords = page.getByPlaceholder('••••••••');
  await passwords.first().fill('TestPassword123!');
  await passwords.nth(1).fill('DifferentPassword123!');

  await page.getByRole('button', { name: /^Create Account\s*→?$/ }).click();

  await expect(page.getByText('Passwords do not match.')).toBeVisible();
});

test('password visibility can be toggled', async ({ page }) => {
  await openEnglishLogin(page);

  const password = page.getByPlaceholder('••••••••').first();
  await password.fill('example-password');

  await expect(password).toHaveAttribute('type', 'password');

  await page.getByRole('button', { name: 'Show', exact: true }).click();
  await expect(password).toHaveJSProperty('type', 'text');

  await page.getByRole('button', { name: 'Hide', exact: true }).click();
  await expect(password).toHaveAttribute('type', 'password');
});