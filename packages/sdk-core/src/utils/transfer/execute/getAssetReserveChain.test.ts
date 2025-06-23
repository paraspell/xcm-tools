import type { TMultiLocation, TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'
import { Parents } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InvalidParameterError } from '../../../errors'

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
  determineRelayChain: vi.fn()
}))

import { deepEqual, getJunctionValue, hasJunction } from '@paraspell/sdk-common'

import { getTNode } from '../../../nodes/getTNode'
import { determineRelayChain } from '../..'
import { getAssetReserveChain } from './getAssetReserveChain'

const mockHasJunction = vi.mocked(hasJunction)
const mockGetJunctionValue = vi.mocked(getJunctionValue)
const mockDeepEqual = vi.mocked(deepEqual)
const mockGetTNode = vi.mocked(getTNode)
const mockDetermineRelayChain = vi.mocked(determineRelayChain)

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
    mockHasJunction.mockReturnValue(false)
    mockGetJunctionValue.mockReturnValue(1000)
    mockDetermineRelayChain.mockReturnValue('Polkadot')
    mockGetTNode.mockReturnValue('Moonbeam')

    const result = getAssetReserveChain(mockOrigin, mockAssetLocation)

    expect(mockGetTNode).toHaveBeenCalledWith(1000, 'polkadot')
    expect(result).toBe('Moonbeam')
  })

  it('uses kusama when origin relay chain is Kusama', () => {
    mockHasJunction.mockReturnValue(false)
    mockGetJunctionValue.mockReturnValue(2000)
    mockDetermineRelayChain.mockReturnValue('Kusama')
    mockGetTNode.mockReturnValue('Karura')

    getAssetReserveChain(mockOrigin, mockAssetLocation)

    expect(mockGetTNode).toHaveBeenCalledWith(2000, 'kusama')
  })

  it('throws error when parachain not found', () => {
    mockHasJunction.mockReturnValue(false)
    mockGetJunctionValue.mockReturnValue(9999)
    mockDetermineRelayChain.mockReturnValue('Polkadot')
    mockGetTNode.mockReturnValue(null)

    expect(() => getAssetReserveChain(mockOrigin, mockAssetLocation)).toThrow(
      new InvalidParameterError('Chain with paraId 9999 not found')
    )
  })

  it('returns AssetHubPolkadot when has GlobalConsensus junction', () => {
    mockHasJunction.mockReturnValue(true)
    mockGetJunctionValue.mockReturnValue(null)

    const result = getAssetReserveChain(mockOrigin, mockAssetLocation)

    expect(result).toBe('AssetHubPolkadot')
  })

  it('returns AssetHubPolkadot for specific location pattern', () => {
    mockHasJunction.mockReturnValue(false)
    mockGetJunctionValue.mockReturnValue(null)
    mockDeepEqual.mockReturnValue(true)

    const result = getAssetReserveChain(mockOrigin, mockAssetLocation)

    expect(mockDeepEqual).toHaveBeenCalledWith(mockAssetLocation, {
      parents: Parents.ONE,
      interior: { Here: null }
    })
    expect(result).toBe('Polkadot')
  })

  it('returns origin when no conditions match', () => {
    mockHasJunction.mockReturnValue(false)
    mockGetJunctionValue.mockReturnValue(null)
    mockDeepEqual.mockReturnValue(false)

    const result = getAssetReserveChain(mockOrigin, mockAssetLocation)

    expect(result).toBe(mockOrigin)
  })
})
