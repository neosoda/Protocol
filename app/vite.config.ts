import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

/**
 * The historical site is retained for local comparison, but is NOT part of
 * production output. Its licensing is unresolved; see RIGHTS_AND_ATTRIBUTIONS.
 *
 * Vite copies all of public/ by default, including historical bundles. Keep
 * public/ available in development only; the observatory icon is imported
 * explicitly by the modern HTML entry.
 */
export default defineConfig(({ command }) => ({
  publicDir: command === 'build' ? false : 'public',
  build: {
    rollupOptions: {
      input: {
        observatory: fileURLToPath(new URL('./observatory/index.html', import.meta.url))
      }
    }
  }
}));
