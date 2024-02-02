import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, 'playground/**/*'],
    testTimeout: 120000,
    hookTimeout: 120000,
    coverage: {
      include: ['src/**/*'],
    },
  },
});
