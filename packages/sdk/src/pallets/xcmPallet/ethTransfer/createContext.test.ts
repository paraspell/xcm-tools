import { describe, it, expect, vi } from 'vitest'
import { contextFactory } from '@snowbridge/api'
import { AbstractProvider } from 'ethers'
import { createContext } from './createContext'
import { Config } from '@snowbridge/api/dist/environment'

vi.mock('@snowbridge/api', () => ({
  contextFactory: vi.fn()
}))
vi.mock('ethers', () => ({
  AbstractProvider: class {}
}))

describe('createContext', () => {
  it('creates a context with the correct structure', async () => {
    const mockConfig = {
      BEACON_HTTP_API: 'http://beacon-api.test',
      BRIDGE_HUB_URL: 'http://bridge-hub.test',
      ASSET_HUB_URL: 'http://asset-hub.test',
      RELAY_CHAIN_URL: 'http://relay-chain.test',
      PARACHAINS: ['http://parachain1.test', 'http://parachain2.test'],
      GATEWAY_CONTRACT: '0xGatewayContract',
      BEEFY_CONTRACT: '0xBeefyContract'
    }
    const executionUrl = 'http://execution-url.test'

    await createContext(executionUrl, mockConfig as Config)

    expect(contextFactory).toHaveBeenCalledWith({
      ethereum: {
        execution_url: executionUrl,
        beacon_url: mockConfig.BEACON_HTTP_API
      },
      polkadot: {
        url: {
          bridgeHub: mockConfig.BRIDGE_HUB_URL,
          assetHub: mockConfig.ASSET_HUB_URL,
          relaychain: mockConfig.RELAY_CHAIN_URL,
          parachains: mockConfig.PARACHAINS
        }
      },
      appContracts: {
        gateway: mockConfig.GATEWAY_CONTRACT,
        beefy: mockConfig.BEEFY_CONTRACT
      }
    })
  })

  it('handles different types of executionUrl inputs', async () => {
    const mockConfig = {
      BEACON_HTTP_API: 'http://beacon-api.test'
    }
    const providerMock = new AbstractProvider()

    await createContext(providerMock, mockConfig as Config)

    expect(contextFactory).toHaveBeenCalledWith(
      expect.objectContaining({
        ethereum: expect.objectContaining({
          execution_url: providerMock
        })
      })
    )
  })
})
