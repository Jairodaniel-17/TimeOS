import { test, expect } from '@playwright/test';
import { login, ADMIN } from './helpers';

const pages = [
  { path: '/tasks',      title: /Task|Tarea/i },
  { path: '/planning',   title: /Plan/i },
  { path: '/resources',  title: /Recurs/i },
  { path: '/reports',    title: /Report/i },
  { path: '/costs',      title: /Cost/i },
  { path: '/users',      title: /Usuar/i },
  { path: '/documents',  title: /Docum/i },
  { path: '/settings',   title: /Config/i },
  { path: '/clients',    title: /Client/i },
  { path: '/notifications', title: /Notif/i },
];

test.describe('Páginas secundarias — carga sin crash', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN);
  });

  for (const { path, title } of pages) {
    test(`${path} carga y muestra h1`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('h1').or(page.locator('[data-testid="page-title"]'))).toBeVisible({ timeout: 10_000 });
      const h1Text = await page.locator('h1').first().textContent();
      expect(h1Text).toBeTruthy();
    });
  }
});

test.describe('Roles y Permisos', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN);
  });

  test('/settings/roles carga', async ({ page }) => {
    await page.goto('/settings/roles');
    await expect(page.locator('h1')).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Permisos member — acceso restringido', () => {
  test('member no ve Costos en sidebar', async ({ page }) => {
    await login(page, { email: 'carlos.lopez@timeos.com', password: 'carlos123' });
    const costsLink = page.locator('aside a[href="/costs"]');
    await expect(costsLink).toHaveCount(0);
  });

  test('member no ve Usuarios en sidebar', async ({ page }) => {
    await login(page, { email: 'carlos.lopez@timeos.com', password: 'carlos123' });
    const usersLink = page.locator('aside a[href="/users"]');
    await expect(usersLink).toHaveCount(0);
  });
});
