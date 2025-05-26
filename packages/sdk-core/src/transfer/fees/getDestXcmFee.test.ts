import { findAsset, hasDryRunSupport, InvalidCurrencyError } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { DOT_MULTILOCATION } from '../../constants'
import type { TDryRunNodeResultInternal, TGetFeeForDestNodeOptions } from '../../types'
import { getDestXcmFee } from './getDestXcmFee'
import { getReverseTxFee } from './getReverseTxFee'

vi.mock('@paraspell/assets', () => ({
  hasDryRunSupport: vi.fn(),
  findAsset: vi.fn(),
  InvalidCurrencyError: class InvalidCurrencyError extends Error {}
}))

vi.mock('./getReverseTxFee', () => ({
  getReverseTxFee: vi.fn()
}))

const createApi = (dryRunRes?: TDryRunNodeResultInternal) =>
  ({
    getDryRunXcm: vi.fn().mockResolvedValue(dryRunRes ?? {})
  }) as unknown as IPolkadotApi<unknown, unknown>

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(findAsset).mockReturnValue({ symbol: 'UNIT' } as never)
})

describe('getDestXcmFee', () => {
  it('returns a padded “paymentInfo” fee when dry-run is not supported', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValue(false)
    vi.mocked(getReverseTxFee).mockResolvedValue(130n)

    const api = createApi()

    const options = {
      api,
      forwardedXcms: undefined,
      origin: 'Moonbeam',
      destination: 'Astar',
      address: 'dest',
      senderAddress: 'sender',
      currency: { symbol: 'UNIT', amount: '1' },
      disableFallback: false
    } as TGetFeeForDestNodeOptions<unknown, unknown>

    const res = await getDestXcmFee(options)

    expect(getReverseTxFee).toHaveBeenCalledWith(options, { symbol: 'UNIT' })
    expect(res).toEqual({ fee: 130n, feeType: 'paymentInfo' })
  })

  it('returns a padded “paymentInfo” fee when dry-run is not supported and origin asset has multi-location', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValue(false)
    vi.mocked(getReverseTxFee).mockResolvedValue(130n)
    vi.mocked(findAsset).mockReturnValue({
      symbol: 'UNIT',
      multiLocation: DOT_MULTILOCATION
    })

    const api = createApi()

    const options = {
      api,
      forwardedXcms: undefined,
      origin: 'Moonbeam',
      destination: 'Astar',
      address: 'dest',
      senderAddress: 'sender',
      currency: { symbol: 'UNIT', amount: '1' },
      disableFallback: false
    } as TGetFeeForDestNodeOptions<unknown, unknown>

    const res = await getDestXcmFee(options)

    expect(getReverseTxFee).toHaveBeenCalledWith(options, { multilocation: DOT_MULTILOCATION })
    expect(res).toEqual({ fee: 130n, feeType: 'paymentInfo' })
  })

  it('returns a padded “paymentInfo” fee when dry-run is not supported, and fails with ML', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValue(false)
    vi.mocked(getReverseTxFee).mockRejectedValueOnce(new InvalidCurrencyError(''))
    vi.mocked(getReverseTxFee).mockResolvedValueOnce(130n)
    vi.mocked(findAsset).mockReturnValue({
      symbol: 'UNIT',
      multiLocation: DOT_MULTILOCATION
    })

    const api = createApi()

    const options = {
      api,
      forwardedXcms: undefined,
      origin: 'Moonbeam',
      destination: 'Astar',
      address: 'dest',
      senderAddress: 'sender',
      currency: { symbol: 'FOO', amount: '1' },
      disableFallback: false
    } as TGetFeeForDestNodeOptions<unknown, unknown>

    const res = await getDestXcmFee(options)

    expect(getReverseTxFee).toHaveBeenCalledWith(options, { multilocation: DOT_MULTILOCATION })
    expect(getReverseTxFee).toHaveBeenCalledWith(options, { symbol: 'UNIT' })

    expect(res).toEqual({ fee: 130n, feeType: 'paymentInfo' })
  })

  it('returns a “dryRun” fee (plus forwarded XCMs) when dry-run succeeds', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValue(true)
    const dryRunObj: TDryRunNodeResultInternal = {
      success: true,
      fee: 200n,
      forwardedXcms: [[{ x: 1 }]],
      destParaId: 3320
    }
    const api = createApi(dryRunObj)

    const res = await getDestXcmFee({
      api,
      forwardedXcms: [[{}], [{}]],
      origin: 'Moonbeam',
      prevNode: 'Moonbeam',
      destination: 'Astar',
      address: 'dest',
      senderAddress: 'sender',
      currency: { symbol: 'UNIT', amount: '1' },
      disableFallback: false
    } as TGetFeeForDestNodeOptions<unknown, unknown>)

    expect(res).toEqual({
      fee: 200n,
      feeType: 'dryRun',
      forwardedXcms: [[{ x: 1 }]],
      destParaId: 3320
    })
  })

  it('falls back to “paymentInfo” and returns `dryRunError` when dry-run fails', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValue(true)
    const api = createApi({ success: false, failureReason: 'fail' })

    vi.mocked(getReverseTxFee).mockResolvedValue(130n)

    const options = {
      api,
      forwardedXcms: [[{}], [{}]],
      origin: 'Moonbeam',
      prevNode: 'Moonbeam',
      destination: 'Astar',
      address: 'dest',
      senderAddress: 'sender',
      currency: { symbol: 'UNIT', amount: '1' },
      disableFallback: false
    } as TGetFeeForDestNodeOptions<unknown, unknown>

    const res = await getDestXcmFee(options)

    expect(getReverseTxFee).toHaveBeenCalledWith(options, { symbol: 'UNIT' })
    expect(res).toEqual({
      fee: 130n,
      feeType: 'paymentInfo',
      dryRunError: 'fail'
    })
  })

  it('returns **error variant** (only `dryRunError`) when fallback is disabled', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValue(true)
    const api = createApi({ success: false, failureReason: 'boom' })

    const res = await getDestXcmFee({
      api,
      forwardedXcms: [[{}], [{}]],
      origin: 'Moonbeam',
      prevNode: 'Moonbeam',
      destination: 'Astar',
      address: 'dest',
      senderAddress: 'sender',
      currency: { symbol: 'UNIT', amount: '1' },
      disableFallback: true
    } as TGetFeeForDestNodeOptions<unknown, unknown>)

    expect(res).toEqual({ dryRunError: 'boom' })
    expect('fee' in res).toBe(false)
  })

  it('throws InvalidCurrencyError when asset lookup fails', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValue(false)
    vi.mocked(findAsset).mockReturnValue(null)
    const api = createApi()

    await expect(
      getDestXcmFee({
        api,
        forwardedXcms: undefined,
        origin: 'Moonbeam',
        destination: 'Astar',
        address: 'dest',
        senderAddress: 'sender',
        currency: { symbol: 'FOO', amount: '1' },
        disableFallback: false
      } as TGetFeeForDestNodeOptions<unknown, unknown>)
    ).rejects.toBeInstanceOf(InvalidCurrencyError)
  })
})
