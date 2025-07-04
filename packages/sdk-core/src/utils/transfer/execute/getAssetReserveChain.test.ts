import type { TMultiLocation, TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'
import { Parents } from '@paraspell/sdk-common'
import { deepEqual, getJunctionValue, hasJunction } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InvalidParameterError } from '../../../errors'
import { getTNode } from '../../../nodes/getTNode'
import { getRelayChainOf } from '../..'
import { getAssetReserveChain } from './getAssetReserveChain'

vi.mock('@paraspell/sdk-common', async () => {
  const actual = await vi.importActual('@paraspell/sdk-common')
  return {
    ...actual,
    hasJunction: vi.fn(),
    getJunctionValue: vi.fn(),
    deepEqual: vi.fn(),
    Parents: { ONE: 1 }
  }
})

vi.mock('../../../nodes/getTNode', () => ({
  getTNode: vi.fn()
}))

vi.mock('../..', () => ({
  getRelayChainOf: vi.fn()
}))

describe('getAssetReserveChain', () => {
  const mockOrigin = 'Acala' as TNodeDotKsmWithRelayChains
  const mockAssetLocation: TMultiLocation = {
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
    vi.mocked(getTNode).mockReturnValue('Moonbeam')

    const result = getAssetReserveChain(mockOrigin, mockAssetLocation)

    expect(getTNode).toHaveBeenCalledWith(1000, 'polkadot')
    expect(result).toBe('Moonbeam')
  })

  it('uses kusama when origin relay chain is Kusama', () => {
    vi.mocked(hasJunction).mockReturnValue(false)
    vi.mocked(getJunctionValue).mockReturnValue(2000)
    vi.mocked(getRelayChainOf).mockReturnValue('Kusama')
    vi.mocked(getTNode).mockReturnValue('Karura')

    getAssetReserveChain(mockOrigin, mockAssetLocation)

    expect(getTNode).toHaveBeenCalledWith(2000, 'kusama')
  })

  it('throws error when parachain not found', () => {
    vi.mocked(hasJunction).mockReturnValue(false)
    vi.mocked(getJunctionValue).mockReturnValue(9999)
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
    vi.mocked(getTNode).mockReturnValue(null)

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
    expect(result).toBe('Polkadot')
  })

  it('returns origin when no conditions match', () => {
    vi.mocked(hasJunction).mockReturnValue(false)
    vi.mocked(getJunctionValue).mockReturnValue(null)
    vi.mocked(deepEqual).mockReturnValue(false)

    const result = getAssetReserveChain(mockOrigin, mockAssetLocation)

    expect(result).toBe(mockOrigin)
  })
})
