import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.module.ts', 'src/**/*.test.ts', 'src/types/types.ts'],
    },
  },
  plugins: [
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
});
