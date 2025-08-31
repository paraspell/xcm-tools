import { ETH_CHAIN_ID, getParaId } from '@paraspell/sdk-core'
import { Context } from '@snowbridge/api'
import type { Config, SnowbridgeEnvironment } from '@snowbridge/api/dist/environment'
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
    ETHEREUM_CHAINS: {
      '1': 'http://ethereum-chain.test'
    },
    GRAPHQL_API_URL: 'http://graphql.test',
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

  const mockEnv: SnowbridgeEnvironment = {
    name: 'test-environment',
    ethChainId: 1,
    config: mockConfig,
    locations: []
  }

  it('creates a context with the correct structure', () => {
    const executionUrl = 'http://execution-url.test'

    createContext(executionUrl, mockEnv)

    expect(Context).toHaveBeenCalledWith({
      environment: mockEnv.name,
      ethereum: {
        ethChainId: mockEnv.ethChainId,
        ethChains: {
          [ETH_CHAIN_ID.toString()]: executionUrl,
          [getParaId('Moonbeam')]: 'https://rpc.api.moonbeam.network'
        },
        beacon_url: mockConfig.BEACON_HTTP_API
      },
      graphqlApiUrl: mockConfig.GRAPHQL_API_URL,
      polkadot: {
        assetHubParaId: mockConfig.ASSET_HUB_PARAID,
        bridgeHubParaId: mockConfig.BRIDGE_HUB_PARAID,
        parachains: mockConfig.PARACHAINS,
        relaychain: mockConfig.RELAY_CHAIN_URL
      },
      appContracts: {
        gateway: mockConfig.GATEWAY_CONTRACT,
        beefy: mockConfig.BEEFY_CONTRACT
      }
    })
  })
})
