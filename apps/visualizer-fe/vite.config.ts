import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import wasm from 'vite-plugin-wasm';

export default defineConfig({
  plugins: [react(), svgr(), wasm()],
  build: {
    target: 'esnext'
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext'
    }
  }
});
