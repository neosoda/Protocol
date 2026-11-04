import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * A fail-closed build gate. It validates the generated artifact, not just
 * the Vite configuration. In particular, historical public/ assets are
 * never permitted in an Observatory production bundle.
 */
export async function verifyBuild(dist) {
  async function listFiles(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const nested = await Promise.all(entries.map(async entry => {
      const target = join(directory, entry.name);
      return entry.isDirectory() ? listFiles(target) : [relative(dist, target).split(sep).join('/')];
    }));
    return nested.flat();
  }

  const files = await listFiles(dist);
  const entry = 'observatory/index.html';
  const allowed = path => path === entry || /^assets\/[A-Za-z0-9_.-]+\.(?:css|js|svg)$/.test(path);
  const unexpected = files.filter(path => !allowed(path));
  if (!files.includes(entry) || unexpected.length > 0) {
    throw new Error('Unsafe Observatory build: missing entry or unexpected artifacts: ' +
      JSON.stringify({ entry: files.includes(entry), unexpected }));
  }
  const html = await readFile(join(dist, entry), 'utf8');
  if (!html.includes('Network Observatory')) {
    throw new Error('Observatory entry is missing from the production build');
  }
  const bundles = files.filter(path => /^assets\/.+\.js$/.test(path));
  if (bundles.length !== 1) {
    throw new Error('Expected exactly one modern Observatory JS bundle; found ' + bundles.length);
  }
  return files;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const files = await verifyBuild(resolve(import.meta.dirname, '..', 'dist'));
  console.log('Production artifact gate passed (modern Observatory only):', files.join(', '));
}
