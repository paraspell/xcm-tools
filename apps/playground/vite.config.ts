import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import wasm from 'vite-plugin-wasm';
import packageJsonSdk from '../../packages/sdk-core/package.json';
import packageJsonRouter from '../../packages/xcm-router/package.json';
import packageJsonAnalyser from '../../packages/xcm-analyser/package.json';

export default defineConfig({
  plugins: [react(), nodePolyfills(), wasm()],
  build: {
    target: 'esnext',
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },
  define: {
    'import.meta.env.VITE_XCM_SDK_VERSION': JSON.stringify(
      packageJsonSdk.version,
    ),
    'import.meta.env.VITE_XCM_ROUTER_VERSION': JSON.stringify(
      packageJsonRouter.version,
    ),
    'import.meta.env.VITE_XCM_ANALYSER_VERSION': JSON.stringify(
      packageJsonAnalyser.version,
    ),
  },
});
