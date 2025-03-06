import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getNativeAssetSymbol } from '../../pallets/assets'
import type { TNodeDotKsmWithRelayChains } from '../../types'
import { computeFeeFromDryRun } from './computeFeeFromDryRun'
import { getMultiLocationTokenId } from './getMultiLocationTokenId'

vi.mock('../../pallets/assets', () => ({
  getNativeAssetSymbol: vi.fn()
}))

vi.mock('./getMultiLocationTokenId', () => ({
  getMultiLocationTokenId: vi.fn()
}))

describe('computeFeeFromDryRun', () => {
  const mockNode: TNodeDotKsmWithRelayChains = {} as TNodeDotKsmWithRelayChains

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should compute the total fee from delivery fees and execution fee', () => {
    const dryRun = {
      value: {
        emitted_events: [
          {
            type: 'XcmPallet',
            value: {
              type: 'FeesPaid',
              value: {
                fees: [
                  { fun: { type: 'Fungible', value: 500n }, id: 'tokenId1' },
                  { fun: { type: 'Fungible', value: 300n }, id: 'tokenId2' }
                ]
              }
            }
          }
        ]
      }
    }

    vi.mocked(getNativeAssetSymbol).mockReturnValue('nativeSymbol')
    vi.mocked(getMultiLocationTokenId).mockImplementation((id: string) =>
      id === 'tokenId1' ? 'nativeSymbol' : null
    )

    const executionFee = 200n
    const result = computeFeeFromDryRun(dryRun, mockNode, executionFee)

    expect(result).toBe(700n) // 500 (delivery fee) + 200 (execution fee)
    expect(getNativeAssetSymbol).toHaveBeenCalledWith(mockNode)
    expect(getMultiLocationTokenId).toHaveBeenCalledTimes(2)
  })

  it('should return only the execution fee if there are no matching delivery fees', () => {
    const dryRun = {
      value: {
        emitted_events: [
          {
            type: 'PolkadotXcm',
            value: {
              type: 'FeesPaid',
              value: {
                fees: [{ fun: { type: 'Fungible', value: 500n }, id: 'tokenId1' }]
              }
            }
          }
        ]
      }
    }

    vi.mocked(getNativeAssetSymbol).mockReturnValue('nativeSymbol')
    vi.mocked(getMultiLocationTokenId).mockReturnValue(null)

    const executionFee = 200n
    const result = computeFeeFromDryRun(dryRun, mockNode, executionFee)

    expect(result).toBe(200n) // Only execution fee
    expect(getMultiLocationTokenId).toHaveBeenCalledWith('tokenId1', mockNode)
  })

  it('should exclude NonFungible fees from the total delivery fee', () => {
    const dryRun = {
      value: {
        emitted_events: [
          {
            type: 'CumulusXcm',
            value: {
              type: 'FeesPaid',
              value: {
                fees: [
                  { fun: { type: 'NonFungible', value: 500n }, id: 'tokenId1' },
                  { fun: { type: 'Fungible', value: 300n }, id: 'tokenId2' }
                ]
              }
            }
          }
        ]
      }
    }

    vi.mocked(getNativeAssetSymbol).mockReturnValue('nativeSymbol')
    vi.mocked(getMultiLocationTokenId).mockImplementation((id: string) =>
      id === 'tokenId2' ? 'nativeSymbol' : null
    )

    const executionFee = 200n
    const result = computeFeeFromDryRun(dryRun, mockNode, executionFee)

    expect(result).toBe(500n) // 300 (delivery fee) + 200 (execution fee)
  })

  it('should return 0 if no matching events are found', () => {
    const dryRun = {
      value: {
        emitted_events: [
          {
            type: 'OtherEvent',
            value: { type: 'SomethingElse', value: {} }
          }
        ]
      }
    }

    vi.mocked(getNativeAssetSymbol).mockReturnValue('nativeSymbol')

    const executionFee = 0n
    const result = computeFeeFromDryRun(dryRun, mockNode, executionFee)

    expect(result).toBe(0n)
    expect(getNativeAssetSymbol).toHaveBeenCalledWith(mockNode)
    expect(getMultiLocationTokenId).not.toHaveBeenCalled()
  })

  it('should return only execution fee if no delivery fees are found', () => {
    const dryRun = {
      value: {
        emitted_events: []
      }
    }

    vi.mocked(getNativeAssetSymbol).mockReturnValue('nativeSymbol')

    const executionFee = 300n
    const result = computeFeeFromDryRun(dryRun, mockNode, executionFee)

    expect(result).toBe(300n) // Only execution fee
  })
})
