import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verifyBuild } from './verify-build.mjs';

async function withFixture(check) {
  const directory = await mkdtemp(join(tmpdir(), 'observatory-build-'));
  try {
    await mkdir(join(directory, 'observatory'));
    await mkdir(join(directory, 'assets'));
    await writeFile(join(directory, 'observatory', 'index.html'), '<title>Network Observatory</title>');
    await writeFile(join(directory, 'assets', 'main-abc123.js'), '/* original modern app */');
    await check(directory);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
}

test('minimal modern Observatory artifact passes the release gate', async () => {
  await withFixture(async directory => {
    assert.deepEqual((await verifyBuild(directory)).sort(), ['assets/main-abc123.js', 'observatory/index.html']);
  });
});

test('legacy root entry and copied public bundles fail closed', async () => {
  await withFixture(async directory => {
    await writeFile(join(directory, 'index.html'), '<title>historical app</title>');
    await writeFile(join(directory, 'assets', 'fr-QqmZdpVw.js'), '/* historical bundle */');
    await assert.rejects(verifyBuild(directory), /Unsafe Observatory build/);
  });
});

test('a second JS bundle fails closed even if its filename looks acceptable', async () => {
  await withFixture(async directory => {
    await writeFile(join(directory, 'assets', 'old-app.js'), '/* history */');
    await assert.rejects(verifyBuild(directory), /exactly one modern Observatory JS bundle/);
  });
});

test('missing or mislabeled Observatory entry is rejected', async () => {
  await withFixture(async directory => {
    await writeFile(join(directory, 'observatory', 'index.html'), '<title>Unknown app</title>');
    await assert.rejects(verifyBuild(directory), /Observatory entry is missing/);
  });
});
