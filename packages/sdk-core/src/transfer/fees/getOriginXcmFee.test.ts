import type { TCurrencyInput } from '@paraspell/assets'
import { getNativeAssetSymbol, hasDryRunSupport } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { getOriginXcmFee } from './getOriginXcmFee'
import { padFee } from './padFee'

vi.mock('@paraspell/assets', () => ({
  hasDryRunSupport: vi.fn(),
  getNativeAssetSymbol: vi.fn()
}))

vi.mock('./padFee', () => ({
  padFee: vi.fn()
}))

const createApi = (fee: bigint) =>
  ({
    calculateTransactionFee: vi.fn().mockResolvedValue(fee),
    getDryRunCall: vi.fn().mockResolvedValue({}),
    init: vi.fn()
  }) as unknown as IPolkadotApi<unknown, unknown>

describe('getOriginXcmFee', () => {
  const mockCurrency = 'TOKEN'

  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(getNativeAssetSymbol).mockReturnValue(mockCurrency)
  })

  it('returns padded **paymentInfo** fee when dry-run is NOT supported', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValue(false)
    vi.mocked(padFee).mockReturnValue(150n)
    const api = createApi(100n)

    const dryRunCallSpy = vi.spyOn(api, 'getDryRunCall')

    const spy = vi.spyOn(api, 'calculateTransactionFee')

    const res = await getOriginXcmFee({
      api,
      tx: {},
      origin: 'Moonbeam',
      destination: 'Acala',
      senderAddress: 'addr',
      currency: {} as TCurrencyInput,
      disableFallback: false
    })

    expect(res).toEqual({ fee: 150n, currency: mockCurrency, feeType: 'paymentInfo' })
    expect(spy).toHaveBeenCalledWith({}, 'addr')
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

    const spy = vi.spyOn(api, 'calculateTransactionFee')

    const res = await getOriginXcmFee({
      api,
      tx: {},
      origin: 'Moonbeam',
      destination: 'Acala',
      senderAddress: 'addr',
      currency: {} as TCurrencyInput,
      disableFallback: false
    })

    expect(res).toEqual({
      fee: 200n,
      currency: mockCurrency,
      feeType: 'dryRun',
      forwardedXcms: [[{ x: 1 }]],
      destParaId: 42
    })
    expect(spy).not.toHaveBeenCalled()
    expect(padFee).not.toHaveBeenCalled()
  })

  it('returns **error variant** when dry-run fails and fallback is disabled', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValue(true)

    const api = createApi(123n)

    vi.spyOn(api, 'getDryRunCall').mockResolvedValue({
      success: false,
      failureReason: 'boom'
    })

    const spy = vi.spyOn(api, 'calculateTransactionFee')

    const res = await getOriginXcmFee({
      api,
      tx: {},
      origin: 'Moonbeam',
      destination: 'Acala',
      senderAddress: 'addr',
      currency: {} as TCurrencyInput,
      disableFallback: true
    })

    expect(res).toEqual({ dryRunError: 'boom' })
    expect('fee' in res).toBe(false)
    expect(spy).not.toHaveBeenCalled()
  })

  it('falls back to padded **paymentInfo** and returns `dryRunError` when dry-run fails', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValue(true)

    const api = createApi(888n)

    vi.spyOn(api, 'getDryRunCall').mockResolvedValue({
      success: false,
      failureReason: 'fail'
    })

    vi.mocked(padFee).mockReturnValue(999n)

    const spy = vi.spyOn(api, 'calculateTransactionFee')

    const res = await getOriginXcmFee({
      api,
      tx: {},
      origin: 'Moonbeam',
      destination: 'Acala',
      senderAddress: 'addr',
      currency: {} as TCurrencyInput,
      disableFallback: false
    })

    expect(res).toEqual({
      fee: 999n,
      currency: mockCurrency,
      feeType: 'paymentInfo',
      dryRunError: 'fail'
    })
    expect(padFee).toHaveBeenCalledWith(888n, 'Moonbeam', 'Acala', 'origin')
    expect(spy).toHaveBeenCalledWith({}, 'addr')
  })
})
