/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { TForeignAsset } from '@paraspell/assets'
import {
  findAsset,
  getNativeAssetSymbol,
  InvalidCurrencyError,
  isForeignAsset
} from '@paraspell/assets'
import type { Signer, TransactionResponse } from 'ethers'
import { Contract } from 'ethers'
import type { WalletClient } from 'viem'
import { createPublicClient, getContract } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../../api'
import { formatAssetIdToERC20 } from '../../../pallets/assets/balance'
import { isEthersContract, isEthersSigner } from '../utils'
import { getDestinationMultilocation } from './getDestinationMultilocation'
import { transferMoonbeamEvm } from './transferMoonbeamEvm'

vi.mock('ethers', () => ({
  Contract: vi.fn()
}))

vi.mock('@paraspell/assets', () => ({
  findAsset: vi.fn(),
  getNativeAssetSymbol: vi.fn(),
  InvalidCurrencyError: class extends Error {},
  isForeignAsset: vi.fn()
}))

vi.mock('viem', () => ({
  createPublicClient: vi.fn(),
  getContract: vi.fn(),
  http: vi.fn()
}))

vi.mock('../utils', () => ({
  isEthersContract: vi.fn(),
  isEthersSigner: vi.fn()
}))

vi.mock('../../../pallets/assets/balance', () => ({
  formatAssetIdToERC20: vi.fn()
}))

vi.mock('./getDestinationMultilocation', () => ({
  getDestinationMultilocation: vi.fn()
}))

const mockApi = {
  init: vi.fn(),
  callTxMethod: vi.fn()
} as unknown as IPolkadotApi<unknown, unknown>

describe('transferMoonbeamEvm', () => {
  const mockContract = {
    transfer: vi.fn(),
    transferMultiCurrencies: vi.fn()
  } as unknown as Contract
  const mockViemContract = {
    write: {
      transfer: vi.fn(),
      transferMultiCurrencies: vi.fn()
    }
  } as any
  const mockSigner = { provider: {} } as Signer
  const mockViemSigner = { property: 'value' } as unknown as WalletClient
  const mockFrom = 'Moonbeam'
  const mockTo = 'AssetHubPolkadot'
  const mockAddress = 'some-address'
  const mockCurrency = { symbol: 'GLMR', amount: '1000000' }
  const mockForeignAsset = {
    symbol: 'xcPINK2',
    assetId: '10000000000000000000000000000000000001'
  } as TForeignAsset

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(isEthersSigner).mockReturnValue(false)
    vi.mocked(getContract).mockReturnValue(mockViemContract)
    vi.mocked(Contract).mockImplementation(() => mockContract)
    vi.mocked(isEthersContract).mockReturnValue(false)
    vi.mocked(findAsset).mockReturnValue(mockForeignAsset)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('GLMR')
    vi.mocked(isForeignAsset).mockReturnValue(true)
    vi.mocked(formatAssetIdToERC20).mockReturnValue('0xformattedAsset')
    vi.mocked(getDestinationMultilocation).mockReturnValue(['someDestination'] as unknown as (
      | number
      | string[]
    )[])
    vi.mocked(createPublicClient).mockReturnValue({} as any)
  })

  it('throws InvalidCurrencyError if getAssetBySymbolOrId returns null', async () => {
    vi.mocked(findAsset).mockReturnValueOnce(null)
    await expect(
      transferMoonbeamEvm({
        api: mockApi,
        from: mockFrom,
        to: mockTo,
        signer: mockSigner,
        address: mockAddress,
        currency: mockCurrency
      })
    ).rejects.toThrowError(InvalidCurrencyError)
  })

  it('uses native asset ID if found asset is the native symbol', async () => {
    vi.mocked(findAsset).mockReturnValueOnce({
      symbol: 'GLMR'
    } as any)

    const spy = vi.spyOn(mockViemContract.write, 'transfer')

    await transferMoonbeamEvm({
      api: mockApi,
      from: mockFrom,
      to: mockTo,
      signer: mockSigner,
      address: mockAddress,
      currency: mockCurrency
    })
    expect(formatAssetIdToERC20).not.toHaveBeenCalled()
    expect(spy).toHaveBeenCalledWith([
      '0x0000000000000000000000000000000000000802',
      mockCurrency.amount,
      ['someDestination'],
      18446744073709551615n
    ])
  })

  it('throws InvalidCurrencyError if asset is not foreign and missing valid assetId', async () => {
    vi.mocked(isForeignAsset).mockReturnValueOnce(false)
    vi.mocked(findAsset).mockReturnValueOnce({
      symbol: 'NOT_NATIVE',
      assetId: undefined
    } as any)
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
    vi.mocked(findAsset).mockReturnValueOnce(mockForeignAsset)
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
    vi.mocked(findAsset).mockReturnValueOnce({
      symbol: 'xcPINK',
      assetId: '100000000'
    } as any)
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
    vi.mocked(isEthersContract).mockReturnValueOnce(false)
    vi.mocked(isEthersSigner).mockReturnValueOnce(false)
    await transferMoonbeamEvm({
      api: mockApi,
      from: 'Moonbeam',
      to: 'AssetHubPolkadot',
      signer: mockViemSigner,
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

  it('returns tx.hash if the result is an object', async () => {
    vi.mocked(isEthersSigner).mockReturnValueOnce(true)
    vi.mocked(isEthersContract).mockReturnValueOnce(true)
    const mockTxResponse = { hash: '0xMockHash' } as TransactionResponse

    vi.spyOn(mockContract, 'transfer').mockResolvedValueOnce(mockTxResponse)

    const result = await transferMoonbeamEvm({
      api: mockApi,
      from: mockFrom,
      to: mockTo,
      signer: mockSigner,
      address: mockAddress,
      currency: mockCurrency
    })
    expect(result).toBe('0xMockHash')
  })

  it('returns the raw string if the result is a string', async () => {
    vi.spyOn(mockViemContract.write, 'transfer').mockResolvedValueOnce('0xStringHash')

    const result = await transferMoonbeamEvm({
      api: mockApi,
      from: mockFrom,
      to: mockTo,
      signer: mockViemSigner,
      address: mockAddress,
      currency: mockCurrency
    })
    expect(result).toBe('0xStringHash')
  })

  it('throws if passed multiasset currency', async () => {
    await expect(
      transferMoonbeamEvm({
        api: mockApi,
        from: 'Moonbeam',
        to: 'AssetHubPolkadot',
        signer: mockSigner,
        address: mockAddress,
        currency: { multiasset: [], amount: '1234' }
      })
    ).rejects.toThrowError()
  })

  it('throws if trying to override multilocation', async () => {
    await expect(
      transferMoonbeamEvm({
        api: mockApi,
        from: 'Moonbeam',
        to: 'AssetHubPolkadot',
        signer: mockSigner,
        address: mockAddress,
        currency: {
          multilocation: { type: 'Override', value: { parents: 1, interior: {} } },
          amount: 1000
        }
      })
    ).rejects.toThrowError()
  })
})
