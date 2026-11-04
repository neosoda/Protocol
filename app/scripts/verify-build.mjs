import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';

/**
 * A build-time safety net: Vite must not package the unlicensed legacy entry
 * or its public/ bundles. Fails closed if unexpected files reach dist/.
 */
const dist = resolve(import.meta.dirname, '..', 'dist');

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async entry => {
    const target = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(target) : [relative(dist, target).split(sep).join('/')];
  }));
  return nested.flat();
}

const files = await listFiles(dist);
const expectedEntry = 'observatory/index.html';
const allowed = path => path === expectedEntry || /^assets\/[A-Za-z0-9_.-]+\.(?:css|js|svg)$/.test(path);
const unexpected = files.filter(path => !allowed(path));
if (!files.includes(expectedEntry) || unexpected.length > 0) {
  throw new Error('Unsafe Observatory build: missing entry or unexpected artifacts: ' +
    JSON.stringify({ entry: files.includes(expectedEntry), unexpected }));
}
const html = await readFile(join(dist, expectedEntry), 'utf8');
if (!html.includes('Network Observatory')) {
  throw new Error('Observatory entry is missing from the production build');
}
if (!files.some(path => /^assets\/.+\.js$/.test(path))) {
  throw new Error('Observatory application bundle is missing');
}
console.log('Production artifact gate passed (modern Observatory only):', files.join(', '));
