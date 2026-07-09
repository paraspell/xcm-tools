import type { TAssetInfo } from '@paraspell/assets'
import { getNativeAssetSymbol } from '@paraspell/assets'
import type { GetContractReturnType, PublicClient, WalletClient } from 'viem'
import { createPublicClient, getContract } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../../api'
import type { TEvmTransferOptions } from '../../../types'
import { abstractDecimals, formatAssetIdToERC20 } from '../../../utils'
import abi from './abi.json' with { type: 'json' }
import { getDestinationLocation } from './getDestinationLocation'
import { transferMoonbeamEvm } from './transferMoonbeamEvm'
import { transferMoonbeamLocal } from './transferMoonbeamLocal'

vi.mock('@paraspell/assets', () => ({
  InvalidCurrencyError: class InvalidCurrencyError extends Error {},
  getNativeAssetSymbol: vi.fn()
}))
vi.mock('viem')

vi.mock('./getDestinationLocation')
vi.mock('./transferMoonbeamLocal')
vi.mock('../../../utils')

const mockApi = {
  init: vi.fn(),
  deserializeExtrinsics: vi.fn(),
  findAssetInfoOrThrow: vi.fn()
} as unknown as PolkadotApi<unknown, unknown, unknown>

const findAssetInfoOrThrowSpy = vi.spyOn(mockApi, 'findAssetInfoOrThrow')

describe('transferMoonbeamEvm', () => {
  const mockViemContract = {
    address: '0xMockContract',
    abi: [],
    write: {
      transfer: vi.fn().mockResolvedValue('0xMockTxHash'),
      transferMultiCurrencies: vi.fn().mockResolvedValue('0xMockMultiTxHash')
    }
  } as unknown as GetContractReturnType<typeof abi, PublicClient>

  const mockSigner = { account: '0xabc', chain: { id: 1284 } } as unknown as WalletClient
  const mockFrom = 'Moonbeam'
  const mockTo = 'AssetHubPolkadot'
  const mockRecipient = 'some-address'
  const mockCurrency = { symbol: 'GLMR', amount: '1000000' }
  const mockForeignAsset = {
    symbol: 'xcPINK2',
    assetId: '10000000000000000000000000000000000001'
  } as TAssetInfo

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getContract).mockReturnValue(mockViemContract)
    findAssetInfoOrThrowSpy.mockReturnValue(mockForeignAsset)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('GLMR')
    vi.mocked(formatAssetIdToERC20).mockReturnValue('0xformattedAsset')
    vi.mocked(getDestinationLocation).mockReturnValue(['someDestination'] as unknown as ReturnType<
      typeof getDestinationLocation
    >)
    vi.mocked(createPublicClient).mockReturnValue({} as PublicClient)
    vi.mocked(abstractDecimals).mockImplementation(amount => BigInt(amount))
    vi.mocked(transferMoonbeamLocal).mockResolvedValue('0xLocalTxHash')
  })

  it('uses native asset ID if found asset is the native symbol', async () => {
    findAssetInfoOrThrowSpy.mockReturnValueOnce({ symbol: 'GLMR' } as TAssetInfo)
    await transferMoonbeamEvm({
      api: mockApi,
      from: mockFrom,
      to: mockTo,
      signer: mockSigner,
      recipient: mockRecipient,
      currency: mockCurrency
    })
    expect(formatAssetIdToERC20).not.toHaveBeenCalled()
    expect(mockViemContract.write.transfer).toHaveBeenCalledWith([
      '0x0000000000000000000000000000000000000802',
      mockCurrency.amount,
      ['someDestination'],
      18446744073709551615n
    ])
  })

  it('throws InvalidCurrencyError if asset is not foreign and missing valid assetId', async () => {
    findAssetInfoOrThrowSpy.mockReturnValueOnce({
      symbol: 'NOT_NATIVE',
      assetId: undefined
    } as TAssetInfo)

    await expect(
      transferMoonbeamEvm({
        api: mockApi,
        from: mockFrom,
        to: mockTo,
        signer: mockSigner,
        recipient: mockRecipient,
        currency: mockCurrency
      })
    ).rejects.toThrow('Currency must be a foreign asset with valid assetId')
  })

  it('formats foreign asset ID if the asset is foreign', async () => {
    findAssetInfoOrThrowSpy.mockReturnValueOnce(mockForeignAsset)
    await transferMoonbeamEvm({
      api: mockApi,
      from: mockFrom,
      to: mockTo,
      signer: mockSigner,
      recipient: mockRecipient,
      currency: mockCurrency
    })
    expect(formatAssetIdToERC20).toHaveBeenCalledWith(mockForeignAsset.assetId)
  })

  it('calls transferMultiCurrencies if useMultiAssets is true', async () => {
    findAssetInfoOrThrowSpy.mockReturnValueOnce({
      symbol: 'xcPINK',
      assetId: '100000000'
    } as TAssetInfo)
    await transferMoonbeamEvm({
      api: mockApi,
      from: 'Moonbeam',
      to: 'AssetHubPolkadot',
      signer: mockSigner,
      recipient: mockRecipient,
      currency: { symbol: 'xcPINK', amount: '1000000' }
    })
    expect(mockViemContract.write.transferMultiCurrencies).toHaveBeenCalledWith([
      [
        ['0xformattedAsset', '1000000'],
        ['0xformattedAsset', '200000']
      ],
      1,
      ['someDestination'],
      18446744073709551615n
    ])
  })

  it('calls transfer if useMultiAssets is false', async () => {
    await transferMoonbeamEvm({
      api: mockApi,
      from: 'Moonbeam',
      to: 'AssetHubPolkadot',
      signer: mockSigner,
      recipient: mockRecipient,
      currency: { symbol: 'SOME_TOKEN', amount: '1234' }
    })
    expect(mockViemContract.write.transfer).toHaveBeenCalledWith([
      '0xformattedAsset',
      '1234',
      ['someDestination'],
      18446744073709551615n
    ])
  })

  it('returns string transaction hash', async () => {
    const result = await transferMoonbeamEvm({
      api: mockApi,
      from: mockFrom,
      to: mockTo,
      signer: mockSigner,
      recipient: mockRecipient,
      currency: mockCurrency
    })
    expect(result).toBe('0xMockTxHash')
  })

  it('throws if passed multiasset currency', async () => {
    await expect(
      transferMoonbeamEvm({
        api: mockApi,
        from: 'Moonbeam',
        to: 'AssetHubPolkadot',
        signer: mockSigner,
        recipient: mockRecipient,
        currency: []
      })
    ).rejects.toThrow()
  })

  it('delegates to transferMoonbeamLocal when from === to', async () => {
    const localAsset = { symbol: 'xcDOT', assetId: '0xABCDEF', decimals: 10 } as TAssetInfo
    findAssetInfoOrThrowSpy.mockReturnValueOnce(localAsset)

    const options = {
      api: mockApi,
      from: 'Moonbeam',
      to: 'Moonbeam',
      signer: mockSigner,
      recipient: mockRecipient,
      currency: { symbol: 'xcDOT', amount: '5000000' }
    } as TEvmTransferOptions<unknown, unknown, unknown>

    const result = await transferMoonbeamEvm(options)

    expect(transferMoonbeamLocal).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ symbol: 'xcDOT', assetId: '0xABCDEF', amount: 5000000n }),
      options
    )
    expect(result).toBe('0xLocalTxHash')
    expect(getContract).not.toHaveBeenCalled()
    expect(getDestinationLocation).not.toHaveBeenCalled()
  })
})
