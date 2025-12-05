import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.e2e-spec.ts'],
    globals: true,
    root: './',
    testTimeout: 120000,
  },
  plugins: [
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
});
