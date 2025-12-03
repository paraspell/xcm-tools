import type { TAssetInfo } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { AmountTooLowError } from '../../errors'
import type { TGetXcmFeeOptions, TGetXcmFeeResult } from '../../types'
import { getBypassResultWithRetries } from './getBypassResult'
import { getXcmFee } from './getXcmFee'
import { getXcmFeeOnce } from './getXcmFeeOnce'

vi.mock('./getXcmFeeOnce')
vi.mock('./getBypassResult')

describe('getXcmFee', () => {
  const mockApi = {
    disconnect: vi.fn().mockResolvedValue(undefined)
  } as unknown as IPolkadotApi<unknown, unknown>

  const realTx = { kind: 'real' } as const

  const makeOptions = () =>
    ({
      api: mockApi,
      // eslint-disable-next-line @typescript-eslint/require-await
      buildTx: vi.fn(async () => realTx)
    }) as unknown as TGetXcmFeeOptions<unknown, unknown, boolean>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('builds real tx, calls real internal, then forced via helper, and merges `sufficient` from real', async () => {
    const options = makeOptions()

    const forced = {
      origin: { fee: 1n, feeType: 'dryRun', sufficient: true },
      destination: { fee: 2n, feeType: 'paymentInfo', sufficient: true },
      hops: []
    } as unknown as TGetXcmFeeResult<boolean>

    const real = {
      origin: { sufficient: false },
      destination: { sufficient: false },
      hops: []
    } as unknown as TGetXcmFeeResult<boolean>

    vi.mocked(getXcmFeeOnce).mockResolvedValueOnce(real)
    vi.mocked(getBypassResultWithRetries).mockResolvedValueOnce(forced)

    const disconnectSpy = vi.spyOn(mockApi, 'disconnect')

    const res = await getXcmFee(options)

    expect(options.buildTx).toHaveBeenCalledTimes(1)
    expect(options.buildTx).toHaveBeenCalledWith()

    expect(getXcmFeeOnce).toHaveBeenCalledTimes(1)
    expect(getXcmFeeOnce).toHaveBeenCalledWith(
      expect.objectContaining({ tx: realTx, useRootOrigin: false })
    )

    expect(getBypassResultWithRetries).toHaveBeenCalledTimes(1)
    expect(getBypassResultWithRetries).toHaveBeenCalledWith(options, getXcmFeeOnce, realTx)

    expect(res.origin.sufficient).toBe(false)
    expect(res.destination.sufficient).toBe(false)
    expect(res.origin.fee).toBe(1n)
    expect(res.origin.feeType).toBe('dryRun')
    expect(res.destination.fee).toBe(2n)
    expect(res.destination.feeType).toBe('paymentInfo')

    expect(disconnectSpy).toHaveBeenCalledTimes(1)
  })

  it('merges hop `sufficient` by index; missing real hops set `sufficient` to undefined', async () => {
    const options = makeOptions()

    const dotAsset = {
      symbol: 'DOT'
    } as TAssetInfo

    const acaAsset = {
      symbol: 'ACA'
    } as TAssetInfo

    const forced = {
      origin: { asset: dotAsset, sufficient: true },
      destination: { asset: acaAsset, sufficient: true },
      hops: [
        {
          chain: 'AssetHubPolkadot',
          result: { asset: dotAsset, fee: 10n, feeType: 'dryRun', sufficient: true }
        },
        {
          chain: 'Acala',
          result: { asset: acaAsset, fee: 20n, feeType: 'dryRun', sufficient: true }
        }
      ]
    } as unknown as TGetXcmFeeResult<boolean>

    const real = {
      origin: { asset: dotAsset, sufficient: false },
      destination: { asset: acaAsset, sufficient: false },
      hops: [{ chain: 'AssetHubPolkadot', result: { asset: dotAsset, sufficient: false } }]
    } as unknown as TGetXcmFeeResult<boolean>

    vi.mocked(getXcmFeeOnce).mockResolvedValueOnce(real)
    vi.mocked(getBypassResultWithRetries).mockResolvedValueOnce(forced)

    const disconnectSpy = vi.spyOn(mockApi, 'disconnect')

    const res = await getXcmFee(options)

    expect(res.hops).toHaveLength(2)
    expect(res.hops[0].chain).toBe('AssetHubPolkadot')
    expect(res.hops[0].result.fee).toBe(10n)
    expect(res.hops[0].result.sufficient).toBe(false)

    expect(res.hops[1].chain).toBe('Acala')
    expect(res.hops[1].result.fee).toBe(20n)
    expect(res.hops[1].result.sufficient).toBeUndefined()

    expect(disconnectSpy).toHaveBeenCalledTimes(1)
  })

  it('when buildTx throws AmountTooLowError, uses forced via helper (without initialTx) and sets all `sufficient` to false', async () => {
    const options = {
      api: mockApi,
      // eslint-disable-next-line @typescript-eslint/require-await
      buildTx: vi.fn(async () => {
        throw new AmountTooLowError()
      })
    } as unknown as TGetXcmFeeOptions<unknown, unknown, boolean>

    const dotAsset = {
      symbol: 'DOT'
    } as TAssetInfo

    const acaAsset = {
      symbol: 'ACA'
    } as TAssetInfo

    const forced = {
      origin: { asset: dotAsset, fee: 1n, feeType: 'dryRun', sufficient: true },
      destination: { asset: acaAsset, fee: 2n, feeType: 'paymentInfo', sufficient: true },
      hops: [
        {
          chain: 'AssetHubPolkadot',
          result: { asset: dotAsset, fee: 10n, feeType: 'dryRun', sufficient: true }
        }
      ]
    } as TGetXcmFeeResult<boolean>

    vi.mocked(getBypassResultWithRetries).mockResolvedValueOnce(forced)

    const disconnectSpy = vi.spyOn(mockApi, 'disconnect')

    const res = await getXcmFee(options)

    expect(getBypassResultWithRetries).toHaveBeenCalledWith(options, getXcmFeeOnce)

    expect(res.origin.sufficient).toBe(false)
    expect(res.destination.sufficient).toBe(false)
    expect(res.hops[0].result.sufficient).toBe(false)

    expect(disconnectSpy).toHaveBeenCalledTimes(1)
  })
})
