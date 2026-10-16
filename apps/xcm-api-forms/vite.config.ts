import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  base: './',
  envDir: '../xcm-api',
  server: {
    proxy: {
      '/auth': 'http://localhost:3001',
    },
  },
});
