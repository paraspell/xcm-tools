import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ETH_MAINNET_PARA_ID, ETH_TESTNET_PARA_ID } from '../../constants'
import { getRelayChainOf } from '../chain'
import { getEthereumJunction } from './getEthereumJunction'

vi.mock('../chain')

describe('getEthereumJunction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns mainnet chainId as bigint by default', () => {
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')

    const result = getEthereumJunction('AssetHubPolkadot')

    expect(result).toEqual({
      GlobalConsensus: {
        Ethereum: { chainId: BigInt(ETH_MAINNET_PARA_ID) }
      }
    })
  })

  it('returns testnet chainId for Westend/Paseo', () => {
    vi.mocked(getRelayChainOf).mockReturnValue('Westend')

    const result = getEthereumJunction('AssetHubWestend')

    expect(result).toEqual({
      GlobalConsensus: {
        Ethereum: { chainId: BigInt(ETH_TESTNET_PARA_ID) }
      }
    })
  })

  it('returns chainId as number when useBigInt is false', () => {
    vi.mocked(getRelayChainOf).mockReturnValue('Paseo')

    const result = getEthereumJunction('AssetHubPaseo', false)

    expect(result).toEqual({
      GlobalConsensus: {
        Ethereum: { chainId: ETH_TESTNET_PARA_ID }
      }
    })
  })
})
