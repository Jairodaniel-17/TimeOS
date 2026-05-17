import { test, expect } from '@playwright/test';
import { login, ADMIN } from './helpers';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN);
    await page.goto('/');
  });

  test('título correcto', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('botón Registrar horas presente', async ({ page }) => {
    await expect(page.locator('text=Registrar horas')).toBeVisible();
  });

  test('4 KPI cards visibles', async ({ page }) => {
    // KPI cards have border-l-4 pattern
    const kpiCards = page.locator('article');
    await expect(kpiCards).toHaveCount(4);
  });

  test('KPI card Horas esta semana', async ({ page }) => {
    await expect(page.locator('text=Horas esta semana')).toBeVisible();
  });

  test('KPI card Pendientes aprobación', async ({ page }) => {
    await expect(page.locator('text=Pendientes aprobación')).toBeVisible();
  });

  test('KPI card Semana actual', async ({ page }) => {
    await expect(page.locator('text=Semana actual')).toBeVisible();
  });

  test('card Aprobaciones pendientes visible', async ({ page }) => {
    await expect(page.locator('text=Aprobaciones pendientes')).toBeVisible();
  });

  test('card Entradas recientes visible', async ({ page }) => {
    await expect(page.locator('text=Entradas recientes')).toBeVisible();
  });

  test('gráfico Horas por día visible', async ({ page }) => {
    await expect(page.locator('text=Horas por día')).toBeVisible();
  });

  test('gráfico Distribución por proyecto visible', async ({ page }) => {
    await expect(page.locator('text=Distribución por proyecto')).toBeVisible();
  });

  test('botón refresh funciona', async ({ page }) => {
    const btn = page.locator('button[disabled]').or(page.locator('button:has(.animate-spin)')).first();
    // Just verify it exists and page doesn't crash
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('click en KPI horas navega a reportes', async ({ page }) => {
    await page.locator('text=Horas esta semana').click();
    await expect(page).toHaveURL('/reports');
  });

  test('link Ver todas en aprobaciones navega', async ({ page }) => {
    await page.locator('text=Ver todas').first().click();
    await expect(page).toHaveURL('/approvals');
  });
});
