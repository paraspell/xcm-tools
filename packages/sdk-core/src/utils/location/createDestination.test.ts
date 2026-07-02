import type { TChain, TSubstrateChain } from '@paraspell/sdk-common'
import { isExternalChain, isSubstrateBridge, Parents, Version } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { createDestination } from './createDestination'

const mockApi = {
  getRelayChainOf: vi.fn()
} as unknown as PolkadotApi<unknown, unknown, unknown>

vi.mock('@paraspell/sdk-common', async importActual => ({
  ...(await importActual()),
  isSubstrateBridge: vi.fn(),
  isExternalChain: vi.fn()
}))

describe('createDestination', () => {
  it('creates sub bridge destination location with global consensus', () => {
    const origin: TSubstrateChain = 'BridgeHubPolkadot'
    const destination: TSubstrateChain = 'BridgeHubKusama'
    const chainId = 4000

    vi.mocked(isSubstrateBridge).mockReturnValue(true)
    vi.mocked(isExternalChain).mockReturnValue(false)
    vi.spyOn(mockApi, 'getRelayChainOf').mockReturnValue('Kusama')

    const location = createDestination(mockApi, Version.V5, origin, destination, chainId)

    expect(location).toEqual({
      parents: Parents.TWO,
      interior: {
        X2: [{ GlobalConsensus: 'Kusama' }, { Parachain: chainId }]
      }
    })
  })

  it('creates snowbridge destination location with ethereum junction', () => {
    const origin: TSubstrateChain = 'BridgeHubPolkadot'
    const destination: TChain = 'Ethereum'
    const chainId = 1

    vi.mocked(isSubstrateBridge).mockReturnValue(false)
    vi.mocked(isExternalChain).mockReturnValue(false)
    vi.spyOn(mockApi, 'getRelayChainOf').mockReturnValue('Polkadot')

    const location = createDestination(mockApi, Version.V5, origin, destination, chainId)

    expect(location).toEqual({
      parents: Parents.TWO,
      interior: {
        X1: [
          {
            GlobalConsensus: { Ethereum: { chainId: BigInt(chainId) } }
          }
        ]
      }
    })
  })
})
