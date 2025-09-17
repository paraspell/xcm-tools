import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import type { TGetXcmFeeOptions, TGetXcmFeeResult } from '../../types'
import { getXcmFee } from './getXcmFee'
import { getXcmFeeInternal } from './getXcmFeeInternal'

vi.mock('./getXcmFeeInternal')

describe('getXcmFee', () => {
  const mockApi = {
    disconnect: vi.fn().mockResolvedValue(undefined)
  } as unknown as IPolkadotApi<unknown, unknown>

  const bypassTx = { kind: 'bypass' }
  const realTx = { kind: 'real' }

  const commonOptions = {
    api: mockApi,
    txs: {
      tx: realTx as unknown,
      txBypass: bypassTx as unknown
    }
  } as TGetXcmFeeOptions<unknown, unknown, boolean>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('passes txBypassAmount to first internal call (useRootOrigin: true) and tx to second (useRootOrigin: false)', async () => {
    const forced = {
      origin: { currency: 'DOT', fee: 1n, sufficient: true },
      destination: { currency: 'ACA', fee: 2n, sufficient: true },
      hops: []
    } as unknown as TGetXcmFeeResult<boolean>

    const real = {
      origin: { currency: 'DOT', sufficient: false },
      destination: { currency: 'ACA', sufficient: false },
      hops: []
    } as unknown as TGetXcmFeeResult<boolean>

    vi.mocked(getXcmFeeInternal).mockResolvedValueOnce(forced).mockResolvedValueOnce(real)

    const disconnectSpy = vi.spyOn(mockApi, 'disconnect')

    await getXcmFee(commonOptions)

    expect(getXcmFeeInternal).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ tx: bypassTx, useRootOrigin: true })
    )
    expect(getXcmFeeInternal).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ tx: realTx, useRootOrigin: false })
    )

    expect(disconnectSpy).toHaveBeenCalledTimes(1)
  })

  it('overwrites only `sufficient` for origin/destination and keeps other fields from forced', async () => {
    const forced = {
      origin: { currency: 'DOT', fee: 1n, feeType: 'dryRun', sufficient: true },
      destination: { currency: 'ACA', fee: 2n, feeType: 'paymentInfo', sufficient: true },
      hops: []
    } as unknown as TGetXcmFeeResult<boolean>

    const real = {
      origin: { currency: 'DOT', fee: 999n, sufficient: false },
      destination: { currency: 'ACA', fee: 999n, sufficient: false },
      hops: []
    } as unknown as TGetXcmFeeResult<boolean>

    vi.mocked(getXcmFeeInternal).mockResolvedValueOnce(forced).mockResolvedValueOnce(real)

    const disconnectSpy = vi.spyOn(mockApi, 'disconnect')

    const res = await getXcmFee(commonOptions)

    expect(res.origin.sufficient).toBe(false)
    expect(res.destination.sufficient).toBe(false)
    expect(res.origin.fee).toBe(1n)
    expect(res.origin.feeType).toBe('dryRun')
    expect(res.destination.fee).toBe(2n)
    expect(res.destination.feeType).toBe('paymentInfo')

    expect(getXcmFeeInternal).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ tx: bypassTx, useRootOrigin: true })
    )
    expect(getXcmFeeInternal).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ tx: realTx, useRootOrigin: false })
    )
    expect(disconnectSpy).toHaveBeenCalledTimes(1)
  })

  it('handles assetHub/bridgeHub presence based on forced; pulls `sufficient` from real', async () => {
    const forced = {
      origin: { currency: 'DOT', sufficient: true },
      destination: { currency: 'ACA', sufficient: true },
      assetHub: { currency: 'AH', fee: 3n, sufficient: true },
      bridgeHub: { currency: 'BH', fee: 4n, sufficient: true },
      hops: []
    } as unknown as TGetXcmFeeResult<boolean>

    const real = {
      origin: { currency: 'DOT', sufficient: false },
      destination: { currency: 'ACA', sufficient: false },
      assetHub: { currency: 'AH', sufficient: false },
      bridgeHub: { currency: 'BH', sufficient: undefined },
      hops: []
    } as unknown as TGetXcmFeeResult<boolean>

    vi.mocked(getXcmFeeInternal).mockResolvedValueOnce(forced).mockResolvedValueOnce(real)

    const disconnectSpy = vi.spyOn(mockApi, 'disconnect')

    const res = await getXcmFee(commonOptions)

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

    vi.mocked(getXcmFeeInternal)
      .mockResolvedValueOnce(forcedNoHubs)
      .mockResolvedValueOnce(realWithHubs)

    const res2 = await getXcmFee(commonOptions)

    expect(res2.assetHub).toBeUndefined()
    expect(res2.bridgeHub).toBeUndefined()
    expect(disconnectSpy).toHaveBeenCalledTimes(2)
  })

  it('merges hop `sufficient` by index; missing real hops set `sufficient` to undefined', async () => {
    const forced = {
      origin: { currency: 'DOT', sufficient: true },
      destination: { currency: 'ACA', sufficient: true },
      hops: [
        { chain: 'AssetHubPolkadot', result: { currency: 'DOT', fee: 10n, sufficient: true } },
        { chain: 'Acala', result: { currency: 'ACA', fee: 20n, sufficient: true } }
      ]
    } as unknown as TGetXcmFeeResult<boolean>

    const real = {
      origin: { currency: 'DOT', sufficient: false },
      destination: { currency: 'ACA', sufficient: false },
      hops: [{ chain: 'AssetHubPolkadot', result: { currency: 'DOT', sufficient: false } }]
    } as unknown as TGetXcmFeeResult<boolean>

    vi.mocked(getXcmFeeInternal).mockResolvedValueOnce(forced).mockResolvedValueOnce(real)

    const disconnectSpy = vi.spyOn(mockApi, 'disconnect')

    const res = await getXcmFee(commonOptions)

    expect(res.hops).toHaveLength(2)
    expect(res.hops[0].chain).toBe('AssetHubPolkadot')
    expect(res.hops[0].result.fee).toBe(10n)
    expect(res.hops[0].result.sufficient).toBe(false)
    expect(res.hops[1].chain).toBe('Acala')
    expect(res.hops[1].result.fee).toBe(20n)
    expect(res.hops[1].result.sufficient).toBeUndefined()

    expect(getXcmFeeInternal).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ tx: bypassTx, useRootOrigin: true })
    )
    expect(getXcmFeeInternal).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ tx: realTx, useRootOrigin: false })
    )
    expect(disconnectSpy).toHaveBeenCalledTimes(1)
  })
})
