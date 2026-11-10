import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = path => readFile(resolve(root, path), 'utf8');

test('Protocol identity is consistent in metadata, manifest, favicon and UI', async () => {
  const [html, manifestJson, favicon, icons, main, i18n, css] = await Promise.all([
    read('index.html'), read('public/site.webmanifest'), read('public/favicon.svg'),
    read('src/views/icons.ts'), read('src/main.ts'), read('src/i18n.ts'), read('src/ui/styles.css')
  ]);
  const manifest = JSON.parse(manifestJson);
  assert.ok(html.includes('<title>Protocol.techsentinel.fr'));
  assert.ok(html.includes('17 leçons animées'));
  assert.ok(!html.includes('14 leçons'));
  assert.equal(manifest.name, 'Protocol.techsentinel.fr');
  assert.equal(manifest.short_name, 'Protocol');
  assert.ok(favicon.includes('viewBox="0 0 96 96"'));
  assert.ok(favicon.includes('protocol-cyan'));
  assert.ok(icons.includes('protocol-cyan'));
  assert.ok(main.includes('brand-domain'));
  assert.ok(main.includes('Protocol.techsentinel.fr'));
  assert.ok(i18n.includes("brand: 'Protocol'"));
  assert.ok(css.includes('--bg:#0B1026'));
  assert.ok(css.includes('--accent:#00E5FF'));
});

test('French and English readmes show language switchers and identity preview', async () => {
  const [fr,en] = await Promise.all([read('../README.md'), read('../README.en.md')]);
  for (const content of [fr,en]) {
    assert.ok(content.includes('Protocol.techsentinel.fr'));
    assert.ok(content.includes('docs/protocol-brand.svg'));
  }
  assert.ok(fr.includes('[🇬🇧 English](README.en.md)'));
  assert.ok(en.includes('[🇫🇷 Français](README.md)'));
});
