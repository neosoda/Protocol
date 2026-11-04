import { expect, test } from '@playwright/test';

const storagePrefix = 'network-observatory:v1:';
const open = async (page: import('@playwright/test').Page, id: string): Promise<void> => {
  await page.goto('/observatory/');
  await page.locator(`button.protocol-card[data-id="${id}"]`).click();
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(prefix => {
    if (localStorage.getItem(prefix + 'language') === null) {
      localStorage.setItem(prefix + 'language', 'fr');
    }
    if (localStorage.getItem(prefix + 'theme') === null) {
      localStorage.setItem(prefix + 'theme', 'dark');
    }
  }, storagePrefix);
});

test('shows 14 unique protocol cards on the catalogue', async ({ page }) => {
  await page.goto('/observatory/');
  await expect(page.locator('button.protocol-card')).toHaveCount(14);
  await expect(page.getByRole('heading', { name: 'Catalogue des protocoles' })).toBeVisible();
  await expect(page.locator('button.protocol-card[data-id="tcp"]')).toHaveCount(1);
});

test('observatory loads without page errors or console exceptions', async ({ page }) => {
  const failures: string[] = [];
  page.on('pageerror', error => failures.push('page: ' + error.message));
  page.on('console', message => {
    if (message.type() === 'error') failures.push('console: ' + message.text());
  });
  await open(page, 'dns');
  await page.getByRole('button', { name: 'Suivant' }).click();
  await page.getByRole('button', { name: 'Expert' }).click();
  await page.locator('button[data-action="catalog"].back-link').click();
  expect(failures).toEqual([]);
});

test('one selected event drives ladder, topology, inspector and progress', async ({ page }) => {
  await open(page, 'tcp');
  await expect(page.locator('#progress-text')).toContainText('1 / 5');
  await expect(page.locator('#flow-readout')).toContainText('SYN');
  await expect(page.locator('.ladder-head .ladder-participant')).toHaveCount(2);
  await expect(page.locator('.ladder-step')).toHaveCount(5);
  await expect(page.locator('#event-list button[aria-current="step"]')).toHaveCount(1);
  await expect(page.locator('.actor.is-sender')).toHaveCount(1);
  await expect(page.locator('.actor.is-receiver')).toHaveCount(1);

  await page.getByRole('button', { name: 'Suivant' }).click();
  await expect(page.locator('#progress-text')).toContainText('2 / 5');
  await expect(page.locator('#flow-readout')).toContainText('SYN, ACK');
  await expect(page.locator('#inspector-body')).toContainText('1001');
  await expect(page.locator('#event-list button[aria-current="step"]')).toHaveCount(1);
  await page.locator('button[data-action="select"][data-index="4"]').click();
  await expect(page.locator('#progress-text')).toContainText('5 / 5');
  await page.getByRole('button', { name: 'Réinitialiser' }).click();
  await expect(page.locator('#progress-text')).toContainText('1 / 5');
});

test('transport playback, speed and pause stay synchronized', async ({ page }) => {
  await open(page, 'tcp');
  await page.locator('#speed-select').selectOption('2');
  await expect(page.locator('#speed-select')).toHaveValue('2');
  await page.locator('#play-control').click();
  await expect(page.locator('#play-control')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#play-control').click();
  await expect(page.locator('#play-control')).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'Suivant' }).click();
  await expect(page.locator('#progress-text')).toContainText('2 / 5');
  await page.getByRole('button', { name: 'Précédent' }).click();
  await expect(page.locator('#progress-text')).toContainText('1 / 5');
});

test('resume remembers protocol and step after reload', async ({ page }) => {
  await open(page, 'tcp');
  await page.getByRole('button', { name: 'Suivant' }).click();
  await page.reload();
  await page.locator('.intro-actions button[data-id="tcp"]').last().click();
  await expect(page.locator('#progress-text')).toContainText('2 / 5');
});

test('discovery and expert reveal different field depth, only sourced sample bytes', async ({ page }) => {
  await open(page, 'http');
  await expect(page.locator('.raw-panel')).toContainText('Passez en mode Expert');
  await page.getByRole('button', { name: 'Expert' }).click();
  await expect(page.locator('.hex-view')).toBeVisible();
  await expect(page.locator('.byte-selected')).toHaveCount(6); // "GET": 3 HEX + 3 ASCII
  await page.locator('button[data-action="inspect-field"][data-field-index="1"]').click();
  await expect(page.locator('button[data-action="inspect-field"][data-field-index="1"]')).toBeFocused();
  await expect(page.locator('.field-explanation')).toContainText('Hôte HTTP demandé');
  await expect(page.locator('.byte-selected')).toHaveCount(0);
  await expect(page.locator('.raw-caption')).toContainText('Pas une trame réseau capturée');
  await page.getByRole('button', { name: 'Découverte' }).click();
  await expect(page.locator('button[data-action="inspect-field"]')).toHaveCount(1);
});

test('TLS 1.3 distinguishes server and client Finished', async ({ page }) => {
  await open(page, 'tls');
  await expect(page.locator('.ladder-step')).toHaveCount(7);
  await expect(page.locator('#event-list')).toContainText('Finished serveur');
  await expect(page.locator('#event-list')).toContainText('Finished client');
  await page.locator('button[data-action="select"][data-index="5"]').click();
  await expect(page.locator('#inspector-body')).toContainText('Finished client');
});

