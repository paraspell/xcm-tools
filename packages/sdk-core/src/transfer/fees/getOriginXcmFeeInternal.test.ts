import type { TAssetInfo, TCurrencyCore, WithAmount } from '@paraspell/assets'
import { getNativeAssetSymbol, isAssetEqual } from '@paraspell/assets'
import type { TLocation } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import type { TDryRunChainResult, TGetOriginXcmFeeInternalOptions } from '../../types'
import { abstractDecimals } from '../../utils'
import { padFee } from '../../utils/fees'
import { getOriginXcmFeeInternal } from './getOriginXcmFeeInternal'
import { isSufficientOrigin } from './isSufficient'

vi.mock('@paraspell/assets')
vi.mock('../../utils/fees')
vi.mock('./isSufficient')
vi.mock('../../utils')

describe('getOriginXcmFeeInternal', () => {
  const mockSymbol = 'TOKEN'
  const location: TLocation = {
    parents: 1,
    interior: {
      X1: [{ Parachain: 1000 }]
    }
  }
  const mockCurrency = { symbol: mockSymbol, amount: 1000n } as WithAmount<TCurrencyCore>
  const mockAsset: TAssetInfo = {
    symbol: 'USDT',
    decimals: 6,
    isNative: true,
    location: location
  }
  const nativeAsset = { symbol: 'DOT', decimals: 10, isNative: true, location }
  const mockTx = {}

  const api = {
    getPaymentInfo: vi.fn(),
    getDryRunCall: vi.fn(),
    init: vi.fn(),
    findAssetInfo: vi.fn(),
    findAssetInfoOrThrow: vi.fn(),
    findNativeAssetInfoOrThrow: vi.fn(),
    hasDryRunSupport: vi.fn()
  } as unknown as PolkadotApi<unknown, unknown, unknown>

  const findAssetInfoOrThrowSpy = vi.spyOn(api, 'findAssetInfoOrThrow')
  const findNativeAssetInfoOrThrowSpy = vi.spyOn(api, 'findNativeAssetInfoOrThrow')
  const hasDryRunSupportSpy = vi.spyOn(api, 'hasDryRunSupport')

  const baseOptions: TGetOriginXcmFeeInternalOptions<unknown, unknown, unknown> = {
    api,
    tx: mockTx,
    origin: 'Moonbeam',
    destination: 'Acala',
    sender: 'addr',
    version: Version.V5,
    currency: mockCurrency,
    disableFallback: false
  }

  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(getNativeAssetSymbol).mockReturnValue(mockSymbol)
    vi.mocked(isSufficientOrigin).mockResolvedValue(true)
    vi.mocked(abstractDecimals).mockImplementation(amount => BigInt(amount))
    findAssetInfoOrThrowSpy.mockReturnValue(mockAsset)
    findNativeAssetInfoOrThrowSpy.mockReturnValue(nativeAsset)
    vi.spyOn(api, 'getPaymentInfo').mockResolvedValue({
      partialFee: 100n,
      weight: {
        refTime: 0n,
        proofSize: 0n
      }
    })
    vi.spyOn(api, 'getDryRunCall').mockResolvedValue({} as TDryRunChainResult)
  })

  it('returns padded paymentInfo fee when dry-run is NOT supported', async () => {
    hasDryRunSupportSpy.mockReturnValue(false)
    vi.mocked(padFee).mockReturnValue(150n)

    const dryRunCallSpy = vi.spyOn(api, 'getDryRunCall')
    const paymentInfoSpy = vi.spyOn(api, 'getPaymentInfo')

    const res = await getOriginXcmFeeInternal(baseOptions)

    expect(res).toEqual({
      fee: 150n,
      asset: nativeAsset,
      feeType: 'paymentInfo',
      sufficient: true
    })
    expect(paymentInfoSpy).toHaveBeenCalledWith({}, 'addr')
    expect(isSufficientOrigin).toHaveBeenCalledWith(
      api,
      'Moonbeam',
      'Acala',
      'addr',
      150n,
      { ...mockAsset, amount: 1000n },
      undefined
    )
    expect(dryRunCallSpy).not.toHaveBeenCalled()
  })

  it('returns dryRun fee, forwardedXcms & destParaId when dry-run succeeds', async () => {
    hasDryRunSupportSpy.mockReturnValue(true)

    vi.spyOn(api, 'getPaymentInfo').mockResolvedValue({
      partialFee: 0n,
      weight: {
        refTime: 0n,
        proofSize: 0n
      }
    })

    vi.spyOn(api, 'getDryRunCall').mockResolvedValue({
      success: true,
      fee: 200n,
      asset: mockAsset,
      forwardedXcms: [[{ x: 1 }]],
      destParaId: 42
    })

    const paymentInfoSpy = vi.spyOn(api, 'getPaymentInfo')

    const res = await getOriginXcmFeeInternal(baseOptions)

    expect(res).toEqual({
      fee: 200n,
      asset: mockAsset,
      feeType: 'dryRun',
      sufficient: true,
      forwardedXcms: [[{ x: 1 }]],
      destParaId: 42
    })
    expect(paymentInfoSpy).not.toHaveBeenCalled()
    expect(padFee).not.toHaveBeenCalled()
    expect(isSufficientOrigin).not.toHaveBeenCalled()
  })

  it('returns error variant when dry-run fails and fallback is disabled', async () => {
    hasDryRunSupportSpy.mockReturnValue(true)

    vi.spyOn(api, 'getPaymentInfo').mockResolvedValue({
      partialFee: 123n,
      weight: {
        refTime: 0n,
        proofSize: 0n
      }
    })

    vi.spyOn(api, 'getDryRunCall').mockResolvedValue({
      success: false,
      dryRunError: { reason: 'boom' },
      asset: mockAsset
    })

    const paymentInfoSpy = vi.spyOn(api, 'getPaymentInfo')

    const res = await getOriginXcmFeeInternal({ ...baseOptions, disableFallback: true })

    expect(res).toEqual({
      dryRunError: { reason: 'boom' },
      asset: mockAsset
    })
    expect('fee' in res).toBe(false)
    expect(paymentInfoSpy).not.toHaveBeenCalled()
    expect(isSufficientOrigin).not.toHaveBeenCalled()
  })

  it('falls back to padded paymentInfo when dry-run fails', async () => {
    hasDryRunSupportSpy.mockReturnValue(true)

    vi.spyOn(api, 'getPaymentInfo').mockResolvedValue({
      partialFee: 888n,
      weight: {
        refTime: 0n,
        proofSize: 0n
      }
    })

    vi.spyOn(api, 'getDryRunCall').mockResolvedValue({
      success: false,
      dryRunError: { reason: 'fail' },
      asset: mockAsset
    })

    vi.mocked(padFee).mockReturnValue(999n)

    const paymentInfoSpy = vi.spyOn(api, 'getPaymentInfo')

    const res = await getOriginXcmFeeInternal(baseOptions)

    expect(res).toEqual({
      fee: 999n,
      asset: mockAsset,
      feeType: 'paymentInfo',
      dryRunError: { reason: 'fail' },
      sufficient: false
    })
    expect(padFee).toHaveBeenCalledWith(888n, 'Moonbeam', 'Acala', 'origin')
    expect(paymentInfoSpy).toHaveBeenCalledWith({}, 'addr')
  })

  it('resolves the designated fee asset for an array currency', async () => {
    const usdt: TAssetInfo = {
      symbol: 'USDT',
      decimals: 6,
      location: { parents: 0, interior: { X1: { GeneralIndex: 1984 } } }
    }
    const usdc: TAssetInfo = {
      symbol: 'USDC',
      decimals: 6,
      location: { parents: 0, interior: { X1: { GeneralIndex: 1337 } } }
    }

    hasDryRunSupportSpy.mockReturnValue(false)
    vi.mocked(padFee).mockReturnValue(150n)
    vi.mocked(isAssetEqual).mockImplementation((a, b) => a.symbol === b.symbol)
    vi.spyOn(api, 'findAssetInfo').mockImplementation((_chain, currency) => {
      if ('symbol' in currency && currency.symbol === 'USDT') return usdt
      if ('symbol' in currency && currency.symbol === 'USDC') return usdc
      return null
    })

    const res = await getOriginXcmFeeInternal({
      ...baseOptions,
      origin: 'Hydration',
      destination: 'AssetHubPolkadot',
      currency: [
        { symbol: 'USDT', amount: 100n },
        { symbol: 'USDC', amount: 200n }
      ],
      feeAsset: { symbol: 'USDC' }
    })

    expect(res.feeType).toBe('paymentInfo')
    expect(isSufficientOrigin).toHaveBeenCalledWith(
      api,
      'Hydration',
      'AssetHubPolkadot',
      'addr',
      150n,
      { ...usdc, amount: 200n },
      { ...usdc, amount: 200n }
    )
  })
})
