import { getNativeAssetSymbol } from '@paraspell/assets'
import type { TLocation, TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { computeFeeFromDryRunPjs } from './computeFeeFromDryRunPjs'
import { getLocationTokenIdPjs } from './getLocationTokenIdPjs'

vi.mock('@paraspell/assets', () => ({
  getNativeAssetSymbol: vi.fn()
}))

vi.mock('./getLocationTokenIdPjs', () => ({
  getLocationTokenIdPjs: vi.fn()
}))

describe('computeFeeFromDryRunPjs', () => {
  const mockNode: TNodeDotKsmWithRelayChains = {} as TNodeDotKsmWithRelayChains

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should compute the total fee from delivery fees and execution fee', () => {
    const dryRun = {
      Ok: {
        emittedEvents: [
          {
            section: 'xcmPallet',
            method: 'FeesPaid',
            data: {
              fees: [
                {
                  fun: { Fungible: '500' },
                  id: { parents: 1, interior: { X1: [{ Parachain: 1000 }] } }
                },
                {
                  fun: { Fungible: '300' },
                  id: {
                    parents: 1,
                    interior: { X2: [{ Parachain: 1000 }, { PalletInstance: 50 }] }
                  }
                }
              ]
            }
          }
        ]
      }
    }

    vi.mocked(getNativeAssetSymbol).mockReturnValue('nativeSymbol')
    vi.mocked(getLocationTokenIdPjs).mockImplementation((id: TLocation) =>
      Object.keys(id.interior)[0] === 'X1' ? 'nativeSymbol' : null
    )

    const executionFee = 200n
    const result = computeFeeFromDryRunPjs(dryRun, mockNode, executionFee)

    expect(result).toBe(700n) // 500 (delivery fee) + 200 (execution fee)
    expect(getNativeAssetSymbol).toHaveBeenCalledWith(mockNode)
    expect(getLocationTokenIdPjs).toHaveBeenCalledTimes(2)
  })

  it('should return only the execution fee if there are no matching delivery fees', () => {
    const dryRun = {
      Ok: {
        emittedEvents: [
          {
            section: 'polkadotXcm',
            method: 'FeesPaid',
            data: {
              fees: [
                {
                  fun: { Fungible: '500' },
                  id: { parents: 1, interior: { X1: [{ Parachain: 1000 }] } }
                }
              ]
            }
          }
        ]
      }
    }

    vi.mocked(getNativeAssetSymbol).mockReturnValue('nativeSymbol')
    vi.mocked(getLocationTokenIdPjs).mockReturnValue(null)

    const executionFee = 200n
    const result = computeFeeFromDryRunPjs(dryRun, mockNode, executionFee)

    expect(result).toBe(200n) // Only execution fee
    expect(getLocationTokenIdPjs).toHaveBeenCalledWith(
      { parents: 1, interior: { X1: [{ Parachain: 1000 }] } },
      mockNode
    )
  })

  it('should exclude NonFungible fees from the total delivery fee', () => {
    const dryRun = {
      Ok: {
        emittedEvents: [
          {
            section: 'cumulusXcm',
            method: 'FeesPaid',
            data: {
              fees: [
                {
                  fun: { NonFungible: true },
                  id: { parents: 1, interior: { X1: [{ Parachain: 1000 }] } }
                },
                {
                  fun: { Fungible: '300' },
                  id: {
                    interior: { X2: [{ Parachain: 1000 }, { PalletInstance: 50 }] }
                  }
                }
              ]
            }
          }
        ]
      }
    }

    vi.mocked(getNativeAssetSymbol).mockReturnValue('nativeSymbol')
    vi.mocked(getLocationTokenIdPjs).mockImplementation((id: TLocation) =>
      Object.keys(id.interior)[0] === 'X2' ? 'nativeSymbol' : null
    )

    const executionFee = 200n
    const result = computeFeeFromDryRunPjs(dryRun, mockNode, executionFee)

    expect(result).toBe(500n) // 300 (delivery fee) + 200 (execution fee)
  })

  it('should return 0 if no matching events are found', () => {
    const dryRun = {
      Ok: {
        emittedEvents: [
          {
            section: 'otherEvent',
            method: 'OtherMethod',
            data: {}
          }
        ]
      }
    }

    vi.mocked(getNativeAssetSymbol).mockReturnValue('nativeSymbol')

    const executionFee = 0n
    const result = computeFeeFromDryRunPjs(dryRun, mockNode, executionFee)

    expect(result).toBe(0n)
    expect(getNativeAssetSymbol).toHaveBeenCalledWith(mockNode)
    expect(getLocationTokenIdPjs).not.toHaveBeenCalled()
  })

  it('should return only execution fee if no delivery fees are found', () => {
    const dryRun = {
      Ok: {
        emittedEvents: []
      }
    }

    vi.mocked(getNativeAssetSymbol).mockReturnValue('nativeSymbol')

    const executionFee = 300n
    const result = computeFeeFromDryRunPjs(dryRun, mockNode, executionFee)

    expect(result).toBe(300n) // Only execution fee
  })
})
