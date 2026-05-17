import { Page } from '@playwright/test';

export const ADMIN  = { email: 'ana.garcia@timeos.com',   password: 'admin123'  };
export const MEMBER = { email: 'carlos.lopez@timeos.com', password: 'carlos123' };

export async function login(page: Page, creds = ADMIN) {
  await page.goto('/login');
  // Wait for the form to be stable (past AuthContext initial isLoading flip)
  const emailInput = page.locator('input[type="email"]');
  await emailInput.waitFor({ state: 'visible' });
  await page.waitForTimeout(300); // let React settle after isLoading change
  await emailInput.fill(creds.email);
  await page.fill('input[type="password"]', creds.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}
