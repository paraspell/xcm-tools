import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@paraspell/sdk': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      '@paraspell/sdk-core': fileURLToPath(new URL('../sdk-core/src/index.ts', import.meta.url))
    }
  },
  test: {
    disableConsoleIntercept: true,
    include: ['e2e/execute-discovery.test.ts'],
    testTimeout: 240000,
    hookTimeout: 240000,
    maxWorkers: 1
  }
})
