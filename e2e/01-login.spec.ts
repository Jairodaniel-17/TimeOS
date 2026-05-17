import { test, expect } from '@playwright/test';
import { login, ADMIN, MEMBER } from './helpers';

async function gotoLogin(page: Parameters<typeof login>[0]) {
  await page.goto('/login');
  await page.locator('input[type="email"]').waitFor({ state: 'visible' });
  await page.waitForTimeout(300);
}

test.describe('Login', () => {
  test('página de login carga correctamente', async ({ page }) => {
    await gotoLogin(page);
    await expect(page).toHaveTitle(/TimeOS/i);
    await expect(page.locator('h1')).toContainText('Bienvenido');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('panel izquierdo de branding visible', async ({ page }) => {
    await gotoLogin(page);
    await expect(page.locator('h2').filter({ hasText: 'Gestiona' })).toBeVisible();
    await expect(page.locator('text=by Orvanta')).toBeVisible();
  });

  test('usuarios de prueba aparecen en el panel', async ({ page }) => {
    await gotoLogin(page);
    await expect(page.locator('p').filter({ hasText: /usuarios de prueba/i })).toBeVisible();
    await expect(page.locator('span.font-bold', { hasText: 'Admin' })).toBeVisible();
    await expect(page.locator('span.font-bold', { hasText: 'Usuario' })).toBeVisible();
  });

  test('click en usuario de prueba rellena credenciales', async ({ page }) => {
    await gotoLogin(page);
    await page.locator('button', { hasText: 'Admin' }).first().click();
    await expect(page.locator('input[type="email"]')).toHaveValue(ADMIN.email);
  });

  test('toggle de mostrar/ocultar contraseña', async ({ page }) => {
    await gotoLogin(page);
    const pwd = page.locator('input[type="password"]').first();
    await expect(pwd).toBeVisible();
    await page.locator('div.relative button[type="button"]').click();
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
  });

  test('credenciales incorrectas muestra mensaje de error', async ({ page }) => {
    await gotoLogin(page);
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(
      page.locator('text=incorrectos').or(page.locator('text=Error de conexión'))
    ).toBeVisible({ timeout: 15_000 });
  });

  test('login exitoso como admin redirige a dashboard', async ({ page }) => {
    await login(page, ADMIN);
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('login exitoso como member redirige a dashboard', async ({ page }) => {
    await login(page, MEMBER);
    await expect(page).toHaveURL('/');
  });

  test('ruta protegida redirige a /login sin sesión', async ({ page }) => {
    await page.goto('/projects');
    await expect(page).toHaveURL(/login/);
  });
});
