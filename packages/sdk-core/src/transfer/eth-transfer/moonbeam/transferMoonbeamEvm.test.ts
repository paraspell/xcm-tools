import type { TAssetInfo, TForeignAssetInfo } from '@paraspell/assets'
import { findAssetInfoOrThrow, getNativeAssetSymbol, isForeignAsset } from '@paraspell/assets'
import type { GetContractReturnType, PublicClient, WalletClient } from 'viem'
import { createPublicClient, getContract } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../../api'
import type { TEvmBuilderOptions } from '../../../types'
import { abstractDecimals, formatAssetIdToERC20 } from '../../../utils'
import abi from './abi.json' with { type: 'json' }
import { getDestinationLocation } from './getDestinationLocation'
import { transferMoonbeamEvm } from './transferMoonbeamEvm'

vi.mock('@paraspell/assets', () => ({
  findAssetInfoOrThrow: vi.fn(),
  InvalidCurrencyError: class InvalidCurrencyError extends Error {},
  getNativeAssetSymbol: vi.fn(),
  isForeignAsset: vi.fn()
}))
vi.mock('viem')

vi.mock('./getDestinationLocation')
vi.mock('../../../utils')

const mockApi = {
  init: vi.fn(),
  deserializeExtrinsics: vi.fn()
} as unknown as IPolkadotApi<unknown, unknown>

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
  const mockAddress = 'some-address'
  const mockCurrency = { symbol: 'GLMR', amount: '1000000' }
  const mockForeignAsset = {
    symbol: 'xcPINK2',
    assetId: '10000000000000000000000000000000000001'
  } as TForeignAssetInfo

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getContract).mockReturnValue(mockViemContract)
    vi.mocked(findAssetInfoOrThrow).mockReturnValue(mockForeignAsset)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('GLMR')
    vi.mocked(isForeignAsset).mockReturnValue(true)
    vi.mocked(formatAssetIdToERC20).mockReturnValue('0xformattedAsset')
    vi.mocked(getDestinationLocation).mockReturnValue(['someDestination'] as unknown as ReturnType<
      typeof getDestinationLocation
    >)
    vi.mocked(createPublicClient).mockReturnValue({} as PublicClient)
    vi.mocked(abstractDecimals).mockImplementation(amount => BigInt(amount))
  })

  it('uses native asset ID if found asset is the native symbol', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValueOnce({ symbol: 'GLMR' } as TAssetInfo)
    await transferMoonbeamEvm({
      api: mockApi,
      from: mockFrom,
      to: mockTo,
      signer: mockSigner,
      address: mockAddress,
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
    vi.mocked(isForeignAsset).mockReturnValueOnce(false)
    vi.mocked(findAssetInfoOrThrow).mockReturnValueOnce({
      symbol: 'NOT_NATIVE',
      assetId: undefined
    } as TAssetInfo)

    await expect(
      transferMoonbeamEvm({
        api: mockApi,
        from: mockFrom,
        to: mockTo,
        signer: mockSigner,
        address: mockAddress,
        currency: mockCurrency
      })
    ).rejects.toThrowError('Currency must be a foreign asset with valid assetId')
  })

  it('formats foreign asset ID if the asset is foreign', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValueOnce(mockForeignAsset)
    vi.mocked(isForeignAsset).mockReturnValueOnce(true)
    await transferMoonbeamEvm({
      api: mockApi,
      from: mockFrom,
      to: mockTo,
      signer: mockSigner,
      address: mockAddress,
      currency: mockCurrency
    })
    expect(formatAssetIdToERC20).toHaveBeenCalledWith(mockForeignAsset.assetId)
  })

  it('calls transferMultiCurrencies if useMultiAssets is true', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValueOnce({
      symbol: 'xcPINK',
      assetId: '100000000'
    } as TAssetInfo)
    await transferMoonbeamEvm({
      api: mockApi,
      from: 'Moonbeam',
      to: 'AssetHubPolkadot',
      signer: mockSigner,
      address: mockAddress,
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
      address: mockAddress,
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
      address: mockAddress,
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
        address: mockAddress,
        currency: []
      } as TEvmBuilderOptions<unknown, unknown>)
    ).rejects.toThrowError()
  })

  it('throws if trying to override location', async () => {
    await expect(
      transferMoonbeamEvm({
        api: mockApi,
        from: 'Moonbeam',
        to: 'AssetHubPolkadot',
        signer: mockSigner,
        address: mockAddress,
        currency: {
          location: { type: 'Override', value: { parents: 1, interior: {} } },
          amount: 1000
        }
      } as TEvmBuilderOptions<unknown, unknown>)
    ).rejects.toThrowError()
  })
})
