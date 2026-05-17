import { defineConfig } from 'vite';

export default defineConfig({
  root: 'app',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: false
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
      '/create-preference': 'http://localhost:4000'
    }
  }
});
