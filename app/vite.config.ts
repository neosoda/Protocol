import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

/**
 * V4: the original Observatory becomes the production ROOT entry.
 * Never rebuild the historical third-party page or copy historical public/.
 * The /observatory/ path stays available in dev and is rewritten to the root
 * single-page entry by Vercel in production.
 */
export default defineConfig(({ command }) => ({
  publicDir: command === 'build' ? false : 'public',
  build: {
    rollupOptions: {
      input: {
        app: fileURLToPath(new URL('./index.html', import.meta.url))
      }
    }
  }
}));
