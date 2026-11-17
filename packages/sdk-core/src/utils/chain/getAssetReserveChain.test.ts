import type { TJunctionType, TLocation, TSubstrateChain } from '@paraspell/sdk-common'
import { Parents } from '@paraspell/sdk-common'
import { deepEqual, getJunctionValue } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { getTChain } from '../../chains/getTChain'
import { RoutingResolutionError } from '../../errors'
import { getAssetReserveChain, getAssetReserveChainImpl } from './getAssetReserveChain'
import { getRelayChainOf, getRelayChainOfImpl } from './getRelayChainOf'

vi.mock('@paraspell/sdk-common', async importActual => ({
  ...(await importActual()),
  getJunctionValue: vi.fn(),
  deepEqual: vi.fn(),
  Parents: { ONE: 1 }
}))

vi.mock('../../chains/getTChain', { spy: true })
vi.mock('./getRelayChainOf')

const mockJunctions = (values: Partial<Record<TJunctionType, unknown>>) => {
  vi.mocked(getJunctionValue).mockImplementation(
    (_, junctionType: TJunctionType) => values[junctionType]
  )
}

describe('getAssetReserveChain', () => {
  const mockOrigin: TSubstrateChain = 'Acala'
  const mockAssetLocation: TLocation = {
    parents: 1,
    interior: { X1: { Parachain: 1000 } }
  }

  it('returns parachain when paraId is found', () => {
    mockJunctions({ Parachain: 1000 })
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
    vi.mocked(getTChain).mockReturnValue('Darwinia')

    const result = getAssetReserveChain(mockOrigin, mockAssetLocation)

    expect(getTChain).toHaveBeenCalledWith(1000, 'Polkadot')
    expect(result).toBe('Darwinia')
  })

  it('uses kusama when origin relay chain is Kusama', () => {
    mockJunctions({ Parachain: 2000 })
    vi.mocked(getRelayChainOf).mockReturnValue('Kusama')
    vi.mocked(getTChain).mockReturnValue('Karura')

    getAssetReserveChain(mockOrigin, mockAssetLocation)

    expect(getTChain).toHaveBeenCalledWith(2000, 'Kusama')
  })

  it('throws error when parachain not found', () => {
    mockJunctions({ Parachain: 9999 })
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
    vi.mocked(getTChain).mockReturnValue(null)

    expect(() => getAssetReserveChain(mockOrigin, mockAssetLocation)).toThrow(
      new RoutingResolutionError('Chain with paraId 9999 not found')
    )
  })

  it('returns AssetHubPolkadot when has GlobalConsensus junction', () => {
    mockJunctions({ GlobalConsensus: { polkadot: null } })
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')

    const result = getAssetReserveChain(mockOrigin, mockAssetLocation)

    expect(result).toBe('AssetHubPolkadot')
  })

  it('returns Ethereum when GlobalConsensus is Ethereum and resolveExternalReserve is true', () => {
    mockJunctions({ GlobalConsensus: { Ethereum: { chainId: 1n } } })
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')

    const result = getAssetReserveChain(mockOrigin, mockAssetLocation, true)

    expect(result).toBe('Ethereum')
  })

  it('returns EthereumTestnet when GlobalConsensus is Ethereum on Westend and resolveExternalReserve is true', () => {
    mockJunctions({ GlobalConsensus: { Ethereum: { chainId: 11155111n } } })
    vi.mocked(getRelayChainOf).mockReturnValue('Westend')

    const result = getAssetReserveChain(mockOrigin, mockAssetLocation, true)

    expect(result).toBe('EthereumTestnet')
  })

  it('returns AssetHubPolkadot when GlobalConsensus is Ethereum and resolveExternalReserve is false (default)', () => {
    mockJunctions({ GlobalConsensus: { Ethereum: { chainId: 1n } } })
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')

    const result = getAssetReserveChain(mockOrigin, mockAssetLocation)

    expect(result).toBe('AssetHubPolkadot')
  })

  it('returns AssetHubPolkadot for specific location pattern', () => {
    mockJunctions({})
    vi.mocked(deepEqual).mockReturnValue(true)
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')

    const result = getAssetReserveChain(mockOrigin, mockAssetLocation)

    expect(deepEqual).toHaveBeenCalledWith(mockAssetLocation, {
      parents: Parents.ONE,
      interior: { Here: null }
    })
    expect(result).toBe('AssetHubPolkadot')
  })

  it('returns origin when it is a relay chain', () => {
    const relayChain: TSubstrateChain = 'Polkadot'
    mockJunctions({})
    vi.mocked(deepEqual).mockReturnValue(false)
    vi.mocked(getRelayChainOf).mockReturnValue(relayChain)

    const result = getAssetReserveChain(relayChain, mockAssetLocation)

    expect(result).toBe(relayChain)
  })

  it('returns origin when no conditions match', () => {
    mockJunctions({})
    vi.mocked(deepEqual).mockReturnValue(false)

    const result = getAssetReserveChain(mockOrigin, mockAssetLocation)

    expect(result).toBe(mockOrigin)
  })
})

describe('getAssetReserveChainImpl', () => {
  const api = {
    _customCtx: {
      customChains: {
        MyChain: { name: 'MyChain', paraId: 4242, ecosystem: 'Polkadot' },
        MyClash: { name: 'MyClash', paraId: 2034, ecosystem: 'Polkadot' }
      }
    }
  } as unknown as PolkadotApi<unknown, unknown, unknown, 'MyChain' | 'MyClash'>
  const location: TLocation = { parents: 1, interior: { X1: [{ Parachain: 4242 }] } }

  beforeEach(async () => {
    const actual =
      await vi.importActual<typeof import('../../chains/getTChain')>('../../chains/getTChain')
    vi.mocked(getTChain).mockImplementation(actual.getTChain)
    mockJunctions({ Parachain: 4242 })
    vi.mocked(getRelayChainOfImpl).mockReturnValue('Polkadot')
  })

  it('resolves the reserve of a custom chain native asset via the api context', () => {
    expect(getAssetReserveChainImpl(api, 'MyChain', location)).toBe('MyChain')
  })

  it('does not resolve a custom chain registered in another ecosystem', () => {
    vi.mocked(getRelayChainOfImpl).mockReturnValue('Kusama')

    expect(() => getAssetReserveChainImpl(api, 'MyChain', location)).toThrow(
      new RoutingResolutionError('Chain with paraId 4242 not found')
    )
  })

  it('prefers the built-in chain when a custom chain reuses its paraId', () => {
    mockJunctions({ Parachain: 2034 })

    expect(getAssetReserveChainImpl(api, 'MyChain', location)).toBe('Hydration')
  })

  it('rejects an unknown paraId without a custom context', () => {
    const apiWithoutContext = {} as PolkadotApi<unknown, unknown, unknown>

    expect(() => getAssetReserveChainImpl(apiWithoutContext, 'Hydration', location)).toThrow(
      new RoutingResolutionError('Chain with paraId 4242 not found')
    )
  })
})
