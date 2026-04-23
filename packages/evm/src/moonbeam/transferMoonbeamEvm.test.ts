import type { PolkadotApi, TAssetInfo, TEvmTransferOptions } from '@paraspell/sdk-core'
import {
  abstractDecimals,
  findAssetInfoOrThrow,
  formatAssetIdToERC20,
  getNativeAssetSymbol,
  isOverrideLocationSpecifier
} from '@paraspell/sdk-core'
import {
  createPublicClient,
  getContract,
  type GetContractReturnType,
  type PublicClient,
  type WalletClient
} from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import abi from './abi.json' with { type: 'json' }
import { getDestinationLocation } from './getDestinationLocation'
import { transferMoonbeamEvm } from './transferMoonbeamEvm'
import { transferMoonbeamLocal } from './transferMoonbeamLocal'

vi.mock('@paraspell/sdk-core', async importOriginal => ({
  ...(await importOriginal()),
  abstractDecimals: vi.fn(),
  assertHasId: vi.fn(),
  findAssetInfoOrThrow: vi.fn(),
  formatAssetIdToERC20: vi.fn(),
  getNativeAssetSymbol: vi.fn(),
  isOverrideLocationSpecifier: vi.fn()
}))

vi.mock('viem', async importOriginal => ({
  ...(await importOriginal()),
  http: vi.fn(),
  createPublicClient: vi.fn(),
  getContract: vi.fn()
}))

vi.mock('./getDestinationLocation')
vi.mock('./transferMoonbeamLocal')

const mockApi = {
  init: vi.fn(),
  deserializeExtrinsics: vi.fn()
} as unknown as PolkadotApi<unknown, unknown, unknown>

describe('transferMoonbeamEvm', () => {
  const mockViemContract = {
    address: '0xMockContract',
    abi: [],
    write: {
      transfer: vi.fn().mockResolvedValue('0xMockTxHash'),
      transferMultiCurrencies: vi.fn().mockResolvedValue('0xMockMultiTxHash')
    }
  } as unknown as GetContractReturnType<typeof abi, PublicClient>

  const mockSigner = {
    account: '0xabc',
    chain: { id: 1284 }
  } as unknown as WalletClient
  const mockFrom = 'Moonbeam'
  const mockTo = 'AssetHubPolkadot'
  const mockRecipient = 'some-address'
  const mockCurrency = { symbol: 'GLMR', amount: '1000000' }
  const mockForeignAsset: TAssetInfo = {
    symbol: 'xcPINK2',
    decimals: 18,
    location: { parents: 1, interior: 'Here' },
    assetId: '10000000000000000000000000000000000001'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getContract).mockReturnValue(mockViemContract)
    vi.mocked(findAssetInfoOrThrow).mockReturnValue(mockForeignAsset)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('GLMR')
    vi.mocked(formatAssetIdToERC20).mockReturnValue('0xformattedAsset')
    vi.mocked(getDestinationLocation).mockReturnValue(['someDestination'] as unknown as ReturnType<
      typeof getDestinationLocation
    >)
    vi.mocked(createPublicClient).mockReturnValue({} as PublicClient)
    vi.mocked(abstractDecimals).mockImplementation(amount => BigInt(amount))
    vi.mocked(transferMoonbeamLocal).mockResolvedValue('0xLocalTxHash')
    vi.mocked(isOverrideLocationSpecifier).mockReturnValue(false)
  })

  it('uses native asset ID if found asset is the native symbol', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValueOnce({ symbol: 'GLMR' } as TAssetInfo)
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
        recipient: mockRecipient,
        currency: mockCurrency
      })
    ).rejects.toThrow('Currency must be a foreign asset with valid assetId')
  })

  it('formats foreign asset ID if the asset is foreign', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValueOnce(mockForeignAsset)
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
    vi.mocked(findAssetInfoOrThrow).mockReturnValueOnce({
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
      } as TEvmTransferOptions<unknown, unknown, unknown>)
    ).rejects.toThrow()
  })

  it('throws if trying to override location', async () => {
    vi.mocked(isOverrideLocationSpecifier).mockReturnValueOnce(true)
    await expect(
      transferMoonbeamEvm({
        api: mockApi,
        from: 'Moonbeam',
        to: 'AssetHubPolkadot',
        signer: mockSigner,
        recipient: mockRecipient,
        currency: {
          location: { type: 'Override', value: { parents: 1, interior: {} } },
          amount: 1000
        }
      } as TEvmTransferOptions<unknown, unknown, unknown>)
    ).rejects.toThrow()
  })

  it('delegates to transferMoonbeamLocal when from === to', async () => {
    const localAsset = { symbol: 'xcDOT', assetId: '0xABCDEF', decimals: 10 } as TAssetInfo
    vi.mocked(findAssetInfoOrThrow).mockReturnValueOnce(localAsset)

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
