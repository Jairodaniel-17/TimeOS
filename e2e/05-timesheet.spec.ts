import { test, expect } from '@playwright/test';
import { login, ADMIN, MEMBER } from './helpers';

test.describe('Tiempos (Timesheet)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN);
    await page.goto('/timesheet');
    await page.waitForLoadState('networkidle');
  });

  test('carga la página', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible();
  });

  test('navegación de semanas disponible (ChevronLeft/Right)', async ({ page }) => {
    // Timesheet has prev/next week buttons with ChevronLeft/ChevronRight icons
    // They are inside a flex row that also contains "Semana X" text
    const weekNav = page.locator('text=Semana').first();
    await expect(weekNav).toBeVisible();
    // Buttons surrounding the week label
    const navBtns = page.locator('button').filter({ has: page.locator('svg') });
    await expect(navBtns.first()).toBeVisible();
  });

  test('encabezado de semana muestra "Semana X"', async ({ page }) => {
    await expect(page.locator('text=/Semana \\d+/').first()).toBeVisible();
  });

  test('tabla de timesheet muestra columnas de días', async ({ page }) => {
    const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
    let found = false;
    for (const day of dayLabels) {
      if (await page.locator(`text=${day}`).count() > 0) { found = true; break; }
    }
    expect(found).toBe(true);
  });

  test('como member puede ver su timesheet', async ({ page }) => {
    // Need fresh login as member (beforeEach logged in as admin)
    await page.evaluate(() => localStorage.removeItem('timeos_user'));
    await login(page, MEMBER);
    await page.goto('/timesheet');
    await page.waitForTimeout(1000);
    await expect(page.locator('h1')).toBeVisible();
  });
});
