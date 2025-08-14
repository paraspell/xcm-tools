import type { TAssetInfo } from '@paraspell/assets'
import { findAssetInfoOrThrow, hasDryRunSupport, InvalidCurrencyError } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { DOT_LOCATION } from '../../constants'
import type { TDryRunChainResultInternal, TGetFeeForDestChainOptions } from '../../types'
import { getDestXcmFee } from './getDestXcmFee'
import { getReverseTxFee } from './getReverseTxFee'
import { isSufficientDestination } from './isSufficient'

vi.mock('@paraspell/assets', () => ({
  hasDryRunSupport: vi.fn(),
  InvalidCurrencyError: class InvalidCurrencyError extends Error {},
  findAssetInfoOrThrow: vi.fn()
}))

vi.mock('./getReverseTxFee', () => ({
  getReverseTxFee: vi.fn()
}))

vi.mock('./isSufficient', () => ({
  isSufficientDestination: vi.fn()
}))

const createApi = (dryRunRes?: TDryRunChainResultInternal) =>
  ({
    getDryRunXcm: vi.fn().mockResolvedValue(dryRunRes ?? {})
  }) as unknown as IPolkadotApi<unknown, unknown>

describe('getDestXcmFee', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'UNIT' } as TAssetInfo)
    vi.mocked(isSufficientDestination).mockResolvedValue(true)
  })

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
      currency: { symbol: 'UNIT', amount: 1n },
      asset: { symbol: 'UNIT' },
      disableFallback: false
    } as TGetFeeForDestChainOptions<unknown, unknown>

    const res = await getDestXcmFee(options)

    expect(getReverseTxFee).toHaveBeenCalledWith(options, { symbol: 'UNIT' })
    expect(isSufficientDestination).toHaveBeenCalledWith(
      api,
      'Astar',
      'dest',
      1n,
      {
        symbol: 'UNIT'
      },
      130n
    )
    expect(res).toEqual({ fee: 130n, feeType: 'paymentInfo', sufficient: true })
  })

  it('returns a padded “paymentInfo” fee when dry-run is not supported and origin asset has location', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValue(false)
    vi.mocked(getReverseTxFee).mockResolvedValue(130n)
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({
      symbol: 'UNIT',
      decimals: 12,
      location: DOT_LOCATION
    })

    const api = createApi()

    const options = {
      api,
      forwardedXcms: undefined,
      origin: 'Moonbeam',
      destination: 'Astar',
      address: 'dest',
      senderAddress: 'sender',
      currency: { symbol: 'UNIT', amount: 1n },
      asset: { symbol: 'UNIT' },
      disableFallback: false
    } as TGetFeeForDestChainOptions<unknown, unknown>

    const res = await getDestXcmFee(options)

    expect(getReverseTxFee).toHaveBeenCalledWith(options, { location: DOT_LOCATION })
    expect(isSufficientDestination).toHaveBeenCalledWith(
      api,
      'Astar',
      'dest',
      1n,
      {
        symbol: 'UNIT'
      },
      130n
    )
    expect(res).toEqual({ fee: 130n, feeType: 'paymentInfo', sufficient: true })
  })

  it('returns a padded “paymentInfo” fee when dry-run is not supported, and fails with ML', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValue(false)
    vi.mocked(getReverseTxFee).mockRejectedValueOnce(new InvalidCurrencyError(''))
    vi.mocked(getReverseTxFee).mockResolvedValueOnce(130n)
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({
      symbol: 'UNIT',
      decimals: 12,
      location: DOT_LOCATION
    })

    const api = createApi()

    const options = {
      api,
      forwardedXcms: undefined,
      origin: 'Moonbeam',
      destination: 'Astar',
      address: 'dest',
      senderAddress: 'sender',
      currency: { symbol: 'FOO', amount: 1n },
      asset: { symbol: 'UNIT' },
      disableFallback: false
    } as TGetFeeForDestChainOptions<unknown, unknown>

    const res = await getDestXcmFee(options)

    expect(getReverseTxFee).toHaveBeenCalledWith(options, { location: DOT_LOCATION })
    expect(getReverseTxFee).toHaveBeenCalledWith(options, { symbol: 'UNIT' })
    expect(isSufficientDestination).toHaveBeenCalledWith(
      api,
      'Astar',
      'dest',
      1n,
      {
        symbol: 'UNIT'
      },
      130n
    )
    expect(res).toEqual({ fee: 130n, feeType: 'paymentInfo', sufficient: true })
  })

  it('returns a “dryRun” fee (plus forwarded XCMs) when dry-run succeeds', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValue(true)
    const dryRunObj: TDryRunChainResultInternal = {
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
      prevChain: 'Moonbeam',
      destination: 'Astar',
      address: 'dest',
      senderAddress: 'sender',
      currency: { symbol: 'UNIT', amount: 1n },
      disableFallback: false
    } as TGetFeeForDestChainOptions<unknown, unknown>)

    expect(res).toEqual({
      fee: 200n,
      feeType: 'dryRun',
      sufficient: true,
      forwardedXcms: [[{ x: 1 }]],
      destParaId: 3320
    })
    expect(isSufficientDestination).not.toHaveBeenCalled()
  })

  it('falls back to “paymentInfo” and returns `dryRunError` when dry-run fails', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValue(true)
    const api = createApi({ success: false, failureReason: 'fail' })

    vi.mocked(getReverseTxFee).mockResolvedValue(130n)

    const options = {
      api,
      forwardedXcms: [[{}], [{}]],
      origin: 'Moonbeam',
      prevChain: 'Moonbeam',
      destination: 'Astar',
      address: 'dest',
      senderAddress: 'sender',
      currency: { symbol: 'UNIT', amount: 1n },
      disableFallback: false
    } as TGetFeeForDestChainOptions<unknown, unknown>

    const res = await getDestXcmFee(options)

    expect(getReverseTxFee).toHaveBeenCalledWith(options, { symbol: 'UNIT' })
    expect(res).toEqual({
      fee: 130n,
      feeType: 'paymentInfo',
      dryRunError: 'fail',
      sufficient: true
    })
  })

  it('returnserror variant (only `dryRunError`) when fallback is disabled', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValue(true)
    const api = createApi({ success: false, failureReason: 'boom' })

    const res = await getDestXcmFee({
      api,
      forwardedXcms: [[{}], [{}]],
      origin: 'Moonbeam',
      prevChain: 'Moonbeam',
      destination: 'Astar',
      address: 'dest',
      senderAddress: 'sender',
      currency: { symbol: 'UNIT', amount: 1n },
      disableFallback: true
    } as TGetFeeForDestChainOptions<unknown, unknown>)

    expect(res).toEqual({ dryRunError: 'boom' })
    expect('fee' in res).toBe(false)
  })
})
