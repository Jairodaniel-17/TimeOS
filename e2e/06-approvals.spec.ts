import { test, expect } from '@playwright/test';
import { login, ADMIN } from './helpers';

test.describe('Aprobaciones', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN);
    await page.goto('/approvals');
    await page.waitForLoadState('networkidle');
  });

  test('carga la página', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible();
  });

  test('tabs de estado (Pendientes / Aprobadas / Rechazadas) visibles', async ({ page }) => {
    // Our Tabs component renders <nav> containing <button> with text like "Pendientes"
    const tabBtn = page.locator('button', { hasText: /Pendientes|Aprobadas|Rechazadas/i }).first();
    await expect(tabBtn).toBeVisible();
  });

  test('contenido de aprobaciones visible', async ({ page }) => {
    // With real data there should be rows, otherwise an empty state message
    await page.waitForTimeout(2000);
    const hasRows  = await page.locator('tbody tr').count() > 0;
    const hasCards = await page.locator('[class*="divide"] > div').count() > 0;
    const hasEmpty = await page.locator('text=No hay aprobaciones').count() > 0;
    expect(hasRows || hasCards || hasEmpty).toBe(true);
  });
});
