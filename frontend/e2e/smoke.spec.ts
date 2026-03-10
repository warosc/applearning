import { test, expect } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/EXHCOBA|Simulador/i);
});

test('login page renders form', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('input[type="text"], input[name="username"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
});

test('register page renders form', async ({ page }) => {
  await page.goto('/register');
  await expect(page.locator('input[name="username"]')).toBeVisible();
});

test('admin redirects to login when not authenticated', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/login/);
});
