import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['e2e/*.chopsticks.test.ts'],
    testTimeout: 60000,
    hookTimeout: 60000
  }
})
