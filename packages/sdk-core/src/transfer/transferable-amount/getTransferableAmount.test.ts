import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import { getEdFromAssetOrThrow, isAssetEqual } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { getAssetBalanceInternal } from '../../balance'
import type { TGetTransferableAmountOptions, TXcmFeeDetail } from '../../types'
import { abstractDecimals } from '../../utils'
import { getOriginXcmFee } from '../fees'
import { resolveCurrency, resolveFeeAsset } from '../utils'
import { getTransferableAmount } from './getTransferableAmount'

vi.mock('@paraspell/assets')
vi.mock('../../utils')
vi.mock('../../balance')
vi.mock('../fees')
vi.mock('../utils')

describe('getTransferableAmount', () => {
  const mockApi = {
    setDisconnectAllowed: vi.fn(),
    disconnect: vi.fn().mockResolvedValue(undefined),
    findAssetInfoOrThrow: vi.fn(),
    findNativeAssetInfoOrThrow: vi.fn()
  } as unknown as PolkadotApi<unknown, unknown, unknown>

  const findAssetInfoOrThrowSpy = vi.spyOn(mockApi, 'findAssetInfoOrThrow')
  const findNativeAssetInfoOrThrowSpy = vi.spyOn(mockApi, 'findNativeAssetInfoOrThrow')

  // eslint-disable-next-line @typescript-eslint/require-await
  const buildTx = vi.fn(async () => ({}))

  const baseOptions = {
    api: mockApi,
    sender: 'validAddress',
    origin: 'Astar',
    destination: 'BifrostPolkadot',
    currency: { symbol: 'DOT', amount: 1000n },
    version: Version.V5,
    buildTx
  } as TGetTransferableAmountOptions<unknown, unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(abstractDecimals).mockImplementation(amount => BigInt(amount))
    buildTx.mockClear()
  })

  test('subtracts XCM fee for native asset', async () => {
    const balance = 1000n
    const ed = 100n
    const fee = 200n

    findAssetInfoOrThrowSpy.mockReturnValue({
      symbol: 'DOT',
      decimals: 10
    } as TAssetInfo)
    findNativeAssetInfoOrThrowSpy.mockReturnValue({ symbol: 'DOT' } as TAssetInfo)
    vi.mocked(getEdFromAssetOrThrow).mockReturnValue(ed)
    vi.mocked(isAssetEqual).mockReturnValue(true)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(balance)
    vi.mocked(getOriginXcmFee).mockResolvedValue({ fee } as TXcmFeeDetail)

    const result = await getTransferableAmount(baseOptions)

    expect(result).toBe(balance - ed - fee)
    expect(getOriginXcmFee).toHaveBeenCalledWith({
      api: mockApi,
      buildTx,
      origin: 'Astar',
      destination: 'Astar',
      sender: 'validAddress',
      feeAsset: undefined,
      version: baseOptions.version,
      currency: { symbol: 'DOT', amount: 1000n },
      disableFallback: false
    })
  })

  test('does not subtract XCM fee for non-native asset', async () => {
    const balance = 1000n
    const ed = 100n

    findAssetInfoOrThrowSpy.mockReturnValue({
      symbol: 'USDT',
      decimals: 6
    } as TAssetInfo)
    findNativeAssetInfoOrThrowSpy.mockReturnValue({ symbol: 'DOT' } as TAssetInfo)
    vi.mocked(getEdFromAssetOrThrow).mockReturnValue(ed)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(balance)

    const result = await getTransferableAmount({
      ...baseOptions,
      currency: { symbol: 'USDT', amount: 1000n }
    })

    expect(result).toBe(balance - ed)
    expect(getOriginXcmFee).not.toHaveBeenCalled()
  })

  test('returns 0 when transferable amount is negative', async () => {
    const balance = 250n
    const ed = 100n
    const fee = 200n

    findAssetInfoOrThrowSpy.mockReturnValue({
      symbol: 'DOT',
      decimals: 10
    } as TAssetInfo)
    findNativeAssetInfoOrThrowSpy.mockReturnValue({ symbol: 'DOT' } as TAssetInfo)
    vi.mocked(getEdFromAssetOrThrow).mockReturnValue(ed)
    vi.mocked(isAssetEqual).mockReturnValue(true)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(balance)
    vi.mocked(getOriginXcmFee).mockResolvedValue({ fee } as TXcmFeeDetail)

    const result = await getTransferableAmount(baseOptions)
    expect(result).toBe(0n)
  })

  test('does not subtract the fee when the selected fee asset does not pay the origin fee', async () => {
    const balance = 1000n
    const ed = 100n
    const dot = { symbol: 'DOT', decimals: 10 } as TAssetInfo

    findAssetInfoOrThrowSpy.mockReturnValue(dot)
    findNativeAssetInfoOrThrowSpy.mockReturnValue({ symbol: 'DOTON' } as TAssetInfo)
    vi.mocked(resolveFeeAsset).mockReturnValue(dot)
    vi.mocked(isAssetEqual).mockImplementation((a, b) => a.symbol === b.symbol)
    vi.mocked(getEdFromAssetOrThrow).mockReturnValue(ed)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(balance)
    vi.mocked(getOriginXcmFee).mockResolvedValue({
      fee: 200n,
      asset: { symbol: 'DOTON' }
    } as TXcmFeeDetail)

    const result = await getTransferableAmount({ ...baseOptions, feeAsset: { symbol: 'DOT' } })

    expect(result).toBe(balance - ed)
    expect(getOriginXcmFee).toHaveBeenCalledWith(
      expect.objectContaining({ feeAsset: { symbol: 'DOT' } })
    )
  })

  test('subtracts the fee for native asset paid in native when a fee asset is selected', async () => {
    const balance = 1000n
    const ed = 100n
    const fee = 200n
    const doton = { symbol: 'DOTON', decimals: 18 } as TAssetInfo

    findAssetInfoOrThrowSpy.mockReturnValue(doton)
    findNativeAssetInfoOrThrowSpy.mockReturnValue(doton)
    vi.mocked(resolveFeeAsset).mockReturnValue({ symbol: 'DOT' } as TAssetInfo)
    vi.mocked(isAssetEqual).mockImplementation((a, b) => a.symbol === b.symbol)
    vi.mocked(getEdFromAssetOrThrow).mockReturnValue(ed)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(balance)
    vi.mocked(getOriginXcmFee).mockResolvedValue({ fee, asset: doton } as TXcmFeeDetail)

    const result = await getTransferableAmount({
      ...baseOptions,
      currency: { symbol: 'DOTON', amount: 1000n },
      feeAsset: { symbol: 'DOT' }
    })

    expect(result).toBe(balance - ed - fee)
  })

  test('throws error when XCM fee is undefined for native asset', async () => {
    findAssetInfoOrThrowSpy.mockReturnValue({
      symbol: 'DOT',
      decimals: 10
    } as TAssetInfo)
    findNativeAssetInfoOrThrowSpy.mockReturnValue({ symbol: 'DOT' } as TAssetInfo)
    vi.mocked(getEdFromAssetOrThrow).mockReturnValue(100n)
    vi.mocked(isAssetEqual).mockReturnValue(true)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(1000n)
    vi.mocked(getOriginXcmFee).mockResolvedValue({ fee: undefined } as TXcmFeeDetail)

    await expect(getTransferableAmount(baseOptions)).rejects.toThrow(
      'Cannot get origin xcm fee for currency {"symbol":"DOT","amount":"1000"} on chain Astar.'
    )
  })

  const usdt = {
    symbol: 'USDT',
    decimals: 6,
    amount: 1000n,
    isFeeAsset: true
  } as WithAmount<TAssetInfo>

  const usdc = {
    symbol: 'USDC',
    decimals: 6,
    amount: 2000n,
    isFeeAsset: false
  } as WithAmount<TAssetInfo>

  const currenciesOptions = {
    ...baseOptions,
    feeAsset: { symbol: 'USDT' },
    currency: [
      { symbol: 'USDT', amount: 1000n },
      { symbol: 'USDC', amount: 2000n }
    ]
  }

  const mockResolvedAssets = (assets: WithAmount<TAssetInfo>[]) => {
    vi.mocked(resolveFeeAsset).mockReturnValue(usdt)
    vi.mocked(resolveCurrency).mockReturnValue({ assets, asset: usdt })
    vi.mocked(isAssetEqual).mockImplementation((a, b) => a.symbol === b.symbol)
  }

  test('returns per-asset transferable amounts in input order for currency arrays', async () => {
    const fee = 200n
    const ed = 100n

    mockResolvedAssets([usdt, usdc])
    vi.mocked(getEdFromAssetOrThrow).mockReturnValue(ed)
    vi.mocked(getAssetBalanceInternal).mockResolvedValueOnce(1000n).mockResolvedValueOnce(500n)
    vi.mocked(getOriginXcmFee).mockResolvedValue({
      fee,
      asset: { symbol: 'USDT' }
    } as TXcmFeeDetail)

    const result = await getTransferableAmount(currenciesOptions)

    expect(result).toEqual([1000n - ed - fee, 500n - ed])
    expect(getOriginXcmFee).toHaveBeenCalledWith(
      expect.objectContaining({ currency: currenciesOptions.currency })
    )
  })

  test('returns 0 for array elements with negative transferable amounts', async () => {
    mockResolvedAssets([usdt, usdc])
    vi.mocked(getEdFromAssetOrThrow).mockReturnValue(100n)
    vi.mocked(getAssetBalanceInternal).mockResolvedValueOnce(250n).mockResolvedValueOnce(500n)
    vi.mocked(getOriginXcmFee).mockResolvedValue({
      fee: 200n,
      asset: { symbol: 'USDT' }
    } as TXcmFeeDetail)

    const result = await getTransferableAmount(currenciesOptions)

    expect(result).toEqual([0n, 400n])
  })

  test('does not subtract origin fee from any element when it is paid in an asset outside the array', async () => {
    const ed = 100n

    mockResolvedAssets([usdt, usdc])
    vi.mocked(getEdFromAssetOrThrow).mockReturnValue(ed)
    vi.mocked(getAssetBalanceInternal).mockResolvedValueOnce(1000n).mockResolvedValueOnce(500n)
    vi.mocked(getOriginXcmFee).mockResolvedValue({
      fee: 200n,
      asset: { symbol: 'DOTON' }
    } as TXcmFeeDetail)

    const result = await getTransferableAmount(currenciesOptions)

    expect(result).toEqual([1000n - ed, 500n - ed])
  })

  test('subtracts origin fee from the element it is paid in even when it is not the fee element', async () => {
    const fee = 200n
    const ed = 100n

    mockResolvedAssets([usdt, usdc])
    vi.mocked(getEdFromAssetOrThrow).mockReturnValue(ed)
    vi.mocked(getAssetBalanceInternal).mockResolvedValueOnce(1000n).mockResolvedValueOnce(500n)
    vi.mocked(getOriginXcmFee).mockResolvedValue({
      fee,
      asset: { symbol: 'USDC' }
    } as TXcmFeeDetail)

    const result = await getTransferableAmount(currenciesOptions)

    expect(result).toEqual([1000n - ed, 500n - ed - fee])
  })

  test('throws error when XCM fee is undefined for currency arrays', async () => {
    mockResolvedAssets([usdt])
    vi.mocked(getOriginXcmFee).mockResolvedValue({ fee: undefined } as TXcmFeeDetail)

    await expect(getTransferableAmount(currenciesOptions)).rejects.toThrow(
      'Cannot get origin xcm fee for currency'
    )
  })

  test('sets disconnect allowed to false and disconnects after', async () => {
    findAssetInfoOrThrowSpy.mockReturnValue({
      symbol: 'DOT',
      decimals: 10
    } as TAssetInfo)
    findNativeAssetInfoOrThrowSpy.mockReturnValue({ symbol: 'DOT' } as TAssetInfo)
    vi.mocked(getEdFromAssetOrThrow).mockReturnValue(100n)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(1000n)
    vi.mocked(getOriginXcmFee).mockResolvedValue({ fee: 100n } as TXcmFeeDetail)

    const disconnectAllowedSpy = vi.spyOn(mockApi, 'disconnectAllowed', 'set')
    const disconnectSpy = vi.spyOn(mockApi, 'disconnect')

    await getTransferableAmount(baseOptions)

    expect(disconnectAllowedSpy).toHaveBeenNthCalledWith(1, false)
    expect(disconnectAllowedSpy).toHaveBeenNthCalledWith(2, true)
    expect(disconnectSpy).toHaveBeenCalled()
  })

  test('disconnects even if internal function throws', async () => {
    findAssetInfoOrThrowSpy.mockReturnValue({
      symbol: 'DOT',
      decimals: 10
    } as TAssetInfo)
    findNativeAssetInfoOrThrowSpy.mockReturnValue({ symbol: 'DOT' } as TAssetInfo)
    vi.mocked(getEdFromAssetOrThrow).mockReturnValue(100n)
    vi.mocked(isAssetEqual).mockReturnValue(true)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(1000n)
    vi.mocked(getOriginXcmFee).mockResolvedValue({ fee: undefined } as TXcmFeeDetail)

    const disconnectAllowedSpy = vi.spyOn(mockApi, 'disconnectAllowed', 'set')
    const disconnectSpy = vi.spyOn(mockApi, 'disconnect')

    await expect(getTransferableAmount(baseOptions)).rejects.toThrow()

    expect(disconnectAllowedSpy).toHaveBeenNthCalledWith(1, false)
    expect(disconnectAllowedSpy).toHaveBeenNthCalledWith(2, true)
    expect(disconnectSpy).toHaveBeenCalled()
  })
})
