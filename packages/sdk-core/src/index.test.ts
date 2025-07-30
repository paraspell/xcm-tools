import { describe, expect, it } from 'vitest'

import * as sdk from './index'

describe('Module Exports', () => {
  it('should export CHAIN_NAMES_DOT_KSM and other constants', () => {
    expect(sdk.PARACHAINS).toBeDefined()
    expect(sdk.RELAYCHAINS).toBeDefined()
    expect(sdk.EXTERNAL_CHAINS).toBeDefined()
    expect(sdk.CHAINS).toBeDefined()
    expect(sdk.SUPPORTED_PALLETS).toBeDefined()
    expect(sdk.TX_CLIENT_TIMEOUT_MS).toBeDefined()
    expect(sdk.DRY_RUN_CLIENT_TIMEOUT_MS).toBeDefined()
  })

  it('should export utility functions', () => {
    expect(sdk.getChain).toBeDefined()
    expect(sdk.createChainClient).toBeDefined()
    expect(sdk.isRelayChain).toBeDefined()
    expect(sdk.getRelayChainOf).toBeDefined()
  })

  it('should export chain config functions', () => {
    expect(sdk.getChainConfig).toBeDefined()
    expect(sdk.getChainProviders).toBeDefined()
    expect(sdk.getParaId).toBeDefined()
  })
})
