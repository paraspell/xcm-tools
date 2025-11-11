import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['e2e/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    maxWorkers: 1
  }
})
