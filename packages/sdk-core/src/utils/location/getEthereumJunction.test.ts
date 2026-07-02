import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { ETH_MAINNET_PARA_ID, ETH_TESTNET_PARA_ID } from '../../constants'
import { getEthereumJunction } from './getEthereumJunction'

const mockApi = {
  getRelayChainOf: vi.fn()
} as unknown as PolkadotApi<unknown, unknown, unknown>

describe('getEthereumJunction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns mainnet chainId as bigint by default', () => {
    vi.spyOn(mockApi, 'getRelayChainOf').mockReturnValue('Polkadot')

    const result = getEthereumJunction(mockApi, 'AssetHubPolkadot')

    expect(result).toEqual({
      GlobalConsensus: {
        Ethereum: { chainId: BigInt(ETH_MAINNET_PARA_ID) }
      }
    })
  })

  it('returns testnet chainId for Westend/Paseo', () => {
    vi.spyOn(mockApi, 'getRelayChainOf').mockReturnValue('Westend')

    const result = getEthereumJunction(mockApi, 'AssetHubWestend')

    expect(result).toEqual({
      GlobalConsensus: {
        Ethereum: { chainId: BigInt(ETH_TESTNET_PARA_ID) }
      }
    })
  })

  it('returns chainId as number when useBigInt is false', () => {
    vi.spyOn(mockApi, 'getRelayChainOf').mockReturnValue('Paseo')

    const result = getEthereumJunction(mockApi, 'AssetHubPaseo', false)

    expect(result).toEqual({
      GlobalConsensus: {
        Ethereum: { chainId: ETH_TESTNET_PARA_ID }
      }
    })
  })
})
