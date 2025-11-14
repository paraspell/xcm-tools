/* eslint-disable @typescript-eslint/unbound-method */
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
      origin: { currency: 'DOT', fee: 1n, feeType: 'dryRun', sufficient: true },
      destination: { currency: 'ACA', fee: 2n, feeType: 'paymentInfo', sufficient: true },
      hops: []
    } as unknown as TGetXcmFeeResult<boolean>

    const real = {
      origin: { currency: 'DOT', sufficient: false },
      destination: { currency: 'ACA', sufficient: false },
      hops: []
    } as unknown as TGetXcmFeeResult<boolean>

    vi.mocked(getXcmFeeOnce).mockResolvedValueOnce(real)
    vi.mocked(getBypassResultWithRetries).mockResolvedValueOnce(forced)

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

    expect(mockApi.disconnect).toHaveBeenCalledTimes(1)
  })

  it('handles assetHub/bridgeHub presence based on forced; pulls `sufficient` from real', async () => {
    const options = makeOptions()

    const forced = {
      origin: { currency: 'DOT', sufficient: true },
      destination: { currency: 'ACA', sufficient: true },
      assetHub: { currency: 'AH', fee: 3n, feeType: 'dryRun', sufficient: true },
      bridgeHub: { currency: 'BH', fee: 4n, feeType: 'dryRun', sufficient: true },
      hops: []
    } as unknown as TGetXcmFeeResult<boolean>

    const real = {
      origin: { currency: 'DOT', sufficient: false },
      destination: { currency: 'ACA', sufficient: false },
      assetHub: { currency: 'AH', sufficient: false },
      bridgeHub: { currency: 'BH', sufficient: undefined },
      hops: []
    } as unknown as TGetXcmFeeResult<boolean>

    vi.mocked(getXcmFeeOnce).mockResolvedValueOnce(real)
    vi.mocked(getBypassResultWithRetries).mockResolvedValueOnce(forced)

    const res = await getXcmFee(options)

    expect(res.assetHub?.currency).toBe('AH')
    expect(res.assetHub?.fee).toBe(3n)
    expect(res.assetHub?.sufficient).toBe(false)

    expect(res.bridgeHub?.currency).toBe('BH')
    expect(res.bridgeHub?.fee).toBe(4n)
    expect(res.bridgeHub?.sufficient).toBeUndefined()

    const forcedNoHubs = {
      origin: { currency: 'DOT', sufficient: true },
      destination: { currency: 'ACA', sufficient: true },
      hops: []
    } as unknown as TGetXcmFeeResult<boolean>

    const realWithHubs = {
      ...real,
      assetHub: { currency: 'AH', sufficient: false },
      bridgeHub: { currency: 'BH', sufficient: false }
    } as unknown as TGetXcmFeeResult<boolean>

    vi.mocked(getXcmFeeOnce).mockResolvedValueOnce(realWithHubs)
    vi.mocked(getBypassResultWithRetries).mockResolvedValueOnce(forcedNoHubs)

    const res2 = await getXcmFee(options)
    expect(res2.assetHub).toBeUndefined()
    expect(res2.bridgeHub).toBeUndefined()

    expect(mockApi.disconnect).toHaveBeenCalledTimes(2)
  })

  it('merges hop `sufficient` by index; missing real hops set `sufficient` to undefined', async () => {
    const options = makeOptions()

    const forced = {
      origin: { currency: 'DOT', sufficient: true },
      destination: { currency: 'ACA', sufficient: true },
      hops: [
        {
          chain: 'AssetHubPolkadot',
          result: { currency: 'DOT', fee: 10n, feeType: 'dryRun', sufficient: true }
        },
        {
          chain: 'Acala',
          result: { currency: 'ACA', fee: 20n, feeType: 'dryRun', sufficient: true }
        }
      ]
    } as unknown as TGetXcmFeeResult<boolean>

    const real = {
      origin: { currency: 'DOT', sufficient: false },
      destination: { currency: 'ACA', sufficient: false },
      hops: [{ chain: 'AssetHubPolkadot', result: { currency: 'DOT', sufficient: false } }]
    } as unknown as TGetXcmFeeResult<boolean>

    vi.mocked(getXcmFeeOnce).mockResolvedValueOnce(real)
    vi.mocked(getBypassResultWithRetries).mockResolvedValueOnce(forced)

    const res = await getXcmFee(options)

    expect(res.hops).toHaveLength(2)
    expect(res.hops[0].chain).toBe('AssetHubPolkadot')
    expect(res.hops[0].result.fee).toBe(10n)
    expect(res.hops[0].result.sufficient).toBe(false)

    expect(res.hops[1].chain).toBe('Acala')
    expect(res.hops[1].result.fee).toBe(20n)
    expect(res.hops[1].result.sufficient).toBeUndefined()

    expect(mockApi.disconnect).toHaveBeenCalledTimes(1)
  })

  it('when buildTx throws AmountTooLowError, uses forced via helper (without initialTx) and sets all `sufficient` to false', async () => {
    const options = {
      api: mockApi,
      // eslint-disable-next-line @typescript-eslint/require-await
      buildTx: vi.fn(async () => {
        throw new AmountTooLowError()
      })
    } as unknown as TGetXcmFeeOptions<unknown, unknown, boolean>

    const forced = {
      origin: { currency: 'DOT', fee: 1n, feeType: 'dryRun', sufficient: true },
      destination: { currency: 'ACA', fee: 2n, feeType: 'paymentInfo', sufficient: true },
      hops: [
        {
          chain: 'AssetHubPolkadot',
          result: { currency: 'DOT', fee: 10n, feeType: 'dryRun', sufficient: true }
        }
      ]
    } as TGetXcmFeeResult<boolean>

    vi.mocked(getBypassResultWithRetries).mockResolvedValueOnce(forced)

    const res = await getXcmFee(options)

    expect(getBypassResultWithRetries).toHaveBeenCalledWith(options, getXcmFeeOnce)

    expect(res.origin.sufficient).toBe(false)
    expect(res.destination.sufficient).toBe(false)
    expect(res.hops[0].result.sufficient).toBe(false)

    expect(mockApi.disconnect).toHaveBeenCalledTimes(1)
  })
})
