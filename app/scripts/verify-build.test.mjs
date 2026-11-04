import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verifyBuild } from './verify-build.mjs';

const validHtml = '<!doctype html><html><head><title>Network Observatory</title><script type="module" src="/assets/main-abc123.js"></script></head><body><div id="app"></div></body></html>';

async function withFixture(check) {
  const directory = await mkdtemp(join(tmpdir(), 'observatory-root-build-'));
  try {
    await mkdir(join(directory, 'assets'));
    await writeFile(join(directory, 'index.html'), validHtml);
    await writeFile(join(directory, 'assets', 'main-abc123.js'), '/* original modern app */');
    await check(directory);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
}

test('modern Observatory root with a single JS bundle passes the release gate', async () => {
  await withFixture(async directory => {
    assert.deepEqual((await verifyBuild(directory)).sort(), ['assets/main-abc123.js', 'index.html']);
  });
});

test('historical root HTML is rejected even at the correct path', async () => {
  await withFixture(async directory => {
    await writeFile(join(directory, 'index.html'), '<title>Protocol Explorer</title><div data-layout="phone">Historical</div>');
    await assert.rejects(verifyBuild(directory), /Production root must be/);
  });
});

test('historical public bundles and extra HTML are rejected', async () => {
  await withFixture(async directory => {
    await mkdir(join(directory, 'observatory'));
    await writeFile(join(directory, 'observatory', 'index.html'), validHtml);
    await assert.rejects(verifyBuild(directory), /Unsafe Observatory build/);
  });
});

test('unexpected second JS bundle is rejected even with a plausible filename', async () => {
  await withFixture(async directory => {
    await writeFile(join(directory, 'assets', 'legacy-xyz.js'), '/* history */');
    await assert.rejects(verifyBuild(directory), /exactly one modern Observatory JS bundle/);
  });
});

test('non-module or missing mount is rejected', async () => {
  await withFixture(async directory => {
    await writeFile(join(directory, 'index.html'), '<title>Network Observatory</title><div id="app"></div>');
    await assert.rejects(verifyBuild(directory), /Production root must be/);
  });
});
