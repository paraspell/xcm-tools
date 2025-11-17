import type { TAssetInfo, TCurrencyCore, WithAmount } from '@paraspell/assets'
import { findAssetOnDestOrThrow, getNativeAssetSymbol } from '@paraspell/assets'
import type { TLocation } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { getAssetBalanceInternal, getBalanceNative } from '../../balance'
import { UnableToComputeError } from '../../errors'
import type { TBuildDestInfoOptions, TXcmFeeDetail } from '../../types'
import { buildDestInfo } from './buildDestInfo'

vi.mock('@paraspell/assets', async importActual => ({
  ...(await importActual()),
  getNativeAssetSymbol: vi.fn(),
  findAssetOnDestOrThrow: vi.fn()
}))

vi.mock('../../../errors')
vi.mock('../../balance')
vi.mock('../../pallets/assets/balance')

describe('buildDestInfo', () => {
  let mockApi: IPolkadotApi<unknown, unknown>
  let mockClonedApi: IPolkadotApi<unknown, unknown>
  let baseOptions: TBuildDestInfoOptions<unknown, unknown>

  const DEFAULT_ED = '1000000000'
  const DEFAULT_BALANCE = 50000000000n
  const DEFAULT_FEE = 100000000n
  const DEFAULT_AMOUNT = 20000000000n
  const LOCATION: TLocation = { parents: 0, interior: { X1: { PalletInstance: 50 } } }

  const asset = {
    symbol: 'GLMR',
    assetId: 'glmrid',
    decimals: 18,
    location: LOCATION,
    existentialDeposit: DEFAULT_ED
  } as TAssetInfo

  beforeEach(() => {
    vi.clearAllMocks()

    mockClonedApi = {
      init: vi.fn().mockResolvedValue(undefined),
      clone: vi.fn()
    } as unknown as IPolkadotApi<unknown, unknown>

    mockApi = {
      clone: vi.fn().mockReturnValue(mockClonedApi)
    } as unknown as IPolkadotApi<unknown, unknown>

    vi.mocked(findAssetOnDestOrThrow).mockReturnValue(asset)

    baseOptions = {
      api: mockApi,
      origin: 'AssetHubPolkadot',
      destination: 'Moonbeam',
      address: 'receiverAlice',
      currency: { symbol: 'GLMR', amount: DEFAULT_AMOUNT },
      originFee: 50000000n,
      isFeeAssetAh: false,
      destFeeDetail: {
        fee: DEFAULT_FEE,
        currency: 'GLMR',
        asset: {
          symbol: 'GLMR'
        }
      } as TXcmFeeDetail,
      totalHopFee: 0n,
      bridgeFee: undefined
    }

    vi.mocked(getNativeAssetSymbol).mockImplementation(chain => {
      if (chain === 'AssetHubPolkadot') return 'DOT'
      if (chain === 'AssetHubKusama') return 'KSM'
      if (chain === 'Moonbeam') return 'GLMR'
      if (chain === 'Ethereum') return 'ETH'
      return 'NATIVE'
    })
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(DEFAULT_BALANCE)
    vi.mocked(getBalanceNative).mockResolvedValue(DEFAULT_BALANCE)
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
      chain: options.destination,
      asset
    })

    expect(result.receivedCurrency.currencySymbol).toBe('GLMR')
    expect(result.receivedCurrency.balance).toBe(DEFAULT_BALANCE)
    expect(result.receivedCurrency.existentialDeposit).toBe(BigInt(DEFAULT_ED))
    expect(result.receivedCurrency.sufficient).toBe(true)
    const expectedReceived = DEFAULT_AMOUNT - DEFAULT_FEE
    expect(result.receivedCurrency.receivedAmount).toBe(expectedReceived)
    expect(result.receivedCurrency.balanceAfter).toBe(
      DEFAULT_BALANCE - DEFAULT_FEE + BigInt(DEFAULT_AMOUNT)
    )

    expect(result.xcmFee.currencySymbol).toBe('GLMR')
    expect(result.xcmFee.fee).toBe(DEFAULT_FEE)
    expect(result.xcmFee.balance).toBe(DEFAULT_BALANCE)
    expect(result.xcmFee.balanceAfter).toBe(DEFAULT_BALANCE - DEFAULT_FEE + DEFAULT_AMOUNT)
  })

  it('should return UnableToComputeError if fee currency is different and not Ethereum', async () => {
    const options = {
      ...baseOptions,
      api: mockApi,
      destFeeDetail: {
        fee: DEFAULT_FEE,
        currency: 'OTHER',
        asset: { symbol: 'OTHER' }
      } as TXcmFeeDetail
    }
    const result = await buildDestInfo(options)
    expect(result.receivedCurrency.sufficient).toBeInstanceOf(UnableToComputeError)
    expect(result.receivedCurrency.balanceAfter).toBeInstanceOf(UnableToComputeError)
    expect(result.receivedCurrency.receivedAmount).toBeInstanceOf(UnableToComputeError)
  })

  it('should adjust destAmount if isFeeAssetAh is true', async () => {
    const options = { ...baseOptions, api: mockApi, isFeeAssetAh: true }
    const expectedDestAmount = options.currency.amount - options.originFee
    const result = await buildDestInfo(options)
    const expectedReceived = expectedDestAmount - (options.destFeeDetail.fee as bigint)
    expect(result.receivedCurrency.receivedAmount).toBe(expectedReceived)
  })

  describe('AssetHub to AssetHub routes', () => {
    const ahToAhBase = {
      ...baseOptions,
      api: mockApi,
      origin: 'AssetHubPolkadot',
      destination: 'AssetHubKusama'
    } as TBuildDestInfoOptions<unknown, unknown>

    it('calculates receivedAmount for native asset transfer with bridgeFee', async () => {
      vi.mocked(findAssetOnDestOrThrow).mockReturnValue({
        symbol: 'DOT',
        assetId: 'dotAssetId',
        decimals: 10,
        location: LOCATION,
        existentialDeposit: DEFAULT_ED
      } as TAssetInfo)
      vi.mocked(getNativeAssetSymbol).mockImplementation(chain => {
        if (chain === ahToAhBase.origin) return 'DOT'
        return 'KSM'
      })
      const options = {
        ...ahToAhBase,
        api: mockApi,
        originFee: 50000000n,
        totalHopFee: 0n,
        destFeeDetail: {
          fee: DEFAULT_FEE,
          currency: 'DOT',
          asset: { symbol: 'DOT' }
        } as TXcmFeeDetail,
        currency: { symbol: 'DOT', amount: DEFAULT_AMOUNT } as WithAmount<TCurrencyCore>,
        bridgeFee: 30000000n
      }
      const result = await buildDestInfo(options)
      const expectedReceived = options.currency.amount - options.originFee - options.bridgeFee
      expect(result.receivedCurrency.receivedAmount).toBe(expectedReceived)
    })

    it('returns UnableToComputeError for native asset transfer if bridgeFee is missing', async () => {
      vi.mocked(findAssetOnDestOrThrow).mockReturnValue({
        symbol: 'DOT',
        assetId: 'dotAssetId',
        decimals: 10,
        location: LOCATION,
        existentialDeposit: DEFAULT_ED
      } as TAssetInfo)
      vi.mocked(getNativeAssetSymbol).mockImplementation(chain => {
        if (chain === ahToAhBase.origin) return 'DOT'
        return 'KSM'
      })
      const options = {
        ...ahToAhBase,
        api: mockApi,
        destFeeDetail: {
          fee: DEFAULT_FEE,
          currency: 'DOT',
          asset: { symbol: 'DOT' }
        } as TXcmFeeDetail,
        totalHopFee: 0n,
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
        location: LOCATION,
        existentialDeposit: DEFAULT_ED
      } as TAssetInfo)
      vi.mocked(getNativeAssetSymbol).mockImplementation(chain => {
        if (chain === ahToAhBase.origin) return 'DOT'
        return 'KSM'
      })
      const options = {
        ...ahToAhBase,
        api: mockApi,
        destFeeDetail: {
          fee: DEFAULT_FEE,
          currency: 'USDT',
          asset: { symbol: 'USDT' }
        } as TXcmFeeDetail,
        totalHopFee: 0n,
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
      location: LOCATION,
      existentialDeposit: DEFAULT_ED
    } as TAssetInfo)
    const options = {
      ...baseOptions,
      api: mockApi,
      destFeeDetail: {
        fee: DEFAULT_FEE,
        currency: 'USDT',
        asset: { symbol: 'USDT' }
      } as TXcmFeeDetail,
      currency: {
        symbol: 'USDT',
        amount: DEFAULT_AMOUNT,
        asset: { symbol: 'USDT' }
      } as WithAmount<TCurrencyCore>
    }

    vi.mocked(getAssetBalanceInternal).mockResolvedValue(DEFAULT_BALANCE)

    const result = await buildDestInfo(options)

    expect(getNativeAssetSymbol).toHaveBeenCalledWith(options.destination)
    expect(getBalanceNative).not.toHaveBeenCalled()
    expect(result.xcmFee.balance).toBe(DEFAULT_BALANCE)
    expect(result.xcmFee.balanceAfter).toBe(DEFAULT_BALANCE - DEFAULT_FEE + DEFAULT_AMOUNT)
  })

  it('should handle destBalance < edDestBn correctly in sufficiency check', async () => {
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(BigInt(DEFAULT_ED) / 2n)
    const options = { ...baseOptions, api: mockApi }
    const result = await buildDestInfo(options)

    const destAmount = options.currency.amount
    const expectedSufficient =
      destAmount - (options.destFeeDetail.fee as bigint) > BigInt(DEFAULT_ED)
    expect(result.receivedCurrency.sufficient).toBe(expectedSufficient)
  })

  it('should use destAsset.symbol if location is not present for getExistentialDeposit call', async () => {
    const asset = {
      symbol: 'CFG',
      assetId: 'cfgId',
      decimals: 18,
      existentialDeposit: DEFAULT_ED
    } as TAssetInfo
    vi.mocked(findAssetOnDestOrThrow).mockReturnValue(asset)
    const options = {
      ...baseOptions,
      api: mockApi
    }
    await buildDestInfo(options)
    expect(getAssetBalanceInternal).toHaveBeenCalledWith(expect.objectContaining({ asset }))
  })

  it('should correctly calculate destXcmFeeBalanceAfter when isFeeAssetAh is true', async () => {
    const options = {
      ...baseOptions,
      api: mockApi,
      isFeeAssetAh: true,
      destFeeDetail: {
        fee: DEFAULT_FEE,
        currency: 'GLMR',
        asset: { symbol: 'GLMR' }
      } as TXcmFeeDetail
    }

    const expectedDestAmount = options.currency.amount - options.originFee
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
      destFeeDetail: {
        fee: DEFAULT_FEE,
        currency: 'SOME_OTHER_FEE_TOKEN',
        asset: {
          symbol: 'SOME_OTHER_FEE_TOKEN'
        }
      } as TXcmFeeDetail
    }
    const nativeBalanceForFee = 70000000000n
    vi.mocked(getNativeAssetSymbol).mockImplementation(chain =>
      chain === options.destination ? 'SOME_OTHER_FEE_TOKEN' : 'NATIVE'
    )
    vi.mocked(getBalanceNative).mockResolvedValue(nativeBalanceForFee)

    const result = await buildDestInfo(options)
    const expectedFeeBalanceAfter = nativeBalanceForFee - (options.destFeeDetail.fee ?? 0n)
    expect(result.xcmFee.balanceAfter).toBe(expectedFeeBalanceAfter)
  })
})
