import type { TLocation, TSubstrateChain } from '@paraspell/sdk-common'
import { Parents } from '@paraspell/sdk-common'
import { deepEqual, getJunctionValue, hasJunction } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getRelayChainOf, getTChain } from '../..'
import { InvalidParameterError } from '../../errors'
import { getAssetReserveChain } from './getAssetReserveChain'

vi.mock('@paraspell/sdk-common', async importActual => ({
  ...(await importActual()),
  hasJunction: vi.fn(),
  getJunctionValue: vi.fn(),
  deepEqual: vi.fn(),
  Parents: { ONE: 1 }
}))

vi.mock('../..')

describe('getAssetReserveChain', () => {
  const mockOrigin: TSubstrateChain = 'Acala'
  const mockAssetLocation: TLocation = {
    parents: 1,
    interior: { X1: { Parachain: 1000 } }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns parachain when paraId is found', () => {
    vi.mocked(hasJunction).mockReturnValue(false)
    vi.mocked(getJunctionValue).mockReturnValue(1000)
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
    vi.mocked(getTChain).mockReturnValue('Moonbeam')

    const result = getAssetReserveChain(mockOrigin, mockAssetLocation)

    expect(getTChain).toHaveBeenCalledWith(1000, 'Polkadot')
    expect(result).toBe('Moonbeam')
  })

  it('uses kusama when origin relay chain is Kusama', () => {
    vi.mocked(hasJunction).mockReturnValue(false)
    vi.mocked(getJunctionValue).mockReturnValue(2000)
    vi.mocked(getRelayChainOf).mockReturnValue('Kusama')
    vi.mocked(getTChain).mockReturnValue('Karura')

    getAssetReserveChain(mockOrigin, mockAssetLocation)

    expect(getTChain).toHaveBeenCalledWith(2000, 'Kusama')
  })

  it('throws error when parachain not found', () => {
    vi.mocked(hasJunction).mockReturnValue(false)
    vi.mocked(getJunctionValue).mockReturnValue(9999)
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
    vi.mocked(getTChain).mockReturnValue(null)

    expect(() => getAssetReserveChain(mockOrigin, mockAssetLocation)).toThrow(
      new InvalidParameterError('Chain with paraId 9999 not found')
    )
  })

  it('returns AssetHubPolkadot when has GlobalConsensus junction', () => {
    vi.mocked(hasJunction).mockReturnValue(true)
    vi.mocked(getJunctionValue).mockReturnValue(null)

    const result = getAssetReserveChain(mockOrigin, mockAssetLocation)

    expect(result).toBe('AssetHubPolkadot')
  })

  it('returns AssetHubPolkadot for specific location pattern', () => {
    vi.mocked(hasJunction).mockReturnValue(false)
    vi.mocked(getJunctionValue).mockReturnValue(null)
    vi.mocked(deepEqual).mockReturnValue(true)

    const result = getAssetReserveChain(mockOrigin, mockAssetLocation)

    expect(deepEqual).toHaveBeenCalledWith(mockAssetLocation, {
      parents: Parents.ONE,
      interior: { Here: null }
    })
    expect(result).toBe('AssetHubPolkadot')
  })

  it('returns origin when it is a relay chain', () => {
    const relayChain: TSubstrateChain = 'Polkadot'
    vi.mocked(hasJunction).mockReturnValue(false)
    vi.mocked(getJunctionValue).mockReturnValue(null)
    vi.mocked(deepEqual).mockReturnValue(false)
    vi.mocked(getRelayChainOf).mockReturnValue(relayChain)

    const result = getAssetReserveChain(relayChain, mockAssetLocation)

    expect(result).toBe(relayChain)
  })

  it('returns origin when no conditions match', () => {
    vi.mocked(hasJunction).mockReturnValue(false)
    vi.mocked(getJunctionValue).mockReturnValue(null)
    vi.mocked(deepEqual).mockReturnValue(false)

    const result = getAssetReserveChain(mockOrigin, mockAssetLocation)

    expect(result).toBe(mockOrigin)
  })
})
