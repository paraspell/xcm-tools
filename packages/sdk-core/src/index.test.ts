import { describe, expect, it } from 'vitest'

import * as sdk from './index'

describe('Module Exports', () => {
  it('should export NODE_NAMES_DOT_KSM and other constants', () => {
    expect(sdk.NODE_NAMES_DOT_KSM).toBeDefined()
    expect(sdk.NODE_NAMES).toBeDefined()
    expect(sdk.NODES_WITH_RELAY_CHAINS).toBeDefined()
    expect(sdk.NODES_WITH_RELAY_CHAINS_DOT_KSM).toBeDefined()
    expect(sdk.SUPPORTED_PALLETS).toBeDefined()
  })

  it('should export utility functions', () => {
    expect(sdk.getNode).toBeDefined()
    expect(sdk.createApiInstanceForNode).toBeDefined()
    expect(sdk.isRelayChain).toBeDefined()
    expect(sdk.determineRelayChain).toBeDefined()
  })

  it('should export node config functions', () => {
    expect(sdk.getNodeConfig).toBeDefined()
    expect(sdk.getNodeProviders).toBeDefined()
    expect(sdk.getParaId).toBeDefined()
  })
})
