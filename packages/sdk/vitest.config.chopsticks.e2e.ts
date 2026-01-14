import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['e2e/chopsticks/*.chopsticks.test.ts'],
    testTimeout: 60000,
    hookTimeout: 60000,
    maxWorkers: 1
  }
})