test('theme and RTL orientation preserve technical chart direction', async ({ page }) => {
  await open(page, 'tcp');
  await page.getByRole('button', { name: 'Thème' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.locator('#language-select').selectOption('ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('#event-list')).toBeVisible();
  await expect(page.locator('.ladder-list')).toHaveCSS('direction', 'ltr');
});


test('switching to English translates the navigation, diagram and inspector labels', async ({ page }) => {
  await page.goto('/observatory/');
  await page.locator('#language-select').selectOption('en');
  await expect(page.getByRole('heading', { name: /Internet, event by event/ })).toBeVisible();
  await page.locator('button.protocol-card[data-id="http"]').click();
  await expect(page.getByRole('group', { name: 'Exploration mode' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();
  await expect(page.locator('#flow-readout')).toContainText('LOGICAL FLOW');
  await expect(page.locator('.actor.is-sender .actor-state')).toHaveText('SENDER');
  await expect(page.locator('.actor.is-receiver .actor-state')).toHaveText('RECEIVER');
  await page.getByRole('button', { name: 'Expert' }).click();
  await expect(page.locator('.raw-panel')).toContainText('AUTHORED SAMPLE');
  await expect(page.locator('.raw-caption')).toContainText('Not a captured network frame');
});

test('keyboard focus survives mode/theme/language rerenders and navigation', async ({ page }) => {
  await open(page, 'tcp');
  await expect(page.locator('#lab-title')).toBeFocused();
  await page.getByRole('button', { name: 'Expert' }).click();
  await expect(page.getByRole('button', { name: 'Expert' })).toBeFocused();
  await page.getByRole('button', { name: 'Thème' }).click();
  await expect(page.getByRole('button', { name: 'Thème' })).toBeFocused();
  await page.locator('#language-select').selectOption('en');
  await expect(page.locator('#language-select')).toBeFocused();
  await page.locator('button[data-action="catalog"].back-link').click();
  await expect(page.locator('#home-title')).toBeFocused();
});

test('mobile layout does not scroll horizontally at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, 'http');
  await page.getByRole('button', { name: 'Expert' }).click();
  await expect.poll(async () => page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth
  )).toBe(true);
});

test('ladder keyboard navigation follows event order and keeps the active step in view', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, 'tls');
  await page.locator('#event-list button[data-index="0"]').focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#event-list button[data-index="1"]')).toBeFocused();
  await expect(page.locator('#progress-text')).toContainText('2 / 7');
  await page.keyboard.press('End');
  await expect(page.locator('#event-list button[data-index="6"]')).toBeFocused();
  await expect(page.locator('#progress-text')).toContainText('7 / 7');
  await expect.poll(() => page.locator('#event-list').evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  await page.keyboard.press('Home');
  await expect(page.locator('#event-list button[data-index="0"]')).toBeFocused();
  await expect(page.locator('#progress-text')).toContainText('1 / 7');
});

for (const width of [390, 768, 1440]) {
  for (const theme of ['dark', 'light']) {
    for (const language of ['fr', 'en', 'ar']) {
      test(`visual baseline ${width}px / ${theme} / ${language}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/observatory/');
        await page.evaluate(({ prefix, theme, language }) => {
          localStorage.setItem(prefix + 'theme', theme);
          localStorage.setItem(prefix + 'language', language);
        }, { prefix: storagePrefix, theme, language });
        await page.reload();
        await page.locator('button.protocol-card[data-id="tcp"]').click();
        await expect(page.locator('#inspector-title')).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('lang', language);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        await expect(page.locator('.ladder-step')).toHaveCount(5);
        await page.screenshot({ path: `test-results/observatory-${width}-${theme}-${language}.png`, fullPage: true });
      });
    }
  }
}

test('protocol search filters the catalogue without losing focus', async ({ page }) => {
  await page.goto('/observatory/');
  const input = page.locator('#protocol-search');
  await input.fill('tls');
  await expect(input).toBeFocused();
  await expect(page.locator('.protocol-card:visible')).toHaveCount(1);
  await expect(page.locator('#search-count')).toContainText('1 / 14');
  await page.locator('[data-action="clear-search"]').click();
  await expect(input).toHaveValue('');
  await expect(input).toBeFocused();
  await expect(page.locator('.protocol-card:visible')).toHaveCount(14);
});

test('empty catalogue search has a meaningful empty state', async ({ page }) => {
  await page.goto('/observatory/');
  const input = page.locator('#protocol-search');
  await input.fill('unavailable-protocol-xyz');
  await expect(page.locator('#search-empty')).toBeVisible();
  await input.fill('DNS');
  await expect(page.locator('#search-empty')).toBeHidden();
  await expect(page.locator('.protocol-card:visible')).toHaveCount(1);
});

// Design smoke tests supplement, but do not replace, visual review.
test('V3 search and lab controls stay accessible at narrow mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/observatory/');
  await expect(page.locator('#protocol-search')).toBeVisible();
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth
  )).toBe(true);
  await page.locator('button.protocol-card[data-id="tcp"]').click();
  await expect(page.locator('#play-control')).toBeVisible();
  await expect(page.locator('#event-list button[aria-current="step"]')).toHaveCount(1);
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth
  )).toBe(true);
});
