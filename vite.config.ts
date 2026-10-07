import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Mirrors the api/cdx.ts Vercel function during local development.
    proxy: {
      '/api/cdx': {
        target: 'https://web.archive.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/cdx/, '/cdx/search/cdx'),
      },
    },
  },
});
