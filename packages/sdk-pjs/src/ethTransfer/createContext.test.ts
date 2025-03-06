import { Context } from '@snowbridge/api'
import type { Config } from '@snowbridge/api/dist/environment'
import { describe, expect, it, vi } from 'vitest'

import { createContext } from './createContext'

vi.mock('@snowbridge/api', () => ({
  Context: vi.fn().mockImplementation(() => ({}))
}))
vi.mock('ethers', () => ({
  AbstractProvider: class {}
}))

describe('createContext', () => {
  const mockConfig: Config = {
    BEACON_HTTP_API: 'http://beacon-api.test',
    ETHEREUM_API: (secret: string) => `http://ethereum-api.test/${secret}`,
    RELAY_CHAIN_URL: 'http://relay-chain.test',
    GATEWAY_CONTRACT: '0xGatewayContract',
    BEEFY_CONTRACT: '0xBeefyContract',
    ASSET_HUB_PARAID: 1000,
    BRIDGE_HUB_PARAID: 2000,
    PRIMARY_GOVERNANCE_CHANNEL_ID: '1',
    SECONDARY_GOVERNANCE_CHANNEL_ID: '2',
    RELAYERS: [],
    PARACHAINS: {
      '1000': 'http://asset-hub.test',
      '1002': 'http://bridge-hub.test'
    }
  }

  it('creates a context with the correct structure', () => {
    const executionUrl = 'http://execution-url.test'

    createContext(executionUrl, mockConfig)

    expect(Context).toHaveBeenCalledWith({
      ethereum: {
        execution_url: executionUrl,
        beacon_url: mockConfig.BEACON_HTTP_API
      },
      polkadot: {
        assetHubParaId: mockConfig.ASSET_HUB_PARAID,
        bridgeHubParaId: mockConfig.BRIDGE_HUB_PARAID,
        relaychain: mockConfig.RELAY_CHAIN_URL,
        parachains: mockConfig.PARACHAINS
      },
      appContracts: {
        gateway: mockConfig.GATEWAY_CONTRACT,
        beefy: mockConfig.BEEFY_CONTRACT
      }
    })
  })
})
