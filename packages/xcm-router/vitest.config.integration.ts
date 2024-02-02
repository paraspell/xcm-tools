import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.integration.test.ts'],
    exclude: [...configDefaults.exclude, 'playground/**/*'],
    testTimeout: 120000,
    hookTimeout: 120000,
  },
});
