import type { TAssetInfo, TCurrencyCore, WithAmount } from '@paraspell/assets'
import {
  findAssetInfoOrThrow,
  findNativeAssetInfoOrThrow,
  getNativeAssetSymbol,
  hasDryRunSupport
} from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import type { TDryRunChainResult, TGetOriginXcmFeeInternalOptions } from '../../types'
import { padFee } from '../../utils/fees'
import { getOriginXcmFeeInternal } from './getOriginXcmFeeInternal'
import { isSufficientOrigin } from './isSufficient'

vi.mock('@paraspell/assets')
vi.mock('../../utils/fees')
vi.mock('./isSufficient')
vi.mock('../../utils')

describe('getOriginXcmFeeInternal', () => {
  const mockSymbol = 'TOKEN'
  const mockCurrency = { symbol: mockSymbol } as WithAmount<TCurrencyCore>
  const mockAsset: TAssetInfo = { symbol: 'USDT', decimals: 6, isNative: true }
  const nativeAsset = { symbol: 'DOT', decimals: 10, isNative: true }
  const mockTx = {}

  const api = {
    getPaymentInfo: vi.fn(),
    getDryRunCall: vi.fn(),
    init: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>

  const baseOptions: TGetOriginXcmFeeInternalOptions<unknown, unknown> = {
    api,
    tx: mockTx,
    origin: 'Moonbeam',
    destination: 'Acala',
    senderAddress: 'addr',
    version: Version.V5,
    currency: mockCurrency,
    disableFallback: false
  }

  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(getNativeAssetSymbol).mockReturnValue(mockSymbol)
    vi.mocked(isSufficientOrigin).mockResolvedValue(true)
    vi.mocked(findAssetInfoOrThrow).mockReturnValue(mockAsset)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue(nativeAsset)
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
    vi.mocked(hasDryRunSupport).mockReturnValue(false)
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
      mockCurrency,
      mockAsset,
      undefined
    )
    expect(dryRunCallSpy).not.toHaveBeenCalled()
  })

  it('returns dryRun fee, forwardedXcms & destParaId when dry-run succeeds', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValue(true)

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
    vi.mocked(hasDryRunSupport).mockReturnValue(true)

    vi.spyOn(api, 'getPaymentInfo').mockResolvedValue({
      partialFee: 123n,
      weight: {
        refTime: 0n,
        proofSize: 0n
      }
    })

    vi.spyOn(api, 'getDryRunCall').mockResolvedValue({
      success: false,
      failureReason: 'boom',
      asset: mockAsset
    })

    const paymentInfoSpy = vi.spyOn(api, 'getPaymentInfo')

    const res = await getOriginXcmFeeInternal({ ...baseOptions, disableFallback: true })

    expect(res).toEqual({
      dryRunError: 'boom',
      asset: mockAsset
    })
    expect('fee' in res).toBe(false)
    expect(paymentInfoSpy).not.toHaveBeenCalled()
    expect(isSufficientOrigin).not.toHaveBeenCalled()
  })

  it('falls back to padded paymentInfo when dry-run fails', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValue(true)

    vi.spyOn(api, 'getPaymentInfo').mockResolvedValue({
      partialFee: 888n,
      weight: {
        refTime: 0n,
        proofSize: 0n
      }
    })

    vi.spyOn(api, 'getDryRunCall').mockResolvedValue({
      success: false,
      failureReason: 'fail',
      asset: mockAsset
    })

    vi.mocked(padFee).mockReturnValue(999n)

    const paymentInfoSpy = vi.spyOn(api, 'getPaymentInfo')

    const res = await getOriginXcmFeeInternal(baseOptions)

    expect(res).toEqual({
      fee: 999n,
      asset: mockAsset,
      feeType: 'paymentInfo',
      dryRunError: 'fail',
      sufficient: false
    })
    expect(padFee).toHaveBeenCalledWith(888n, 'Moonbeam', 'Acala', 'origin')
    expect(paymentInfoSpy).toHaveBeenCalledWith({}, 'addr')
  })
})
