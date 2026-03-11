import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AmountTooLowError } from '../../errors'
import type { TGetOriginXcmFeeOptions, TXcmFeeDetail } from '../../types'
import { getBypassResultWithRetries } from './getBypassResult'
import { getOriginXcmFee } from './getOriginXcmFee'
import { getOriginXcmFeeInternal } from './getOriginXcmFeeInternal'

vi.mock('./getOriginXcmFeeInternal')
vi.mock('./getBypassResult')

describe('getOriginXcmFee', () => {
  const realTx = { kind: 'real' } as unknown

  const makeOptions = () =>
    ({
      // eslint-disable-next-line @typescript-eslint/require-await
      buildTx: vi.fn(async () => realTx)
    }) as unknown as TGetOriginXcmFeeOptions<unknown, unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('builds real tx, calls real internal, then forced via getBypassResultWithRetries, and merges sufficient from real', async () => {
    const options = makeOptions()

    const forced = {
      fee: 1n,
      feeType: 'dryRun',
      sufficient: true,
      forwardedXcms: [],
      destParaId: 2000
    } as TXcmFeeDetail & { forwardedXcms?: unknown; destParaId?: number }

    const real = {
      fee: 0n,
      feeType: 'dryRun',
      sufficient: false
    } as TXcmFeeDetail

    vi.mocked(getOriginXcmFeeInternal).mockResolvedValueOnce(real)

    vi.mocked(getBypassResultWithRetries).mockResolvedValueOnce(forced)

    const res = await getOriginXcmFee(options)

    expect(options.buildTx).toHaveBeenCalledTimes(1)
    expect(options.buildTx).toHaveBeenCalledWith()

    expect(getOriginXcmFeeInternal).toHaveBeenCalledTimes(1)
    expect(getOriginXcmFeeInternal).toHaveBeenCalledWith(
      expect.objectContaining({ tx: realTx, useRootOrigin: false })
    )

    expect(getBypassResultWithRetries).toHaveBeenCalledTimes(1)
    expect(getBypassResultWithRetries).toHaveBeenCalledWith(
      options,
      getOriginXcmFeeInternal,
      realTx
    )

    expect(res.sufficient).toBe(false)
    expect(res).toEqual(expect.objectContaining({ forwardedXcms: [], destParaId: 2000 }))
  })

  it('sets sufficient to undefined when real.sufficient is undefined', async () => {
    const options = makeOptions()

    const forced = {
      fee: 1n,
      feeType: 'dryRun',
      sufficient: true
    } as TXcmFeeDetail

    const real = {
      fee: 0n,
      feeType: 'dryRun'
    } as TXcmFeeDetail

    vi.mocked(getOriginXcmFeeInternal).mockResolvedValueOnce(real)
    vi.mocked(getBypassResultWithRetries).mockResolvedValueOnce(forced)

    const res = await getOriginXcmFee(options)

    expect(getOriginXcmFeeInternal).toHaveBeenCalledWith(
      expect.objectContaining({ tx: realTx, useRootOrigin: false })
    )
    expect(getBypassResultWithRetries).toHaveBeenCalledWith(
      options,
      getOriginXcmFeeInternal,
      realTx
    )
    expect(res.sufficient).toBeUndefined()
  })

  it('when buildTx throws AmountTooLowError, runs forced via helper (without initialTx) and returns sufficient=false', async () => {
    const options = {
      // eslint-disable-next-line @typescript-eslint/require-await
      buildTx: vi.fn(async () => {
        throw new AmountTooLowError()
      })
    } as unknown as TGetOriginXcmFeeOptions<unknown, unknown, unknown>

    const forced = {
      fee: 5n,
      feeType: 'dryRun',
      asset: { symbol: 'DOT' },
      sufficient: true
    } as TXcmFeeDetail

    vi.mocked(getBypassResultWithRetries).mockResolvedValueOnce(forced)

    const res = await getOriginXcmFee(options)

    expect(options.buildTx).toHaveBeenCalledTimes(1)

    expect(getBypassResultWithRetries).toHaveBeenCalledWith(options, getOriginXcmFeeInternal)

    expect(res.sufficient).toBe(false)
    expect(res.fee).toBe(5n)
    expect(res.asset.symbol).toEqual('DOT')
  })
})
