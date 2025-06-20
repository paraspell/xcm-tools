import type { TMultiAsset } from '@paraspell/assets'
import { isAssetEqual } from '@paraspell/assets'
import { type TMultiLocation, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { MAX_WEIGHT } from '../../constants'
import { getTNode } from '../../nodes/getTNode'
import { getAssetBalanceInternal } from '../../pallets/assets'
import { dryRunInternal } from '../../transfer/dryRun/dryRunInternal'
import { padFeeBy } from '../../transfer/fees/padFee'
import type { TDryRunResult, TPolkadotXCMTransferOptions, TSerializedApiCall } from '../../types'
import { determineRelayChain } from '..'
import { validateAddress } from '../validateAddress'
import { createExecuteCall } from './createExecuteCall'
import { createExecuteXcm } from './createExecuteXcm'
import { handleExecuteTransfer } from './handleExecuteTransfer'

vi.mock('../../utils/transfer', () => ({
  createExecuteXcm: vi.fn(),
  createExecuteCall: vi.fn()
}))

vi.mock('../validateAddress', () => ({
  validateAddress: vi.fn()
}))

vi.mock('./createExecuteXcm', () => ({
  createExecuteXcm: vi.fn()
}))

vi.mock('./createExecuteCall', () => ({
  createExecuteCall: vi.fn()
}))

vi.mock('../../nodes/getTNode', () => ({
  getTNode: vi.fn()
}))

vi.mock('../../pallets/assets', () => ({
  getAssetBalanceInternal: vi.fn()
}))

vi.mock('../../transfer/dryRun/dryRunInternal', () => ({
  dryRunInternal: vi.fn()
}))

vi.mock('../../transfer/fees/padFee', () => ({
  padFeeBy: vi.fn()
}))

vi.mock('..', () => ({
  assertAddressIsString: vi.fn(),
  determineRelayChain: vi.fn()
}))

vi.mock('@paraspell/assets', () => ({
  isAssetEqual: vi.fn()
}))

describe('handleExecuteTransfer', () => {
  const mockApi = {
    callTxMethod: vi.fn(),
    getXcmWeight: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>

  const mockXcm = { [Version.V4]: {} } as ReturnType<typeof createExecuteXcm>

  const mockInput = {
    api: mockApi,
    asset: { symbol: 'DOT', amount: '1000', isNative: true },
    multiAsset: {} as TMultiAsset,
    scenario: 'ParaToRelay',
    destLocation: {} as TMultiLocation,
    beneficiaryLocation: {} as TMultiLocation,
    paraIdTo: 1001,
    address: 'address',
    destination: 'Polkadot',
    senderAddress: '0x1234567890abcdef',
    currency: { symbol: 'DOT' },
    version: Version.V4
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  const mockNode = 'AssetHubPolkadot'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(validateAddress).mockImplementation(() => {})
    vi.mocked(determineRelayChain).mockReturnValue('Polkadot')
    vi.mocked(getTNode).mockReturnValue(mockNode)
    vi.mocked(padFeeBy).mockImplementation(
      (fee, percentage) => fee + (fee * BigInt(percentage)) / 100n
    )
  })

  it('should throw error when senderAddress is not provided', async () => {
    const input = { ...mockInput, senderAddress: undefined }
    await expect(handleExecuteTransfer(mockNode, input)).rejects.toThrow(
      'Please provide senderAddress'
    )
  })

  it('should throw error when amount is smaller than MIN_FEE', async () => {
    const input = {
      ...mockInput,
      senderAddress: '0xvalid',
      asset: { ...mockInput.asset, amount: '999' }
    }
    await expect(handleExecuteTransfer(mockNode, input)).rejects.toThrow(
      'Asset amount is too low, please increase the amount or use a different fee asset.'
    )
  })

  it('should throw error when amount is smaller than calculated fee (same asset)', async () => {
    const input = {
      ...mockInput,
      senderAddress: '0xvalid',
      asset: { ...mockInput.asset, amount: '1500' }
    }

    vi.mocked(createExecuteXcm).mockReturnValue(mockXcm)
    vi.mocked(createExecuteCall).mockReturnValue('mockCall' as unknown as TSerializedApiCall)
    vi.spyOn(mockApi, 'callTxMethod').mockReturnValue('mockTx')

    const dryRunResult = {
      origin: { success: true, fee: 1000n },
      assetHub: { success: true, fee: 1000n },
      hops: []
    } as unknown as TDryRunResult
    vi.mocked(dryRunInternal).mockResolvedValue(dryRunResult)

    // origin fee: 1000n, padded by 20% = 1200n
    // hop fee: 1000n, padded by 40% = 1400n
    // total = 2600n, but amount is only 1500n

    await expect(handleExecuteTransfer(mockNode, input)).rejects.toThrow(
      'Asset amount is too low, please increase the amount or use a different fee asset.'
    )
  })

  it('should throw error when amount is smaller than calculated fee (different fee asset)', async () => {
    const input = {
      ...mockInput,
      senderAddress: '0xvalid',
      asset: { ...mockInput.asset, amount: '1200' },
      feeAsset: { symbol: 'USDT' },
      feeCurrency: { symbol: 'USDT' }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    vi.mocked(isAssetEqual).mockReturnValue(false)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(BigInt(5000))

    vi.mocked(createExecuteXcm).mockReturnValue(mockXcm)
    vi.mocked(createExecuteCall).mockReturnValue('mockCall' as unknown as TSerializedApiCall)
    vi.spyOn(mockApi, 'callTxMethod').mockReturnValue('mockTx')

    const dryRunResult = {
      origin: { success: true, fee: 1000n },
      assetHub: { success: true, fee: 1000n },
      failureReason: null
    } as unknown as TDryRunResult
    vi.mocked(dryRunInternal).mockResolvedValue(dryRunResult)

    await expect(handleExecuteTransfer(mockNode, input)).rejects.toThrow(
      'Asset amount is too low, please increase the amount or use a different fee asset.'
    )
  })

  it('should throw error if origin dry run fails', async () => {
    const input = {
      ...mockInput,
      senderAddress: '0xvalid',
      asset: { ...mockInput.asset, amount: '10000' }
    }

    vi.mocked(createExecuteXcm).mockReturnValue(mockXcm)
    vi.mocked(createExecuteCall).mockReturnValue('mockCall' as unknown as TSerializedApiCall)
    vi.spyOn(mockApi, 'callTxMethod').mockReturnValue('mockTx')

    const dryRunResult = {
      origin: { success: false, fee: 0n },
      failureReason: 'Origin execution failed'
    } as unknown as TDryRunResult
    vi.mocked(dryRunInternal).mockResolvedValue(dryRunResult)

    await expect(handleExecuteTransfer(mockNode, input)).rejects.toThrow('Origin execution failed')
  })

  it('should throw error if assetHub dry run fails', async () => {
    const input = {
      ...mockInput,
      senderAddress: '0xvalid',
      asset: { ...mockInput.asset, amount: '10000' }
    }

    vi.mocked(createExecuteXcm).mockReturnValue(mockXcm)
    vi.mocked(createExecuteCall).mockReturnValue('mockCall' as unknown as TSerializedApiCall)
    vi.spyOn(mockApi, 'callTxMethod').mockReturnValue('mockTx')

    const dryRunResult = {
      origin: { success: true, fee: 1000n },
      assetHub: { success: false, fee: 0n },
      failureReason: 'AssetHub execution failed'
    } as unknown as TDryRunResult
    vi.mocked(dryRunInternal).mockResolvedValue(dryRunResult)

    await expect(handleExecuteTransfer(mockNode, input)).rejects.toThrow(
      'AssetHub execution failed'
    )
  })

  it('should throw error if multiple hops detected', async () => {
    const input = {
      ...mockInput,
      senderAddress: '0xvalid',
      asset: { ...mockInput.asset, amount: '10000' }
    }

    vi.mocked(createExecuteXcm).mockReturnValue(mockXcm)
    vi.mocked(createExecuteCall).mockReturnValue('mockCall' as unknown as TSerializedApiCall)
    vi.spyOn(mockApi, 'callTxMethod').mockReturnValue('mockTx')

    const dryRunResult = {
      origin: { success: true, fee: 1000n },
      hops: [{ result: { success: true, fee: 500n } }, { result: { success: true, fee: 500n } }]
    } as unknown as TDryRunResult
    vi.mocked(dryRunInternal).mockResolvedValue(dryRunResult)

    await expect(handleExecuteTransfer(mockNode, input)).rejects.toThrow(
      'Multiple intermediate hops detected (2). Only single hop transfers are supported.'
    )
  })

  it('should throw error if single hop fails', async () => {
    const input = {
      ...mockInput,
      senderAddress: '0xvalid',
      asset: { ...mockInput.asset, amount: '10000' }
    }

    vi.mocked(createExecuteXcm).mockReturnValue(mockXcm)
    vi.mocked(createExecuteCall).mockReturnValue('mockCall' as unknown as TSerializedApiCall)
    vi.spyOn(mockApi, 'callTxMethod').mockReturnValue('mockTx')

    const dryRunResult = {
      origin: { success: true, fee: 1000n },
      hops: [{ result: { success: false, fee: 0n } }],
      failureReason: 'Hop execution failed'
    } as unknown as TDryRunResult
    vi.mocked(dryRunInternal).mockResolvedValue(dryRunResult)

    await expect(handleExecuteTransfer(mockNode, input)).rejects.toThrow('Hop execution failed')
  })

  it('should successfully create and return executeXcm transaction with assetHub', async () => {
    const input = {
      ...mockInput,
      senderAddress: '0xvalid',
      asset: { ...mockInput.asset, amount: '10000' }
    }

    vi.mocked(createExecuteXcm).mockReturnValue(mockXcm)
    vi.mocked(createExecuteCall).mockReturnValue('finalTx' as unknown as TSerializedApiCall)
    vi.spyOn(mockApi, 'callTxMethod').mockReturnValue('mockTx')
    const getXcmWeightSpy = vi
      .spyOn(mockApi, 'getXcmWeight')
      .mockResolvedValue({ proofSize: 0n, refTime: 12000n })

    const dryRunResult = {
      origin: { success: true, fee: 1000n },
      assetHub: { success: true, fee: 2000n }
    } as unknown as TDryRunResult
    vi.mocked(dryRunInternal).mockResolvedValue(dryRunResult)

    const result = await handleExecuteTransfer(mockNode, input)

    expect(result).toBe('finalTx')
    expect(createExecuteXcm).toHaveBeenCalledTimes(2)
    expect(createExecuteXcm).toHaveBeenNthCalledWith(
      1,
      mockNode,
      mockNode,
      input,
      1000n,
      1000n,
      Version.V4
    )
    expect(createExecuteXcm).toHaveBeenNthCalledWith(
      2,
      mockNode,
      mockNode,
      input,
      1200n,
      2800n,
      Version.V4
    )
    expect(getXcmWeightSpy).toHaveBeenCalledWith(mockXcm)
    expect(createExecuteCall).toHaveBeenCalledTimes(2)
    expect(createExecuteCall).toHaveBeenNthCalledWith(1, mockXcm, MAX_WEIGHT)
    expect(createExecuteCall).toHaveBeenNthCalledWith(2, mockXcm, {
      proofSize: 0n,
      refTime: 12000n
    })
  })

  it('should successfully create and return executeXcm transaction with single hop', async () => {
    const input = {
      ...mockInput,
      senderAddress: '0xvalid',
      asset: { ...mockInput.asset, amount: '10000' }
    }

    vi.mocked(createExecuteXcm).mockReturnValue(mockXcm)
    vi.mocked(createExecuteCall).mockReturnValue('finalTx' as unknown as TSerializedApiCall)
    vi.spyOn(mockApi, 'callTxMethod').mockReturnValue('mockTx')
    const getXcmWeightSpy = vi
      .spyOn(mockApi, 'getXcmWeight')
      .mockResolvedValue({ proofSize: 0n, refTime: 15000n })

    const dryRunResult = {
      origin: { success: true, fee: 1500n },
      hops: [{ result: { success: true, fee: 3000n } }]
    } as unknown as TDryRunResult
    vi.mocked(dryRunInternal).mockResolvedValue(dryRunResult)

    const result = await handleExecuteTransfer(mockNode, input)

    expect(result).toBe('finalTx')
    expect(createExecuteXcm).toHaveBeenCalledTimes(2)
    expect(createExecuteXcm).toHaveBeenNthCalledWith(
      1,
      mockNode,
      mockNode,
      input,
      1000n,
      1000n,
      Version.V4
    )
    expect(createExecuteXcm).toHaveBeenNthCalledWith(
      2,
      mockNode,
      mockNode,
      input,
      1800n,
      4200n,
      Version.V4
    )
    expect(getXcmWeightSpy).toHaveBeenCalledWith(mockXcm)
    expect(createExecuteCall).toHaveBeenCalledTimes(2)
  })

  it('should use MIN_FEE for hopFee when no assetHub or hops', async () => {
    const input = {
      ...mockInput,
      senderAddress: '0xvalid',
      asset: { ...mockInput.asset, amount: '10000' }
    }

    vi.mocked(createExecuteXcm).mockReturnValue(mockXcm)
    vi.mocked(createExecuteCall).mockReturnValue('finalTx' as unknown as TSerializedApiCall)
    vi.spyOn(mockApi, 'callTxMethod').mockReturnValue('mockTx')
    vi.spyOn(mockApi, 'getXcmWeight').mockResolvedValue({ proofSize: 0n, refTime: 15000n })

    const dryRunResult = {
      origin: { success: true, fee: 1500n }
    } as unknown as TDryRunResult
    vi.mocked(dryRunInternal).mockResolvedValue(dryRunResult)

    const result = await handleExecuteTransfer(mockNode, input)

    expect(result).toBe('finalTx')
    expect(createExecuteXcm).toHaveBeenCalledTimes(2)
    expect(createExecuteXcm).toHaveBeenNthCalledWith(
      1,
      mockNode,
      mockNode,
      input,
      1000n,
      1000n,
      Version.V4
    )
    expect(createExecuteXcm).toHaveBeenNthCalledWith(
      2,
      mockNode,
      mockNode,
      input,
      1800n,
      1400n,
      Version.V4
    )
  })

  it('should fetch fee asset balance when fee asset is different', async () => {
    const input = {
      ...mockInput,
      senderAddress: '0xvalid',
      asset: { ...mockInput.asset, amount: '10000' },
      feeAsset: { symbol: 'USDT' },
      feeCurrency: { symbol: 'USDT' }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    vi.mocked(isAssetEqual).mockReturnValue(false)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(BigInt(5000))

    vi.mocked(createExecuteXcm).mockReturnValue(mockXcm)
    vi.mocked(createExecuteCall).mockReturnValue('finalTx' as unknown as TSerializedApiCall)
    vi.spyOn(mockApi, 'callTxMethod').mockReturnValue('mockTx')
    vi.spyOn(mockApi, 'getXcmWeight').mockResolvedValue({ proofSize: 0n, refTime: 15000n })

    const dryRunResult = {
      origin: { success: true, fee: 1000n },
      assetHub: { success: true, fee: 2000n }
    } as unknown as TDryRunResult
    vi.mocked(dryRunInternal).mockResolvedValue(dryRunResult)

    const result = await handleExecuteTransfer(mockNode, input)

    expect(result).toBe('finalTx')
    expect(getAssetBalanceInternal).toHaveBeenCalledWith({
      api: mockApi,
      address: '0xvalid',
      node: mockNode,
      currency: { symbol: 'USDT' }
    })
    expect(createExecuteXcm).toHaveBeenNthCalledWith(
      1,
      mockNode,
      mockNode,
      input,
      5000n,
      1000n,
      Version.V4
    )
    expect(createExecuteXcm).toHaveBeenNthCalledWith(
      2,
      mockNode,
      mockNode,
      input,
      1200n,
      2800n,
      Version.V4
    )
  })
})
