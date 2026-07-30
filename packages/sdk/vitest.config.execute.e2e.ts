import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

const alias = {
  '@paraspell/sdk': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
  '@paraspell/sdk-core': fileURLToPath(new URL('../sdk-core/src/index.ts', import.meta.url))
}

export default defineConfig({
  resolve: {
    alias
  },
  test: {
    bail: 0,
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'execute-pay-fees',
          include: ['e2e/execute-pay-fees.test.ts'],
          testTimeout: 240000,
          hookTimeout: 240000,
          maxWorkers: 1
        }
      },
      {
        resolve: { alias },
        test: {
          name: 'execute-buy-execution',
          include: ['e2e/execute-buy-execution.test.ts'],
          testTimeout: 240000,
          hookTimeout: 240000,
          maxWorkers: 1
        }
      }
    ]
  }
})
