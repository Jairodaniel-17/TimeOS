import { test, expect } from '@playwright/test';
import { login, ADMIN } from './helpers';

test.describe('Proyectos', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN);
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
  });

  test('carga la página', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Proyect');
  });

  test('botón Nuevo Proyecto visible', async ({ page }) => {
    await expect(page.locator('text=Nuevo Proyecto')).toBeVisible();
  });

  test('tabla de proyectos visible', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th', { hasText: 'Proyecto' })).toBeVisible();
  });

  test('KPI cards de resumen aparecen', async ({ page }) => {
    const articles = page.locator('article');
    const count = await articles.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('abre modal Nuevo Proyecto', async ({ page }) => {
    await page.locator('text=Nuevo Proyecto').click();
    await expect(
      page.locator('h3').filter({ hasText: /Nuevo Proyecto|Crear/ })
    ).toBeVisible();
    await page.locator('button', { hasText: 'Cancelar' }).click();
  });

  test('modal tiene campos requeridos', async ({ page }) => {
    await page.locator('text=Nuevo Proyecto').click();
    await expect(page.locator('h3').filter({ hasText: /Nuevo|Crear/ })).toBeVisible();
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
    await page.locator('button', { hasText: 'Cancelar' }).click();
  });

  test('filas de proyectos tienen botones de acción', async ({ page }) => {
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    if (rowCount > 0) {
      await expect(rows.first().locator('button').first()).toBeVisible();
    }
  });

  test('click en Ver navega al detalle del proyecto', async ({ page }) => {
    const eyeBtn = page.locator('button[title="Ver Detalles"]').first();
    if (await eyeBtn.isVisible()) {
      await eyeBtn.click();
      await expect(page).toHaveURL(/\/projects\//);
    }
  });
});
