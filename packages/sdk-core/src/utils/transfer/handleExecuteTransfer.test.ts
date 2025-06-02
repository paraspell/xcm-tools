import {
  type TAsset,
  type TMultiAsset,
  type TNativeAsset,
  type WithAmount
} from '@paraspell/assets'
import type { TMultiLocation } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import type { TPolkadotXCMTransferOptions, TXcmVersioned } from '../../types'
import { transformMultiLocation } from '../multiLocation'
import { validateAddress } from '../validateAddress'
import { createExecuteXcm } from './createExecuteXcm'
import { handleExecuteTransfer } from './handleExecuteTransfer'

vi.mock('../validateAddress', () => ({
  validateAddress: vi.fn()
}))

describe('handleExecuteTransfer', () => {
  const mockNode = 'AssetHubPolkadot'

  const mockApi = {
    callTxMethod: vi.fn().mockResolvedValue('success'),
    createApiForNode: vi.fn().mockResolvedValue({
      getFromStorage: vi.fn().mockResolvedValue('0x0000000000000000')
    }),
    createAccountId: vi.fn().mockReturnValue('0x0000000000000000'),
    clone: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>

  const mockInput = {
    api: mockApi,
    asset: { symbol: 'DOT', amount: '1000', decimals: 10, isNative: true },
    currencySelection: {} as TXcmVersioned<TMultiAsset[]>,
    scenario: 'ParaToRelay',
    header: {} as TXcmVersioned<TMultiLocation>,
    addressSelection: {} as TXcmVersioned<TMultiLocation>,
    paraIdTo: 1001,
    address: 'address',
    destination: 'Polkadot',
    senderAddress: '0x1234567890abcdef'
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    vi.mocked(validateAddress).mockImplementation(() => {})
  })

  it('should throw error when senderAddress is not provided', async () => {
    const input = { ...mockInput, senderAddress: undefined }
    await expect(handleExecuteTransfer(mockNode, input)).rejects.toThrow(
      'Please provide senderAddress'
    )
  })

  it('should throw error if dry run fails (success is false)', async () => {
    const input = {
      ...mockInput,
      senderAddress: '0xvalid',
      asset: { ...mockInput.asset, multiLocation: {} as TMultiLocation }
    }
    mockApi.getDryRunCall = vi.fn().mockResolvedValue({ success: false, fee: 0n, weight: 0n })
    await expect(handleExecuteTransfer(mockNode, input)).rejects.toThrow()
  })

  it('should throw error if dry run weight is not found', async () => {
    const input = {
      ...mockInput,
      senderAddress: '0xvalid',
      asset: { ...mockInput.asset, multiLocation: {} as TMultiLocation, decimals: 12 }
    }
    mockApi.getDryRunCall = vi.fn().mockResolvedValue({ success: true, fee: 10000n, weight: null })
    await expect(handleExecuteTransfer(mockNode, input)).rejects.toThrow(
      'Dry run failed: weight not found'
    )
  })

  it('should successfully create and return executeXcm transaction', async () => {
    const input = {
      ...mockInput,
      senderAddress: '0xvalid',
      asset: { ...mockInput.asset, multiLocation: {} as TMultiLocation, decimals: 12 }
    }
    input.asset.amount = '1000000'
    const dryRunResult = { success: true, fee: 10000n, weight: 5000n }
    mockApi.getDryRunCall = vi.fn().mockResolvedValue(dryRunResult)
    vi.mocked(transformMultiLocation).mockReturnValue({
      transformed: true
    } as unknown as TMultiLocation)
    mockApi.quoteAhPrice = vi.fn().mockResolvedValue(500n)
    vi.mocked(createExecuteXcm).mockReturnValueOnce('dummyTx').mockReturnValueOnce('finalTx')
    const result = await handleExecuteTransfer(mockNode, input)
    expect(result).toBe('finalTx')
    expect(createExecuteXcm).toHaveBeenCalledWith(input, dryRunResult.weight, 12000n)
  })

  it('should throw error if using overridden multi-assets with xcm execute transfer', () => {
    const input = {
      ...mockInput,
      overriddenAsset: {},
      senderAddress: '0xvalid',
      feeAsset: {} as TAsset
    } as TPolkadotXCMTransferOptions<unknown, unknown>
    expect(() => handleExecuteTransfer(mockNode, input)).toThrow(
      'Cannot use overridden multi-assets with XCM execute'
    )
  })

  it('should throw error if fee asset does not match', () => {
    const input = {
      ...mockInput,
      senderAddress: '0xvalid',
      feeAsset: { symbol: 'DOT' } as TAsset,
      asset: { symbol: 'KSM', amount: 10000 } as WithAmount<TNativeAsset>
    } as TPolkadotXCMTransferOptions<unknown, unknown>
    expect(() => handleExecuteTransfer(mockNode, input)).toThrow(
      'Fee asset does not match transfer asset.'
    )
  })
})
