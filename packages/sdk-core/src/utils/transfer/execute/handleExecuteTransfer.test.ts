import type { TAsset } from '@paraspell/assets'
import { isAssetEqual } from '@paraspell/assets'
import { type TLocation, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../../api'
import { MAX_WEIGHT } from '../../../constants'
import { getTNode } from '../../../nodes/getTNode'
import { getAssetBalanceInternal } from '../../../pallets/assets'
import { dryRunInternal } from '../../../transfer/dryRun/dryRunInternal'
import { padFeeBy } from '../../../transfer/fees/padFee'
import type { TDryRunResult, TPolkadotXCMTransferOptions, TSerializedApiCall } from '../../../types'
import { assertAddressIsString, getRelayChainOf } from '../..'
import { createExecuteCall } from './createExecuteCall'
import { createDirectExecuteXcm } from './createExecuteXcm'
import { handleExecuteTransfer } from './handleExecuteTransfer'

vi.mock('../../validateAddress', () => ({
  validateAddress: vi.fn()
}))

vi.mock('./createExecuteXcm', () => ({
  createDirectExecuteXcm: vi.fn()
}))

vi.mock('./createExecuteCall', () => ({
  createExecuteCall: vi.fn()
}))

vi.mock('../../../nodes/getTNode', () => ({
  getTNode: vi.fn()
}))

vi.mock('../../../pallets/assets', () => ({
  getAssetBalanceInternal: vi.fn()
}))

vi.mock('../../../transfer/dryRun/dryRunInternal', () => ({
  dryRunInternal: vi.fn()
}))

vi.mock('../../../transfer/fees/padFee', () => ({
  padFeeBy: vi.fn()
}))

vi.mock('../..', () => ({
  assertAddressIsString: vi.fn(),
  getRelayChainOf: vi.fn()
}))

vi.mock('@paraspell/assets', () => ({
  isAssetEqual: vi.fn()
}))

describe('handleExecuteTransfer', () => {
  const mockApi = {
    callTxMethod: vi.fn(),
    getXcmWeight: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>

  const mockXcm = { [Version.V4]: {} } as ReturnType<typeof createDirectExecuteXcm>

  const mockInput = {
    api: mockApi,
    assetInfo: { symbol: 'DOT', amount: 1000n, isNative: true },
    asset: {} as TAsset,
    scenario: 'ParaToRelay',
    destLocation: {} as TLocation,
    beneficiaryLocation: {} as TLocation,
    paraIdTo: 1001,
    address: 'address',
    destination: 'Polkadot',
    senderAddress: '0x1234567890abcdef',
    currency: { symbol: 'DOT' },
    version: Version.V4
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  const mockChain = 'AssetHubPolkadot'
  const mockDestChain = 'Hydration'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(assertAddressIsString).mockImplementation(() => {})
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
    vi.mocked(getTNode).mockReturnValue(mockDestChain)
    vi.mocked(padFeeBy).mockImplementation(
      (fee, percentage) => fee + (fee * BigInt(percentage)) / 100n
    )
    vi.mocked(isAssetEqual).mockReturnValue(true)
  })

  it('should throw error when senderAddress is not provided', async () => {
    const input = { ...mockInput, senderAddress: undefined }
    await expect(handleExecuteTransfer(mockChain, input)).rejects.toThrow(
      'Please provide senderAddress'
    )
  })

  it('should throw error when amount is smaller than MIN_FEE', async () => {
    const input = {
      ...mockInput,
      senderAddress: '0xvalid',
      assetInfo: { ...mockInput.assetInfo, amount: 999n }
    }
    await expect(handleExecuteTransfer(mockChain, input)).rejects.toThrow(
      'Asset amount is too low, please increase the amount or use a different fee asset.'
    )
  })

  it('should throw error when amount is smaller than calculated fee (same asset)', async () => {
    const input = {
      ...mockInput,
      senderAddress: '0xvalid',
      assetInfo: { ...mockInput.assetInfo, amount: 1500n }
    }

    vi.mocked(createDirectExecuteXcm).mockReturnValue(mockXcm)
    vi.mocked(createExecuteCall).mockReturnValue('mockCall' as unknown as TSerializedApiCall)
    vi.spyOn(mockApi, 'callTxMethod').mockReturnValue('mockTx')

    const dryRunResult = {
      origin: { success: true, fee: 1000n },
      hops: [{ chain: 'IntermediateChain', result: { success: true, fee: 1000n } }]
    } as unknown as TDryRunResult
    vi.mocked(dryRunInternal).mockResolvedValue(dryRunResult)

    // origin fee: 1000, padded by 40% = 1400
    // reserve fee: 1000, padded by 40% = 1400
    // total = 2800

    await expect(handleExecuteTransfer(mockChain, input)).rejects.toThrow(
      'Asset amount is too low, please increase the amount or use a different fee asset.'
    )
  })

  it('should throw error when amount is smaller than calculated fee (different fee asset)', async () => {
    const input = {
      ...mockInput,
      senderAddress: '0xvalid',
      assetInfo: { ...mockInput.assetInfo, amount: 1200n },
      feeAssetInfo: { symbol: 'USDT' },
      feeCurrency: { symbol: 'USDT' }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    vi.mocked(isAssetEqual).mockReturnValue(false)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(BigInt(5000))

    vi.mocked(createDirectExecuteXcm).mockReturnValue(mockXcm)
    vi.mocked(createExecuteCall).mockReturnValue('mockCall' as unknown as TSerializedApiCall)
    vi.spyOn(mockApi, 'callTxMethod').mockReturnValue('mockTx')

    const dryRunResult = {
      origin: { success: true, fee: 1000n },
      hops: [{ chain: 'IntermediateChain', result: { success: true, fee: 1000n } }]
    } as unknown as TDryRunResult
    vi.mocked(dryRunInternal).mockResolvedValue(dryRunResult)

    await expect(handleExecuteTransfer(mockChain, input)).rejects.toThrow(
      'Asset amount is too low, please increase the amount or use a different fee asset.'
    )
  })

  it('should throw error if origin dry run fails', async () => {
    const input = {
      ...mockInput,
      senderAddress: '0xvalid',
      assetInfo: { ...mockInput.assetInfo, amount: 10000n }
    }

    vi.mocked(createDirectExecuteXcm).mockReturnValue(mockXcm)
    vi.mocked(createExecuteCall).mockReturnValue('mockCall' as unknown as TSerializedApiCall)
    vi.spyOn(mockApi, 'callTxMethod').mockReturnValue('mockTx')

    const dryRunResult = {
      origin: { success: false, fee: 0n },
      failureReason: 'Origin execution failed'
    } as unknown as TDryRunResult
    vi.mocked(dryRunInternal).mockResolvedValue(dryRunResult)

    await expect(handleExecuteTransfer(mockChain, input)).rejects.toThrow('Origin execution failed')
  })

  it('should throw error if hop dry run fails', async () => {
    const input = {
      ...mockInput,
      senderAddress: '0xvalid',
      assetInfo: { ...mockInput.assetInfo, amount: 10000n }
    }

    vi.mocked(createDirectExecuteXcm).mockReturnValue(mockXcm)
    vi.mocked(createExecuteCall).mockReturnValue('mockCall' as unknown as TSerializedApiCall)
    vi.spyOn(mockApi, 'callTxMethod').mockReturnValue('mockTx')

    const dryRunResult = {
      origin: { success: true, fee: 1000n },
      hops: [
        {
          chain: 'IntermediateChain',
          result: { success: false, fee: 0n, failureReason: 'Hop execution failed' }
        }
      ]
    } as unknown as TDryRunResult
    vi.mocked(dryRunInternal).mockResolvedValue(dryRunResult)

    await expect(handleExecuteTransfer(mockChain, input)).rejects.toThrow(
      'Dry run failed on an intermediate hop (IntermediateChain). Reason: Hop execution failed'
    )
  })

  it('should successfully create and return executeXcm transaction with hop', async () => {
    const input = {
      ...mockInput,
      senderAddress: '0xvalid',
      assetInfo: { ...mockInput.assetInfo, amount: 10000n }
    }

    vi.mocked(createDirectExecuteXcm).mockReturnValue(mockXcm)
    vi.mocked(createExecuteCall).mockReturnValue('finalTx' as unknown as TSerializedApiCall)
    vi.spyOn(mockApi, 'callTxMethod').mockReturnValue('mockTx')
    const getXcmWeightSpy = vi
      .spyOn(mockApi, 'getXcmWeight')
      .mockResolvedValue({ proofSize: 0n, refTime: 12000n })

    const dryRunResult = {
      origin: { success: true, fee: 1000n },
      hops: [{ chain: 'IntermediateChain', result: { success: true, fee: 2000n } }]
    } as unknown as TDryRunResult
    vi.mocked(dryRunInternal).mockResolvedValue(dryRunResult)

    const result = await handleExecuteTransfer(mockChain, input)

    expect(result).toBe('finalTx')
    expect(createDirectExecuteXcm).toHaveBeenCalledTimes(2)

    expect(createDirectExecuteXcm).toHaveBeenNthCalledWith(1, {
      api: mockApi,
      chain: mockChain,
      destChain: mockDestChain,
      address: 'address',
      assetInfo: input.assetInfo,
      currency: input.currency,
      feeAssetInfo: undefined,
      feeCurrency: undefined,
      recipientAddress: 'address',
      senderAddress: '0xvalid',
      version: Version.V4,
      fees: {
        originFee: 1000n,
        reserveFee: 1000n
      },
      paraIdTo: mockInput.paraIdTo
    })

    expect(createDirectExecuteXcm).toHaveBeenNthCalledWith(2, {
      api: mockApi,
      chain: mockChain,
      destChain: mockDestChain,
      address: 'address',
      assetInfo: input.assetInfo,
      currency: input.currency,
      feeAssetInfo: undefined,
      feeCurrency: undefined,
      recipientAddress: 'address',
      senderAddress: '0xvalid',
      version: Version.V4,
      fees: {
        originFee: 1400n, // 1000 padded by 40%
        reserveFee: 2800n // 2000 padded by 40%
      },
      paraIdTo: mockInput.paraIdTo
    })

    expect(getXcmWeightSpy).toHaveBeenCalledWith(mockXcm)
    expect(createExecuteCall).toHaveBeenCalledTimes(2)
    expect(createExecuteCall).toHaveBeenNthCalledWith(1, mockChain, mockXcm, MAX_WEIGHT)
    expect(createExecuteCall).toHaveBeenNthCalledWith(2, mockChain, mockXcm, {
      proofSize: 0n,
      refTime: 12000n
    })
  })

  it('should use MIN_FEE for reserveFee when no hops', async () => {
    const input = {
      ...mockInput,
      senderAddress: '0xvalid',
      assetInfo: { ...mockInput.assetInfo, amount: 10000n }
    }

    vi.mocked(createDirectExecuteXcm).mockReturnValue(mockXcm)
    vi.mocked(createExecuteCall).mockReturnValue('finalTx' as unknown as TSerializedApiCall)
    vi.spyOn(mockApi, 'callTxMethod').mockReturnValue('mockTx')
    vi.spyOn(mockApi, 'getXcmWeight').mockResolvedValue({ proofSize: 0n, refTime: 15000n })

    const dryRunResult = {
      origin: { success: true, fee: 1500n },
      hops: []
    } as unknown as TDryRunResult
    vi.mocked(dryRunInternal).mockResolvedValue(dryRunResult)

    const result = await handleExecuteTransfer(mockChain, input)

    expect(result).toBe('finalTx')
    expect(createDirectExecuteXcm).toHaveBeenCalledTimes(2)

    expect(createDirectExecuteXcm).toHaveBeenNthCalledWith(2, {
      api: mockApi,
      chain: mockChain,
      destChain: mockDestChain,
      address: 'address',
      assetInfo: input.assetInfo,
      currency: input.currency,
      feeAssetInfo: undefined,
      feeCurrency: undefined,
      recipientAddress: 'address',
      senderAddress: '0xvalid',
      version: Version.V4,
      fees: {
        originFee: 2100n,
        reserveFee: 1400n
      },
      paraIdTo: mockInput.paraIdTo
    })
  })

  it('should fetch fee asset balance when fee asset is different', async () => {
    const input = {
      ...mockInput,
      senderAddress: '0xvalid',
      assetInfo: { ...mockInput.assetInfo, amount: 10000n },
      feeAssetInfo: { symbol: 'USDT' },
      feeCurrency: { symbol: 'USDT' }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    vi.mocked(isAssetEqual).mockReturnValue(false)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(BigInt(5000))

    vi.mocked(createDirectExecuteXcm).mockReturnValue(mockXcm)
    vi.mocked(createExecuteCall).mockReturnValue('finalTx' as unknown as TSerializedApiCall)
    vi.spyOn(mockApi, 'callTxMethod').mockReturnValue('mockTx')
    vi.spyOn(mockApi, 'getXcmWeight').mockResolvedValue({ proofSize: 0n, refTime: 15000n })

    const dryRunResult = {
      origin: { success: true, fee: 1000n },
      hops: [{ chain: 'IntermediateChain', result: { success: true, fee: 2000n } }]
    } as unknown as TDryRunResult
    vi.mocked(dryRunInternal).mockResolvedValue(dryRunResult)

    const result = await handleExecuteTransfer(mockChain, input)

    expect(result).toBe('finalTx')
    expect(getAssetBalanceInternal).toHaveBeenCalledWith({
      api: mockApi,
      address: '0xvalid',
      node: mockChain,
      currency: { symbol: 'USDT' }
    })

    expect(createDirectExecuteXcm).toHaveBeenNthCalledWith(1, {
      api: mockApi,
      chain: mockChain,
      destChain: mockDestChain,
      address: 'address',
      assetInfo: input.assetInfo,
      currency: input.currency,
      feeAssetInfo: { symbol: 'USDT' },
      feeCurrency: { symbol: 'USDT' },
      recipientAddress: 'address',
      senderAddress: '0xvalid',
      version: Version.V4,
      fees: {
        originFee: 5000n,
        reserveFee: 1000n
      },
      paraIdTo: mockInput.paraIdTo
    })
  })

  it('should use MIN_FEE for originFee when fee asset balance is 1n or less', async () => {
    const input = {
      ...mockInput,
      senderAddress: '0xvalid',
      assetInfo: { ...mockInput.assetInfo, amount: 10000n },
      feeAssetInfo: { symbol: 'USDT' },
      feeCurrency: { symbol: 'USDT' }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    vi.mocked(isAssetEqual).mockReturnValue(false)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(BigInt(1))

    vi.mocked(createDirectExecuteXcm).mockReturnValue(mockXcm)
    vi.mocked(createExecuteCall).mockReturnValue('finalTx' as unknown as TSerializedApiCall)
    vi.spyOn(mockApi, 'callTxMethod').mockReturnValue('mockTx')
    vi.spyOn(mockApi, 'getXcmWeight').mockResolvedValue({ proofSize: 0n, refTime: 15000n })

    const dryRunResult = {
      origin: { success: true, fee: 1000n },
      hops: []
    } as unknown as TDryRunResult
    vi.mocked(dryRunInternal).mockResolvedValue(dryRunResult)

    await handleExecuteTransfer(mockChain, input)

    expect(createDirectExecuteXcm).toHaveBeenNthCalledWith(1, {
      api: mockApi,
      chain: mockChain,
      destChain: mockDestChain,
      address: 'address',
      assetInfo: input.assetInfo,
      currency: input.currency,
      feeAssetInfo: { symbol: 'USDT' },
      feeCurrency: { symbol: 'USDT' },
      recipientAddress: 'address',
      senderAddress: '0xvalid',
      version: Version.V4,
      fees: {
        originFee: 1000n,
        reserveFee: 1000n
      },
      paraIdTo: mockInput.paraIdTo
    })
  })
})
