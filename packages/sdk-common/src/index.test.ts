import { describe, expect, it } from 'vitest'

import * as rootExports from './index'

describe('index.ts re-exports', () => {
  it('loads index.ts', () => {
    expect(rootExports).toBeDefined()
  })

  it('contains expected exports', () => {
    expect(rootExports.NODES_WITH_RELAY_CHAINS).toBeDefined()
    expect(rootExports.NODES_WITH_RELAY_CHAINS_DOT_KSM).toBeDefined()
    expect(rootExports.NODE_NAMES).toBeDefined()
    expect(rootExports.NODE_NAMES_DOT_KSM).toBeDefined()
    expect(rootExports.Parents).toBeDefined()
    expect(rootExports.deepEqual).toBeDefined()
    expect(rootExports.hasJunction).toBeDefined()
    expect(rootExports.isTMultiLocation).toBeDefined()
  })
})
