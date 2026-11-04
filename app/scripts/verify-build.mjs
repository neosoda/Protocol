import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Fail-closed check of the production artifact: only the files this project
 * produces, and a single JS bundle.
 */
const ALLOWED = [
  /^index\.html$/,
  /^(favicon\.svg|site\.webmanifest|icon-(192|512)\.png|apple-touch-icon\.png|og\.png)$/,
  /^fonts\/(inter-[a-z-]+-var\.woff2|inter-OFL\.txt)$/,
  /^assets\/[A-Za-z0-9_.-]+\.(js|css|woff2)$/
];

async function listFiles(root, directory = root) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => {
    const target = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(root, target) : [relative(root, target).split(sep).join('/')];
  }));
  return nested.flat();
}

export async function verifyBuild(dist) {
  const files = await listFiles(dist);
  const unexpected = files.filter(path => !ALLOWED.some(rule => rule.test(path)));
  if (!files.includes('index.html') || unexpected.length) {
    throw new Error('Unexpected build output: ' + JSON.stringify({ index: files.includes('index.html'), unexpected }));
  }
  const html = await readFile(join(dist, 'index.html'), 'utf8');
  if (!html.includes('Network Observatory')) throw new Error('index.html is not the Network Observatory entry');
  const bundles = files.filter(path => /^assets\/.+\.js$/.test(path));
  if (bundles.length !== 1) throw new Error('Expected exactly one JS bundle, found ' + bundles.length);
  return files;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const files = await verifyBuild(resolve(import.meta.dirname, '..', 'dist'));
  console.log('Build check passed:', files.join(', '));
}
