import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { ETH_MAINNET_PARA_ID, ETH_TESTNET_PARA_ID } from '../../constants'
import { getRelayChainOfImpl } from '../chain'
import { getEthereumJunction } from './getEthereumJunction'

vi.mock('../chain')

const mockApi = {} as PolkadotApi<unknown, unknown, unknown>

describe('getEthereumJunction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns mainnet chainId as bigint by default', () => {
    vi.mocked(getRelayChainOfImpl).mockReturnValue('Polkadot')

    const result = getEthereumJunction(mockApi, 'AssetHubPolkadot')

    expect(result).toEqual({
      GlobalConsensus: {
        Ethereum: { chainId: BigInt(ETH_MAINNET_PARA_ID) }
      }
    })
  })

  it('returns testnet chainId for Westend/Paseo', () => {
    vi.mocked(getRelayChainOfImpl).mockReturnValue('Westend')

    const result = getEthereumJunction(mockApi, 'AssetHubWestend')

    expect(result).toEqual({
      GlobalConsensus: {
        Ethereum: { chainId: BigInt(ETH_TESTNET_PARA_ID) }
      }
    })
  })

  it('returns chainId as number when useBigInt is false', () => {
    vi.mocked(getRelayChainOfImpl).mockReturnValue('Paseo')

    const result = getEthereumJunction(mockApi, 'AssetHubPaseo', false)

    expect(result).toEqual({
      GlobalConsensus: {
        Ethereum: { chainId: ETH_TESTNET_PARA_ID }
      }
    })
  })
})
