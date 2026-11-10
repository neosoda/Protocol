import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { verifyBuild } from './verify-build.mjs';

async function fixture(files) {
  const root = await mkdtemp(join(tmpdir(), 'observatory-dist-'));
  for (const [path, content] of Object.entries(files)) {
    await mkdir(join(root, path, '..'), { recursive: true });
    await writeFile(join(root, path), content);
  }
  return root;
}
const good = {
  'index.html': '<title>Protocol.techsentinel.fr</title>',
  'assets/index-abc.js': 'console.log(1)',
  'assets/index-abc.css': 'body{}',
  'favicon.svg': '<svg/>',
  'fonts/inter-latin-var.woff2': 'x'
};

test('accepts the expected artifact', async () => {
  const root = await fixture(good);
  try { assert.equal((await verifyBuild(root)).length, 5); } finally { await rm(root, { recursive: true }); }
});

test('rejects unknown files', async () => {
  const root = await fixture({ ...good, 'assets/de-HYTLkJDz.json': '{}' });
  try { await assert.rejects(verifyBuild(root), /Unexpected build output/); } finally { await rm(root, { recursive: true }); }
});

test('rejects a second JS bundle', async () => {
  const root = await fixture({ ...good, 'assets/extra.js': '' });
  try { await assert.rejects(verifyBuild(root), /exactly one JS bundle/); } finally { await rm(root, { recursive: true }); }
});
