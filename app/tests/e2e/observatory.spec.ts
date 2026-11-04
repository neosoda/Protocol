import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('network-observatory:v1:language', 'fr');
    localStorage.setItem('network-observatory:v1:theme', 'dark');
  });
});

test('catalog lists all 14 protocol entries', async ({ page }) => {
  await page.goto('/observatory/');
  await expect(page.locator('button.protocol-card')).toHaveCount(14);
  await expect(page.getByRole('heading', { name: 'Catalogue des protocoles' })).toBeVisible();
});

test('timeline selection synchronizes topology, sequence, inspector and progress', async ({ page }) => {
  await page.goto('/observatory/');
  await page.getByRole('button', { name: /Explorer TCP/ }).first().click();
  await expect(page.locator('#progress-text')).toContainText('1 / 5');
  await expect(page.locator('#flow-readout')).toContainText('SYN');
  await expect(page.locator('#event-list button[aria-current="step"]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Suivant' }).click();
  await expect(page.locator('#progress-text')).toContainText('2 / 5');
  await expect(page.locator('#flow-readout')).toContainText('SYN, ACK');
  await expect(page.locator('#inspector-body')).toContainText('1001');
  await expect(page.locator('#event-list button[aria-current="step"]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Réinitialiser' }).click();
  await expect(page.locator('#progress-text')).toContainText('1 / 5');
});

test('two modes, theme and rtl language', async ({ page }) => {
  await page.goto('/observatory/');
  await page.getByRole('button', { name: /Explorer TCP/ }).first().click();
  await expect(page.locator('.raw-panel')).toContainText('Passez en mode Expert');
  await page.getByRole('button', { name: 'Expert' }).click();
  await expect(page.locator('.field-group')).toHaveCount(1);
  await page.getByRole('button', { name: 'Thème' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.locator('#language-select').selectOption('ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
});

for (const width of [390, 768, 1440]) {
  for (const theme of ['dark', 'light']) {
    test('capture ' + width + 'px ' + theme, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(value => localStorage.setItem('network-observatory:v1:theme', value), theme);
      await page.goto('/observatory/');
      await page.getByRole('button', { name: /Explorer TCP/ }).first().click();
      await expect(page.locator('#inspector-title')).toBeVisible();
      await page.screenshot({ path: `test-results/observatory-${width}-${theme}.png`, fullPage: true });
    });
  }
}
