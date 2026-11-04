import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        legacy: fileURLToPath(new URL('./index.html', import.meta.url)),
        observatory: fileURLToPath(new URL('./observatory/index.html', import.meta.url))
      }
    }
  }
});
