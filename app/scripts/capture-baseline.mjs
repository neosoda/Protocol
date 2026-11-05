import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';

const base = process.env.BASELINE_URL ?? 'http://127.0.0.1:5199';
const output = resolve('..', 'docs', 'baselines', 'v7');
const sizes = { desktop: { width: 1440, height: 900 }, tablet: { width: 768, height: 1024 }, mobile: { width: 390, height: 844 } };
const lessons = { tcp: [0, 5, 6], dns: [0, 7], dhcp: [0, 1, 3], http: [0, 3], tls: [0, 2] };
const manifest = [];
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
try {
  for (const [device, viewport] of Object.entries(sizes)) {
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
      await context.addInitScript(({ theme }) => {
        localStorage.setItem('observatory:lang', 'fr');
        localStorage.setItem('observatory:theme', theme);
        localStorage.removeItem('observatory:progress');
      }, { theme });
      const page = await context.newPage();
      for (const [lesson, steps] of Object.entries(lessons)) {
        await page.goto(`${base}/#/${lesson}`, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        for (const step of steps) {
          await page.locator('.tick').nth(step).click();
          const name = `${device}-${theme}-${lesson}-step-${step + 1}.png`;
          const file = join(output, name);
          await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
          const sha256 = createHash('sha256').update(await readFile(file)).digest('hex');
          manifest.push({ name, sha256, viewport, theme, lesson, step: step + 1 });
        }
      }
      await context.close();
    }
  }
} finally {
  await browser.close();
}
await writeFile(join(output, 'manifest.json'), JSON.stringify({ source: 'V7 baseline — reduced-motion static states; validate normal motion separately', files: manifest }, null, 2) + '\n');
console.log(`Captured ${manifest.length} baseline screenshots in ${output}`);
