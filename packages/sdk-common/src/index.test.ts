import { describe, expect, it } from 'vitest'

import * as rootExports from './index'

describe('index.ts re-exports', () => {
  it('loads index.ts', () => {
    expect(rootExports).toBeDefined()
  })

  it('contains expected exports', () => {
    expect(rootExports.PARACHAINS).toBeDefined()
    expect(rootExports.RELAYCHAINS).toBeDefined()
    expect(rootExports.SUBSTRATE_CHAINS).toBeDefined()
    expect(rootExports.EXTERNAL_CHAINS).toBeDefined()
    expect(rootExports.CHAINS).toBeDefined()
    expect(rootExports.Parents).toBeDefined()
    expect(rootExports.deepEqual).toBeDefined()
    expect(rootExports.hasJunction).toBeDefined()
    expect(rootExports.isTLocation).toBeDefined()
  })
})
