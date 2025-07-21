import type { TAsset, TCurrencyCore, WithAmount } from '@paraspell/assets'
import { findAssetOnDestOrThrow, getNativeAssetSymbol } from '@paraspell/assets'
import { type TNodeDotKsmWithRelayChains, type TNodeWithRelayChains } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../../api'
import { InvalidParameterError, UnableToComputeError } from '../../../errors'
import type { TXcmFeeDetail } from '../../../types'
import { getAssetBalanceInternal, getBalanceNativeInternal } from '../balance'
import type { TBuildDestInfoOptions } from './buildDestInfo'
import { buildDestInfo } from './buildDestInfo'

vi.mock('@paraspell/assets', async () => {
  const actual = await import('@paraspell/assets')
  return {
    ...actual,
    getNativeAssetSymbol: vi.fn(),
    findAssetOnDestOrThrow: vi.fn()
  }
})

vi.mock('../../../errors', () => ({
  InvalidParameterError: class extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'InvalidParameterError'
    }
  },
  UnableToComputeError: class extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'UnableToComputeError'
    }
  }
}))

vi.mock('../balance', () => ({
  getAssetBalanceInternal: vi.fn(),
  getBalanceNativeInternal: vi.fn()
}))

describe('buildDestInfo', () => {
  let mockApi: IPolkadotApi<unknown, unknown>
  let mockClonedApi: IPolkadotApi<unknown, unknown>
  let baseOptions: TBuildDestInfoOptions<unknown, unknown>

  const DEFAULT_ED = '1000000000'
  const DEFAULT_BALANCE = 50000000000n
  const DEFAULT_FEE = 100000000n
  const DEFAULT_AMOUNT = 20000000000n
  const MULTILOCATION = { parents: 0, interior: { X1: { PalletInstance: 50 } } }

  beforeEach(() => {
    vi.clearAllMocks()

    mockClonedApi = {
      init: vi.fn().mockResolvedValue(undefined),
      clone: vi.fn()
    } as unknown as IPolkadotApi<unknown, unknown>

    mockApi = {
      clone: vi.fn().mockReturnValue(mockClonedApi)
    } as unknown as IPolkadotApi<unknown, unknown>

    vi.mocked(findAssetOnDestOrThrow).mockReturnValue({
      symbol: 'GLMR',
      assetId: 'glmrid',
      decimals: 18,
      multiLocation: MULTILOCATION,
      existentialDeposit: DEFAULT_ED
    } as TAsset)

    baseOptions = {
      api: mockApi,
      origin: 'AssetHubPolkadot' as TNodeDotKsmWithRelayChains,
      destination: 'Moonbeam' as TNodeWithRelayChains,
      address: 'receiverAlice',
      currency: { symbol: 'GLMR', amount: DEFAULT_AMOUNT } as WithAmount<TCurrencyCore>,
      originFee: 50000000n,
      isFeeAssetAh: false,
      destFeeDetail: { fee: DEFAULT_FEE, currency: 'GLMR' } as TXcmFeeDetail,
      assetHubFee: undefined,
      bridgeFee: undefined
    }

    vi.mocked(getNativeAssetSymbol).mockImplementation(node => {
      if (node === 'AssetHubPolkadot') return 'DOT'
      if (node === 'AssetHubKusama') return 'KSM'
      if (node === 'Moonbeam') return 'GLMR'
      if (node === 'Ethereum') return 'ETH'
      return 'NATIVE'
    })
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(DEFAULT_BALANCE)
    vi.mocked(getBalanceNativeInternal).mockResolvedValue(DEFAULT_BALANCE)
  })

  it('should successfully build dest info', async () => {
    const options = { ...baseOptions, api: mockApi }

    const cloneSpy = vi.spyOn(mockApi, 'clone')
    const clonedCloneSpy = vi.spyOn(mockClonedApi, 'init')

    const result = await buildDestInfo(options)

    expect(cloneSpy).toHaveBeenCalled()
    expect(clonedCloneSpy).toHaveBeenCalledWith(options.destination)
    expect(findAssetOnDestOrThrow).toHaveBeenCalledWith(
      options.origin,
      options.destination,
      options.currency
    )

    expect(getAssetBalanceInternal).toHaveBeenCalledWith({
      api: mockClonedApi,
      address: options.address,
      node: options.destination,
      currency: { multilocation: MULTILOCATION }
    })

    expect(result.receivedCurrency.currencySymbol).toBe('GLMR')
    expect(result.receivedCurrency.balance).toBe(DEFAULT_BALANCE)
    expect(result.receivedCurrency.existentialDeposit).toBe(BigInt(DEFAULT_ED))
    expect(result.receivedCurrency.sufficient).toBe(true)
    const expectedReceived = BigInt(DEFAULT_AMOUNT) - DEFAULT_FEE
    expect(result.receivedCurrency.receivedAmount).toBe(expectedReceived)
    expect(result.receivedCurrency.balanceAfter).toBe(
      DEFAULT_BALANCE - DEFAULT_FEE + BigInt(DEFAULT_AMOUNT)
    )

    expect(result.xcmFee.currencySymbol).toBe('GLMR')
    expect(result.xcmFee.fee).toBe(DEFAULT_FEE)
    expect(result.xcmFee.balance).toBe(DEFAULT_BALANCE)
    expect(result.xcmFee.balanceAfter).toBe(DEFAULT_BALANCE - DEFAULT_FEE + BigInt(DEFAULT_AMOUNT))
  })

  it('should throw InvalidParameterError if ED is not found', async () => {
    vi.mocked(findAssetOnDestOrThrow).mockReturnValue({
      symbol: 'GLMR',
      assetId: 'glmrid',
      decimals: 18,
      multiLocation: MULTILOCATION,
      existentialDeposit: undefined // No ED
    } as TAsset)
    const options = { ...baseOptions, api: mockApi }
    await expect(buildDestInfo(options)).rejects.toThrow(InvalidParameterError)
  })

  it('should return UnableToComputeError if fee currency is different and not Ethereum', async () => {
    const options = {
      ...baseOptions,
      api: mockApi,
      destFeeDetail: { fee: DEFAULT_FEE, currency: 'OTHER' } as TXcmFeeDetail
    }
    const result = await buildDestInfo(options)
    expect(result.receivedCurrency.sufficient).toBeInstanceOf(UnableToComputeError)
    expect(result.receivedCurrency.balanceAfter).toBeInstanceOf(UnableToComputeError)
    expect(result.receivedCurrency.receivedAmount).toBeInstanceOf(UnableToComputeError)
  })

  it('should adjust destAmount if isFeeAssetAh is true', async () => {
    const options = { ...baseOptions, api: mockApi, isFeeAssetAh: true }
    const expectedDestAmount = BigInt(options.currency.amount) - options.originFee
    const result = await buildDestInfo(options)
    const expectedReceived = expectedDestAmount - (options.destFeeDetail.fee as bigint)
    expect(result.receivedCurrency.receivedAmount).toBe(expectedReceived)
  })

  describe('AssetHub to AssetHub routes', () => {
    const ahToAhBase = {
      ...baseOptions,
      api: mockApi,
      origin: 'AssetHubPolkadot' as TNodeDotKsmWithRelayChains,
      destination: 'AssetHubKusama' as TNodeWithRelayChains
    }

    it('calculates receivedAmount for native asset transfer with bridgeFee', async () => {
      vi.mocked(findAssetOnDestOrThrow).mockReturnValue({
        symbol: 'DOT',
        assetId: 'dotAssetId',
        decimals: 10,
        multiLocation: MULTILOCATION,
        existentialDeposit: DEFAULT_ED
      } as TAsset)
      vi.mocked(getNativeAssetSymbol).mockImplementation(node => {
        if (node === ahToAhBase.origin) return 'DOT'
        return 'KSM'
      })
      const options = {
        ...ahToAhBase,
        api: mockApi,
        originFee: 50000000n,
        destFeeDetail: { fee: DEFAULT_FEE, currency: 'DOT' } as TXcmFeeDetail,
        currency: { symbol: 'DOT', amount: DEFAULT_AMOUNT } as WithAmount<TCurrencyCore>,
        bridgeFee: 30000000n
      }
      const result = await buildDestInfo(options)
      const expectedReceived =
        BigInt(options.currency.amount) - options.originFee - options.bridgeFee
      expect(result.receivedCurrency.receivedAmount).toBe(expectedReceived)
    })

    it('returns UnableToComputeError for native asset transfer if bridgeFee is missing', async () => {
      vi.mocked(findAssetOnDestOrThrow).mockReturnValue({
        symbol: 'DOT',
        assetId: 'dotAssetId',
        decimals: 10,
        multiLocation: MULTILOCATION,
        existentialDeposit: DEFAULT_ED
      } as TAsset)
      vi.mocked(getNativeAssetSymbol).mockImplementation(node => {
        if (node === ahToAhBase.origin) return 'DOT'
        return 'KSM'
      })
      const options = {
        ...ahToAhBase,
        api: mockApi,
        destFeeDetail: { fee: DEFAULT_FEE, currency: 'DOT' } as TXcmFeeDetail,
        currency: { symbol: 'DOT', amount: DEFAULT_AMOUNT } as WithAmount<TCurrencyCore>,
        bridgeFee: undefined
      }
      const result = await buildDestInfo(options)
      expect(result.receivedCurrency.receivedAmount).toBeInstanceOf(UnableToComputeError)
      expect(result.receivedCurrency.receivedAmount).toHaveProperty(
        'message',
        `bridgeFee is required for native asset transfer from ${options.origin} to ${options.destination} but was not provided.`
      )
    })

    it('returns UnableToComputeError for non-native asset transfer on AH to AH route', async () => {
      vi.mocked(findAssetOnDestOrThrow).mockReturnValue({
        symbol: 'USDT',
        assetId: 'usdtAssetId',
        decimals: 6,
        multiLocation: MULTILOCATION,
        existentialDeposit: DEFAULT_ED
      } as TAsset)
      vi.mocked(getNativeAssetSymbol).mockImplementation(node => {
        if (node === ahToAhBase.origin) return 'DOT'
        return 'KSM'
      })
      const options = {
        ...ahToAhBase,
        api: mockApi,
        destFeeDetail: { fee: DEFAULT_FEE, currency: 'USDT' } as TXcmFeeDetail,
        currency: { symbol: 'USDT', amount: DEFAULT_AMOUNT } as WithAmount<TCurrencyCore>
      }
      const result = await buildDestInfo(options)
      expect(result.receivedCurrency.receivedAmount).toBeInstanceOf(UnableToComputeError)
      expect(result.receivedCurrency.receivedAmount).toHaveProperty(
        'message',
        `Unable to compute received amount: The transferred asset (USDT) is not the native asset (DOT) of origin ${options.origin} for the ${options.origin}->${options.destination} route.`
      )
    })
  })

  it('should use destBalance for XCM fee balance if fee is not in native currency', async () => {
    vi.mocked(findAssetOnDestOrThrow).mockReturnValue({
      symbol: 'USDT',
      assetId: 'usdtId',
      decimals: 6,
      multiLocation: MULTILOCATION,
      existentialDeposit: DEFAULT_ED
    } as TAsset)
    const options = {
      ...baseOptions,
      api: mockApi,
      destFeeDetail: { fee: DEFAULT_FEE, currency: 'USDT' } as TXcmFeeDetail,
      currency: { symbol: 'USDT', amount: DEFAULT_AMOUNT } as WithAmount<TCurrencyCore>
    }

    vi.mocked(getAssetBalanceInternal).mockResolvedValue(DEFAULT_BALANCE)

    const result = await buildDestInfo(options)

    expect(getNativeAssetSymbol).toHaveBeenCalledWith(options.destination)
    expect(getBalanceNativeInternal).not.toHaveBeenCalled()
    expect(result.xcmFee.balance).toBe(DEFAULT_BALANCE)
    expect(result.xcmFee.balanceAfter).toBe(DEFAULT_BALANCE - DEFAULT_FEE + BigInt(DEFAULT_AMOUNT))
  })

  it('should handle destBalance < edDestBn correctly in sufficiency check', async () => {
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(BigInt(DEFAULT_ED) / 2n)
    const options = { ...baseOptions, api: mockApi }
    const result = await buildDestInfo(options)

    const destAmount = BigInt(options.currency.amount)
    const expectedSufficient =
      destAmount - (options.destFeeDetail.fee as bigint) > BigInt(DEFAULT_ED)
    expect(result.receivedCurrency.sufficient).toBe(expectedSufficient)
  })

  it('should use destAsset.symbol if multiLocation is not present for getExistentialDeposit call', async () => {
    vi.mocked(findAssetOnDestOrThrow).mockReturnValue({
      symbol: 'CFG',
      assetId: 'cfgId',
      decimals: 18,
      existentialDeposit: DEFAULT_ED
    } as TAsset)
    const options = {
      ...baseOptions,
      api: mockApi
    }
    await buildDestInfo(options)
    expect(getAssetBalanceInternal).toHaveBeenCalledWith(
      expect.objectContaining({ currency: { symbol: 'CFG' } })
    )
  })

  it('should correctly calculate destXcmFeeBalanceAfter when isFeeAssetAh is true', async () => {
    const options = {
      ...baseOptions,
      api: mockApi,
      isFeeAssetAh: true,
      destFeeDetail: { fee: DEFAULT_FEE, currency: 'GLMR' } as TXcmFeeDetail
    }

    const expectedDestAmount = BigInt(options.currency.amount) - options.originFee
    const expectedDestBalanceAfter =
      DEFAULT_BALANCE - (options.destFeeDetail.fee ?? 0n) + expectedDestAmount

    const result = await buildDestInfo(options)
    expect(result.xcmFee.balanceAfter).toBe(expectedDestBalanceAfter)
  })

  it('should correctly calculate destXcmFeeBalanceAfter when isFeeAssetAh is false and fee currency differs from asset currency', async () => {
    const options = {
      ...baseOptions,
      api: mockApi,
      isFeeAssetAh: false,
      destFeeDetail: { fee: DEFAULT_FEE, currency: 'SOME_OTHER_FEE_TOKEN' } as TXcmFeeDetail
    }
    const nativeBalanceForFee = 70000000000n
    vi.mocked(getNativeAssetSymbol).mockImplementation(node =>
      node === options.destination ? 'SOME_OTHER_FEE_TOKEN' : 'NATIVE'
    )
    vi.mocked(getBalanceNativeInternal).mockResolvedValue(nativeBalanceForFee)

    const result = await buildDestInfo(options)
    const expectedFeeBalanceAfter = nativeBalanceForFee - (options.destFeeDetail.fee ?? 0n)
    expect(result.xcmFee.balanceAfter).toBe(expectedFeeBalanceAfter)
  })
})
