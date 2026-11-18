import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 7000,
    strictPort: true,
    host: true
  },
  preview: {
    port: 7000,
    strictPort: true,
    host: true
  }
});
