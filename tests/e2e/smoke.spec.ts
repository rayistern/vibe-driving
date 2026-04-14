import { test, expect } from '@playwright/test';

test('app loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Vibe Driving');
  await expect(page.locator('h1')).toHaveText('Vibe Driving');
});
