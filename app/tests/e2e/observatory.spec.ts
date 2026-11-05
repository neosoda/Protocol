import { expect, test, type Page } from '@playwright/test';

const errors = (page: Page): string[] => {
  const found: string[] = [];
  page.on('pageerror', e => found.push(e.message));
  page.on('console', m => { if (m.type() === 'error') found.push(m.text()); });
  return found;
};

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => { if (!localStorage.getItem('observatory:lang')) localStorage.setItem('observatory:lang', 'fr'); });
});

test('opens a lesson and steps through it in sync', async ({ page }) => {
  const failures = errors(page);
  await page.goto('/#/tcp');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('TCP');
  await expect(page.locator('.counter')).toHaveText('Étape 1 sur 11');
  await page.getByRole('button', { name: 'Étape suivante' }).click();
  await page.getByRole('button', { name: 'Étape suivante' }).click();
  await expect(page.locator('.counter')).toHaveText('Étape 2 sur 11');
  await expect(page.locator('.step-card h2')).toHaveText('SYN-ACK : « d’accord, et toi ? »');
  await expect(page.locator('.row[data-state=current]')).toHaveAttribute('data-index', '1');
  await expect(page.locator('.layer-tcp .field', { hasText: 'Flags' })).toContainText('SYN, ACK');
  expect(failures).toEqual([]);
});

test('hovering a field lights its bytes', async ({ page }) => {
  await page.goto('/#/http');
  await page.locator('.tick').nth(3).click();
  await page.locator('.field', { hasText: 'Host' }).hover();
  await expect(page.locator('.hex b.on')).toHaveCount(23);
  await expect(page.locator('.field-detail code')).toHaveText('Host: www.example.com');
});

test('switches language and theme, and remembers progress', async ({ page }) => {
  await page.goto('/#/udp');
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.locator('.lesson h1')).toContainText('Sending without connection');
  const before = await page.locator('html').getAttribute('data-theme');
  await page.getByRole('button', { name: 'Switch theme' }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', before ?? '');
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
  await expect(page.locator('.counter')).toHaveText('Step 5 of 5');
  await page.reload();
  await expect(page.locator('.tp-value')).not.toHaveText('0 %');
});

test('every lesson renders without errors or horizontal scroll', async ({ page }) => {
  const failures = errors(page);
  await page.goto('/');
  const ids = await page.locator('.lesson-link').evaluateAll(links => links.map(l => (l as HTMLElement).dataset.id!));
  expect(ids).toHaveLength(14);
  for (const id of ids) {
    await page.goto(`/#/${id}`);
    await page.locator('.tick').last().click();
    // The step text sits in the inspector on wide screens, under the scene on phones.
    await expect(page.locator('.step-card h2, .story h2').filter({ visible: true })).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  expect(failures).toEqual([]);
});

test('filters bilingual lesson links without disturbing the current simulation', async ({ page, isMobile }) => {
  await page.goto('/#/tcp');
  if (isMobile) await page.getByRole('button', { name: 'Toutes les leçons' }).click();
  const search = page.getByRole('searchbox', { name: 'Rechercher un protocole' });
  await search.fill('dns');
  await expect(page.locator('.lesson-link:visible')).toHaveCount(1);
  await expect(page.locator('.lesson-link:visible')).toContainText('DNS');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('TCP');
  await search.fill('pas-de-protocole');
  await expect(page.locator('.rail-empty')).toBeVisible();
  await search.fill('');
  await expect(page.locator('.lesson-link:visible')).toHaveCount(14);
});

test('TCP loss and retransmission preserve SVG scene semantics', async ({ page }) => {
  await page.goto('/#/tcp');
  const scene = page.locator('.topology');
  expect(await scene.locator('.node').count()).toBeGreaterThanOrEqual(2);
  await page.locator('.tick').nth(5).click();
  await expect(page.locator('.counter')).toHaveText('Étape 6 sur 11');
  await expect(page.locator('.step-lost')).toBeVisible();
  await expect(scene.locator('.flights .is-lost')).toHaveCount(1);
  await page.locator('.tick').nth(6).click();
  await expect(page.locator('.counter')).toHaveText('Étape 7 sur 11');
  await expect(scene.locator('.flights .is-lost')).toHaveCount(0);
});

test('keyboard focus links bytes and unpinning clears the visual selection', async ({ page }) => {
  await page.goto('/#/http');
  await page.locator('.tick').nth(3).click();
  const host = page.locator('.field', { hasText: 'Host' });
  await host.focus();
  await expect(page.locator('.hex b.on')).toHaveCount(23);
  await host.click();
  await expect(host).toHaveAttribute('aria-pressed', 'true');
  await host.click();
  await expect(host).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.hex b.on')).toHaveCount(0);
});
