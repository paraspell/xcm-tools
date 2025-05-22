import { getNativeAssetSymbol } from '@paraspell/assets'
import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { computeFeeFromDryRun } from './computeFeeFromDryRun'
import { getMultiLocationTokenId } from './getMultiLocationTokenId'

vi.mock('@paraspell/assets', () => ({
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

    expect(result).toBe(300n)
  })

  it('should return assetConversionFee if isFeeAsset is true and assetConversionFee is > 0, skipping final delivery fee calculation', () => {
    const dryRun = {
      value: {
        emitted_events: [
          {
            type: 'AssetConversion',
            value: {
              type: 'SwapCreditExecuted',
              value: {
                amount_in: 1000n,
                amount_out: 900n,
                asset_in: 'assetA',
                asset_out: 'assetB',
                who: 'someAccount'
              }
            }
          },
          {
            type: 'XcmPallet',
            value: {
              type: 'FeesPaid',
              value: {
                fees: [{ fun: { type: 'Fungible', value: 50n }, id: 'tokenId1' }]
              }
            }
          }
        ]
      }
    }

    const executionFee = 200n
    const isFeeAsset = true

    vi.mocked(getMultiLocationTokenId).mockReturnValue('someRelevantSymbolOrNull')

    const result = computeFeeFromDryRun(dryRun, mockNode, executionFee, isFeeAsset)

    expect(result).toBe(1000n)

    expect(getNativeAssetSymbol).not.toHaveBeenCalled()
    expect(getMultiLocationTokenId).toHaveBeenCalledWith('tokenId1', mockNode)
  })

  it('should sum multiple AssetConversion fees if isFeeAsset is true', () => {
    const dryRun = {
      value: {
        emitted_events: [
          {
            type: 'AssetConversion',
            value: {
              type: 'SwapCreditExecuted',
              value: { amount_in: 1000n }
            }
          },
          {
            type: 'AssetConversion',
            value: {
              type: 'SwapCreditExecuted',
              value: { amount_in: 500n }
            }
          },
          {
            type: 'AssetConversion',
            value: {
              type: 'SwapCreditExecuted',
              value: { amount_in: undefined }
            }
          },
          {
            type: 'AssetConversion',
            value: {
              type: 'SwapCreditExecuted',
              value: { amount_in: null }
            }
          }
        ]
      }
    }

    const executionFee = 200n
    const isFeeAsset = true

    const result = computeFeeFromDryRun(dryRun, mockNode, executionFee, isFeeAsset)

    expect(result).toBe(1500n)
    expect(getNativeAssetSymbol).not.toHaveBeenCalled()
    expect(getMultiLocationTokenId).not.toHaveBeenCalled()
  })

  it('should use delivery and execution fees if isFeeAsset is true but no valid AssetConversion fee is found', () => {
    const dryRun = {
      value: {
        emitted_events: [
          {
            type: 'AssetConversion',
            value: {
              type: 'SomeOtherAssetConversionEvent',
              value: {
                amount_in: 1000n
              }
            }
          },
          {
            type: 'AssetConversion',
            value: {
              type: 'SwapCreditExecuted',
              value: {
                amount_out: 900n
              }
            }
          },
          {
            type: 'XcmPallet',
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
    vi.mocked(getMultiLocationTokenId).mockImplementation((id: string) =>
      id === 'tokenId1' ? 'nativeSymbol' : null
    )

    const executionFee = 200n
    const isFeeAsset = true

    const result = computeFeeFromDryRun(dryRun, mockNode, executionFee, isFeeAsset)

    expect(result).toBe(700n)
    expect(getNativeAssetSymbol).toHaveBeenCalledWith(mockNode)
    expect(getMultiLocationTokenId).toHaveBeenCalledWith('tokenId1', mockNode)
  })

  it('should ignore AssetConversion events and use delivery/execution fees if isFeeAsset is false', () => {
    const dryRun = {
      value: {
        emitted_events: [
          {
            type: 'AssetConversion',
            value: {
              type: 'SwapCreditExecuted',
              value: {
                amount_in: 1000n,
                amount_out: 900n
              }
            }
          },
          {
            type: 'XcmPallet',
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
    vi.mocked(getMultiLocationTokenId).mockImplementation((id: string) =>
      id === 'tokenId1' ? 'nativeSymbol' : null
    )

    const executionFee = 200n
    const isFeeAsset = false

    const result = computeFeeFromDryRun(dryRun, mockNode, executionFee, isFeeAsset)

    expect(result).toBe(700n)
    expect(getNativeAssetSymbol).toHaveBeenCalledWith(mockNode)
    expect(getMultiLocationTokenId).toHaveBeenCalledWith('tokenId1', mockNode)
  })
})
