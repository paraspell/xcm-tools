import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['e2e/swap.test.ts'],
    testTimeout: 120000,
    hookTimeout: 120000
  }
})
