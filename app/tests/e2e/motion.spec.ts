import { expect, test } from '@playwright/test';

test.use({ reducedMotion: 'no-preference' });

test('normal-motion TCP retains a moving packet and illustrated devices', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('observatory:lang', 'fr'));
  await page.goto('/#/tcp');
  await expect(page.locator('.topology .node')).toHaveCount(4);
  await page.getByRole('button', { name: 'Lecture' }).click();
  const packet = page.locator('.topology .flights .packet').first();
  await expect(packet).toBeAttached();
  const first = await packet.getAttribute('transform');
  await expect.poll(() => packet.getAttribute('transform'), { timeout: 5000 }).not.toBe(first);
  await expect(page.locator('.topology .node-body')).toHaveCount(4);
});
