import type { TCurrencyCore, TNativeAssetInfo, WithAmount } from '@paraspell/assets'
import { findAssetInfoOrThrow, getNativeAssetSymbol, hasDryRunSupport } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { getOriginXcmFee } from './getOriginXcmFee'
import { isSufficientOrigin } from './isSufficient'
import { padFee } from './padFee'

vi.mock('@paraspell/assets')
vi.mock('./padFee')
vi.mock('./isSufficient')
vi.mock('../../utils')

const createApi = (fee: bigint) =>
  ({
    calculateTransactionFee: vi.fn().mockResolvedValue(fee),
    getDryRunCall: vi.fn().mockResolvedValue({}),
    init: vi.fn()
  }) as unknown as IPolkadotApi<unknown, unknown>

describe('getOriginXcmFee', () => {
  const mockSymbol = 'TOKEN'
  const mockCurrency = { symbol: mockSymbol } as WithAmount<TCurrencyCore>
  const mockAsset: TNativeAssetInfo = { symbol: 'DOT', decimals: 10, isNative: true }

  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(getNativeAssetSymbol).mockReturnValue(mockSymbol)
    vi.mocked(isSufficientOrigin).mockResolvedValue(true)
    vi.mocked(findAssetInfoOrThrow).mockReturnValue(mockAsset)
  })

  it('returns padded paymentInfo fee when dry-run is NOT supported', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValue(false)
    vi.mocked(padFee).mockReturnValue(150n)
    const api = createApi(100n)

    const dryRunCallSpy = vi.spyOn(api, 'getDryRunCall')
    const feeCalcSpy = vi.spyOn(api, 'calculateTransactionFee')

    const res = await getOriginXcmFee({
      api,
      tx: {},
      origin: 'Moonbeam',
      destination: 'Acala',
      senderAddress: 'addr',
      currency: mockCurrency,
      disableFallback: false
    })

    expect(res).toEqual({
      fee: 150n,
      currency: mockSymbol,
      feeType: 'paymentInfo',
      sufficient: true
    })
    expect(feeCalcSpy).toHaveBeenCalledWith({}, 'addr')
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

  it('returns **dryRun** fee, forwardedXcms & destParaId when dry-run succeeds', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValue(true)

    const api = createApi(0n)

    vi.spyOn(api, 'getDryRunCall').mockResolvedValue({
      success: true,
      fee: 200n,
      forwardedXcms: [[{ x: 1 }]],
      destParaId: 42
    })

    const feeCalcSpy = vi.spyOn(api, 'calculateTransactionFee')

    const res = await getOriginXcmFee({
      api,
      tx: {},
      origin: 'Moonbeam',
      destination: 'Acala',
      senderAddress: 'addr',
      currency: {} as WithAmount<TCurrencyCore>,
      disableFallback: false
    })

    expect(res).toEqual({
      fee: 200n,
      currency: mockSymbol,
      feeType: 'dryRun',
      sufficient: true,
      forwardedXcms: [[{ x: 1 }]],
      destParaId: 42
    })
    expect(feeCalcSpy).not.toHaveBeenCalled()
    expect(padFee).not.toHaveBeenCalled()
    expect(isSufficientOrigin).not.toHaveBeenCalled()
  })

  it('returns **error variant** when dry-run fails and fallback is disabled', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValue(true)

    const api = createApi(123n)

    vi.spyOn(api, 'getDryRunCall').mockResolvedValue({
      success: false,
      failureReason: 'boom'
    })

    const feeCalcSpy = vi.spyOn(api, 'calculateTransactionFee')

    const res = await getOriginXcmFee({
      api,
      tx: {},
      origin: 'Moonbeam',
      destination: 'Acala',
      senderAddress: 'addr',
      currency: {} as WithAmount<TCurrencyCore>,
      disableFallback: true
    })

    expect(res).toEqual({ dryRunError: 'boom' })
    expect('fee' in res).toBe(false)
    expect(feeCalcSpy).not.toHaveBeenCalled()
    expect(isSufficientOrigin).not.toHaveBeenCalled()
  })

  it('falls back to padded paymentInfo and returns `dryRunError` when dry-run fails', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValue(true)

    const api = createApi(888n)

    vi.spyOn(api, 'getDryRunCall').mockResolvedValue({
      success: false,
      failureReason: 'fail'
    })

    vi.mocked(padFee).mockReturnValue(999n)

    const feeCalcSpy = vi.spyOn(api, 'calculateTransactionFee')

    const res = await getOriginXcmFee({
      api,
      tx: {},
      origin: 'Moonbeam',
      destination: 'Acala',
      senderAddress: 'addr',
      currency: {} as WithAmount<TCurrencyCore>,
      disableFallback: false
    })

    expect(res).toEqual({
      fee: 999n,
      currency: mockSymbol,
      feeType: 'paymentInfo',
      dryRunError: 'fail',
      sufficient: true
    })
    expect(padFee).toHaveBeenCalledWith(888n, 'Moonbeam', 'Acala', 'origin')
    expect(feeCalcSpy).toHaveBeenCalledWith({}, 'addr')
    expect(isSufficientOrigin).toHaveBeenCalledWith(
      api,
      'Moonbeam',
      'Acala',
      'addr',
      999n,
      {},
      mockAsset,
      undefined
    )
  })
})
