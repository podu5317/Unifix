import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The /api proxy means the dev frontend talks to the backend on port 5000
// without any CORS issues during development.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/tests/setup.js',
  },
});
