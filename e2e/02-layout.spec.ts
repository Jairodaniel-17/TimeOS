import { test, expect } from '@playwright/test';
import { login, ADMIN } from './helpers';

test.describe('Layout & navegación', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN);
  });

  test('sidebar visible con marca TimeOS', async ({ page }) => {
    await expect(page.locator('aside')).toBeVisible();
    await expect(page.locator('aside').locator('text=TimeOS')).toBeVisible();
  });

  test('sidebar colapsa y expande', async ({ page }) => {
    const sidebar = page.locator('aside');
    const toggleBtn = sidebar.locator('button').filter({ hasText: '' }).first();
    const initialWidth = await sidebar.evaluate(el => el.getBoundingClientRect().width);
    await toggleBtn.click();
    await page.waitForTimeout(400);
    const collapsedWidth = await sidebar.evaluate(el => el.getBoundingClientRect().width);
    expect(collapsedWidth).toBeLessThan(initialWidth);
    // re-expand
    await sidebar.locator('button').first().click();
    await page.waitForTimeout(400);
  });

  test('header muestra título y avatar de usuario', async ({ page }) => {
    await expect(page.locator('header h1')).toBeVisible();
    // Avatar initials button in header
    const headerRight = page.locator('header').last();
    await expect(headerRight).toBeVisible();
  });

  test('toggle de tema claro/oscuro funciona', async ({ page }) => {
    const html = page.locator('html');
    const before = await html.getAttribute('data-theme');
    // find theme toggle button
    const toggle = page.locator('.theme-toggle').first();
    await toggle.click();
    await page.waitForTimeout(200);
    const after = await html.getAttribute('data-theme');
    expect(after).not.toBe(before === 'dark' ? 'dark' : 'light');
    // reset
    await toggle.click();
  });

  test('menú de usuario abre y cierra', async ({ page }) => {
    // Click user avatar in header
    const avatarBtn = page.locator('header').locator('button').filter({ hasText: /^[A-Z]{1,2}$/ }).first();
    await avatarBtn.click();
    await expect(page.locator('text=Cerrar sesión')).toBeVisible();
    // Click outside to close
    await page.keyboard.press('Escape');
  });

  test('nav item Dashboard activo en /', async ({ page }) => {
    await page.goto('/');
    const dashLink = page.locator('aside a[href="/"]');
    await expect(dashLink).toHaveClass(/bg-white/);
  });

  test('navegar a Proyectos', async ({ page }) => {
    await page.locator('aside a[href="/projects"]').click();
    await expect(page).toHaveURL('/projects');
    await expect(page.locator('h1')).toContainText('Proyect');
  });

  test('navegar a Clientes', async ({ page }) => {
    await page.locator('aside a[href="/clients"]').click();
    await expect(page).toHaveURL('/clients');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('navegar a Tiempos', async ({ page }) => {
    await page.locator('aside a[href="/timesheet"]').click();
    await expect(page).toHaveURL('/timesheet');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('navegar a Aprobaciones', async ({ page }) => {
    await page.locator('aside a[href="/approvals"]').click();
    await expect(page).toHaveURL('/approvals');
  });

  test('navegar a Tareas', async ({ page }) => {
    await page.locator('aside a[href="/tasks"]').click();
    await expect(page).toHaveURL('/tasks');
  });

  test('navegar a Reportes', async ({ page }) => {
    await page.locator('aside a[href="/reports"]').click();
    await expect(page).toHaveURL('/reports');
  });

  test('navegar a Costos', async ({ page }) => {
    await page.locator('aside a[href="/costs"]').click();
    await expect(page).toHaveURL('/costs');
  });

  test('navegar a Usuarios', async ({ page }) => {
    await page.locator('aside a[href="/users"]').click();
    await expect(page).toHaveURL('/users');
  });

  test('cerrar sesión redirige a /login', async ({ page }) => {
    const avatarBtn = page.locator('header').locator('button').filter({ hasText: /^[A-Z]{1,2}$/ }).first();
    await avatarBtn.click();
    await page.locator('text=Cerrar sesión').click();
    await expect(page).toHaveURL(/login/);
  });
});
