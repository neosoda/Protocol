import { test, expect } from '@playwright/test';

test('embedded HTTP keeps its engine and reports distinct visited steps', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const events: unknown[] = [];
    Object.assign(window, { __embedEvents: events });
    window.addEventListener('message', event => {
      if (event.origin === location.origin && event.data?.source === 'network-observatory') events.push(event.data);
    });
    const iframe = document.createElement('iframe');
    iframe.title = 'HTTP lab';
    iframe.style.width = 'min(100%, 960px)';
    iframe.style.height = '900px';
    iframe.dataset.test = 'campus-embed';
    const url = new URL('/', location.origin);
    url.searchParams.set('embed', '1');
    url.searchParams.set('scenario', 'http');
    url.searchParams.set('theme', 'dark');
    url.searchParams.set('lang', 'fr');
    url.searchParams.set('parentOrigin', location.origin);
    iframe.src = url.href;
    document.body.appendChild(iframe);
  });
  const frame = page.frameLocator('iframe[data-test="campus-embed"]');
  await expect(frame.locator('html')).toHaveAttribute('data-embed', 'true');
  await expect(frame.locator('.top')).toBeHidden();
  await expect(frame.locator('.topology')).toBeVisible();
  await expect(frame.locator('.inspector')).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as any).__embedEvents.some((e: any) => e.type === 'ready' && e.scenarioId === 'http'))).toBe(true);
  await frame.locator('[data-action="next"]').click();
  await expect.poll(() => page.evaluate(() => (window as any).__embedEvents.find((e: any) => e.type === 'progress')?.step)).toBe(1);
  await frame.locator('.tick').last().click();
  await expect.poll(() => page.evaluate(() => (window as any).__embedEvents.filter((e: any) => e.type === 'progress').length)).toBeGreaterThan(1);
  const status = await page.evaluate(() => (window as any).__embedEvents.filter((e: any) => e.type === 'progress'));
  expect(status.every((e: any) => e.complete === false)).toBe(true);
});

test('regular standalone navigation still resolves hash scenarios', async ({ page }) => {
  await page.goto('/#/dns');
  await expect(page.locator('h1')).toContainText('DNS');
  await expect(page.locator('.rail')).toBeVisible();
});
