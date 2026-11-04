import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Fail-closed production gate: only the original modern Observatory root,
 * its Vite-generated assets, and no copy of historical public/ can ship.
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
  const entry = 'index.html';
  const allowed = path => path === entry || /^assets\/[A-Za-z0-9_.-]+\.(?:css|js|svg)$/.test(path);
  const unexpected = files.filter(path => !allowed(path));
  if (!files.includes(entry) || unexpected.length > 0) {
    throw new Error('Unsafe Observatory build: missing modern root entry or unexpected artifacts: ' +
      JSON.stringify({ rootEntry: files.includes(entry), unexpected }));
  }

  const html = await readFile(join(dist, entry), 'utf8');
  if (!html.includes('Network Observatory') ||
      !/<div\s+id=["']app["']/.test(html) ||
      !/<script\b[^>]*type=["']module["']/.test(html) ||
      /data-layout=["']phone["']|class=["']is-stacked/.test(html)) {
    throw new Error('Production root must be the original modern Observatory application, never the historical HTML');
  }
  const bundles = files.filter(path => /^assets\/.+\.js$/.test(path));
  if (bundles.length !== 1) {
    throw new Error('Expected exactly one modern Observatory JS bundle; found ' + bundles.length);
  }
  return files;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const files = await verifyBuild(resolve(import.meta.dirname, '..', 'dist'));
  console.log('Production artifact gate passed (modern Observatory at / only):', files.join(', '));
}
