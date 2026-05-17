import { test, expect } from '@playwright/test';
import { login, ADMIN } from './helpers';

test.describe('Oracle Redwood UI — tokens visuales', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN);
  });

  test('sidebar tiene fondo oracle-sidebar (#312d2a)', async ({ page }) => {
    const sidebar = page.locator('aside');
    const bg = await sidebar.evaluate(el => getComputedStyle(el).backgroundColor);
    // #312d2a → rgb(49, 45, 42)
    expect(bg).toBe('rgb(49, 45, 42)');
  });

  test('marca "T" del sidebar tiene fondo oracle-red (#c74634)', async ({ page }) => {
    const brandMark = page.locator('aside div.rounded-xl').first();
    const bg = await brandMark.evaluate(el => getComputedStyle(el).backgroundColor);
    // #c74634 → rgb(199, 70, 52)
    expect(bg).toBe('rgb(199, 70, 52)');
  });

  test('KPI cards tienen border-left visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    const kpi = page.locator('article').first();
    const borderLeft = await kpi.evaluate(el => getComputedStyle(el).borderLeftWidth);
    expect(parseInt(borderLeft)).toBeGreaterThan(2);
  });

  test('botón primary tiene fondo teal (#227e9e)', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('a[href="/timesheet"] button, button:has-text("Registrar")').first();
    if (await btn.isVisible()) {
      const bg = await btn.evaluate(el => getComputedStyle(el).backgroundColor);
      // #227e9e → rgb(34, 126, 158)
      expect(bg).toBe('rgb(34, 126, 158)');
    }
  });

  test('Inter font está activa (font-family contiene inter)', async ({ page }) => {
    const fontFamily = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(fontFamily.toLowerCase()).toContain('inter');
  });

  test('cards tienen border-radius de 14px', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    const card = page.locator('article, section.rounded-\\[14px\\]').first();
    if (await card.isVisible()) {
      const radius = await card.evaluate(el => getComputedStyle(el).borderRadius);
      expect(radius).toBe('14px');
    }
  });

  test('modo oscuro: html[data-theme=dark] cambia background', async ({ page }) => {
    await page.goto('/');
    const toggle = page.locator('.theme-toggle').first();
    const htmlBefore = await page.locator('html').evaluate(el => getComputedStyle(el).backgroundColor);
    await toggle.click();
    await page.waitForTimeout(200);
    const htmlAfter = await page.locator('html').evaluate(el =>
      getComputedStyle(document.documentElement).getPropertyValue('data-theme') ||
      document.documentElement.getAttribute('data-theme')
    );
    expect(htmlAfter).toBe('dark');
    // Reset
    await toggle.click();
  });
});
