import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    restoreMocks: true,
    include: ['src/**/*.test.ts'],
  },
});
