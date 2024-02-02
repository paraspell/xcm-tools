import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, 'playground/**/*', '**/*.integration.test.ts'],
    testTimeout: 120000,
    hookTimeout: 120000,
  },
});
