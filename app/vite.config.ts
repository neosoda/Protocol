import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

/**
 * V4: the original Observatory becomes the production ROOT entry.
 * Never rebuild the historical third-party page or copy historical public/.
 * The /observatory/ compatibility URL redirects to / through the
 * Coolify Nginx configuration in deploy/nginx.conf.
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
