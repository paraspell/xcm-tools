import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getNativeAssetSymbol } from '../../pallets/assets'
import { getMultiLocationTokenIdPjs } from './getMultiLocationTokenIdPjs'
import type { TNodeDotKsmWithRelayChains, TMultiLocation } from '../../types'
import { computeFeeFromDryRunPjs } from './computeFeeFromDryRunPjs'

vi.mock('../../pallets/assets', () => ({
  getNativeAssetSymbol: vi.fn()
}))

vi.mock('./getMultiLocationTokenIdPjs', () => ({
  getMultiLocationTokenIdPjs: vi.fn()
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
                  id: { parents: 1, interior: { X1: [{ Parachain: 1000 }] } } as TMultiLocation
                },
                {
                  fun: { Fungible: '300' },
                  id: {
                    parents: 1,
                    interior: { X2: [{ Parachain: 1000 }, { PalletInstance: 50 }] }
                  } as TMultiLocation
                }
              ]
            }
          }
        ]
      }
    }

    vi.mocked(getNativeAssetSymbol).mockReturnValue('nativeSymbol')
    vi.mocked(getMultiLocationTokenIdPjs).mockImplementation((id: TMultiLocation) =>
      Object.keys(id.interior)[0] === 'X1' ? 'nativeSymbol' : null
    )

    const executionFee = 200n
    const result = computeFeeFromDryRunPjs(dryRun, mockNode, executionFee)

    expect(result).toBe(700n) // 500 (delivery fee) + 200 (execution fee)
    expect(getNativeAssetSymbol).toHaveBeenCalledWith(mockNode)
    expect(getMultiLocationTokenIdPjs).toHaveBeenCalledTimes(2)
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
                  id: { parents: 1, interior: { X1: [{ Parachain: 1000 }] } } as TMultiLocation
                }
              ]
            }
          }
        ]
      }
    }

    vi.mocked(getNativeAssetSymbol).mockReturnValue('nativeSymbol')
    vi.mocked(getMultiLocationTokenIdPjs).mockReturnValue(null)

    const executionFee = 200n
    const result = computeFeeFromDryRunPjs(dryRun, mockNode, executionFee)

    expect(result).toBe(200n) // Only execution fee
    expect(getMultiLocationTokenIdPjs).toHaveBeenCalledWith(
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
                  id: { parents: 1, interior: { X1: [{ Parachain: 1000 }] } } as TMultiLocation
                },
                {
                  fun: { Fungible: '300' },
                  id: {
                    interior: { X2: [{ Parachain: 1000 }, { PalletInstance: 50 }] }
                  } as TMultiLocation
                }
              ]
            }
          }
        ]
      }
    }

    vi.mocked(getNativeAssetSymbol).mockReturnValue('nativeSymbol')
    vi.mocked(getMultiLocationTokenIdPjs).mockImplementation((id: TMultiLocation) =>
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
    expect(getMultiLocationTokenIdPjs).not.toHaveBeenCalled()
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
