import { findAsset, hasDryRunSupport, InvalidCurrencyError } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import * as BuilderModule from '../../builder'
import type { TDryRunNodeResultInternal } from '../../types'
import { getFeeForDestNode } from './getFeeForDestNode'
import { padFee } from './padFee'

vi.mock('@paraspell/assets', () => ({
  hasDryRunSupport: vi.fn(),
  findAsset: vi.fn(),
  InvalidCurrencyError: class InvalidCurrencyError extends Error {}
}))

vi.mock('../../builder', () => ({
  Builder: vi.fn()
}))

vi.mock('../../constants', () => ({
  FEE_PADDING_FACTOR: 150n
}))

vi.mock('./padFee', () => ({
  padFee: vi.fn()
}))

const createApi = (fee: bigint, dryRunRes?: TDryRunNodeResultInternal) =>
  ({
    calculateTransactionFee: vi.fn().mockResolvedValue(fee),
    getDryRunXcm: vi.fn().mockResolvedValue(dryRunRes ?? {})
  }) as unknown as IPolkadotApi<unknown, unknown>

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(padFee).mockReturnValue(130n)
  vi.mocked(findAsset).mockReturnValue({ symbol: 'UNIT' } as never)
})

describe('getFeeForDestNode', () => {
  it('returns a padded “paymentInfo” fee when dry-run is **not** supported', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValue(false)

    /* stub out the Builder chain */
    const flippedTx = { tx: 'flip' }
    const mockBuilderInstance = {
      from: vi.fn().mockReturnThis(),
      to: vi.fn().mockReturnThis(),
      address: vi.fn().mockReturnThis(),
      senderAddress: vi.fn().mockReturnThis(),
      currency: vi.fn().mockReturnThis(),
      build: vi.fn().mockResolvedValue(flippedTx)
    } as unknown as BuilderModule.GeneralBuilder<unknown, unknown>
    vi.spyOn(BuilderModule, 'Builder').mockImplementation(() => mockBuilderInstance)

    const api = createApi(100n)

    const res = await getFeeForDestNode({
      api,
      forwardedXcms: undefined,
      origin: 'Moonbeam',
      destination: 'Astar',
      address: 'dest',
      senderAddress: 'sender',
      currency: { symbol: 'UNIT', amount: '1' },
      disableFallback: false
    })

    expect(res).toEqual({ fee: 130n, feeType: 'paymentInfo' })
    expect(padFee).toHaveBeenCalledWith(100n, 'Moonbeam', 'Astar', 'destination')
  })

  it('returns a “dryRun” fee (plus forwarded XCMs) when dry-run succeeds', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValue(true)
    const dryRunObj: TDryRunNodeResultInternal = {
      success: true,
      fee: 200n,
      forwardedXcms: [[{ x: 1 }]],
      destParaId: 3320
    }
    const api = createApi(0n, dryRunObj)

    const res = await getFeeForDestNode({
      api,
      forwardedXcms: [[{}], [{}]],
      origin: 'Moonbeam',
      destination: 'Astar',
      address: 'dest',
      senderAddress: 'sender',
      currency: { symbol: 'UNIT', amount: '1' },
      disableFallback: false
    })

    expect(res).toEqual({
      fee: 200n,
      feeType: 'dryRun',
      forwardedXcms: [[{ x: 1 }]],
      destParaId: 3320
    })
    expect(padFee).not.toHaveBeenCalled()
  })

  it('falls back to “paymentInfo” and returns `dryRunError` when dry-run fails', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValue(true)
    const api = createApi(100n, { success: false, failureReason: 'fail' })

    const flippedTx = { tx: 'flip' }
    const mockBuilderInstance = {
      from: vi.fn().mockReturnThis(),
      to: vi.fn().mockReturnThis(),
      address: vi.fn().mockReturnThis(),
      senderAddress: vi.fn().mockReturnThis(),
      currency: vi.fn().mockReturnThis(),
      build: vi.fn().mockResolvedValue(flippedTx)
    } as unknown as BuilderModule.GeneralBuilder<unknown, unknown>
    vi.spyOn(BuilderModule, 'Builder').mockImplementation(() => mockBuilderInstance)

    const res = await getFeeForDestNode({
      api,
      forwardedXcms: [[{}], [{}]],
      origin: 'Moonbeam',
      destination: 'Astar',
      address: 'dest',
      senderAddress: 'sender',
      currency: { symbol: 'UNIT', amount: '1' },
      disableFallback: false
    })

    expect(res).toEqual({
      fee: 130n, // padded fallback
      feeType: 'paymentInfo',
      dryRunError: 'fail'
    })
  })

  it('returns **error variant** (only `dryRunError`) when fallback is disabled', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValue(true)
    const api = createApi(0n, { success: false, failureReason: 'boom' })

    const res = await getFeeForDestNode({
      api,
      forwardedXcms: [[{}], [{}]],
      origin: 'Moonbeam',
      destination: 'Astar',
      address: 'dest',
      senderAddress: 'sender',
      currency: { symbol: 'UNIT', amount: '1' },
      disableFallback: true
    })

    expect(res).toEqual({ dryRunError: 'boom' })
    // fee MUST be absent in the error variant
    expect('fee' in res).toBe(false)
  })

  it('throws InvalidCurrencyError for multi-asset currencies', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValue(false)
    const api = createApi(1n)

    await expect(
      getFeeForDestNode({
        api,
        forwardedXcms: undefined,
        origin: 'Moonbeam',
        destination: 'Astar',
        address: 'dest',
        senderAddress: 'sender',
        currency: { multiasset: { id: 1 }, amount: '1' } as never,
        disableFallback: false
      })
    ).rejects.toBeInstanceOf(InvalidCurrencyError)
  })

  it('throws InvalidCurrencyError when asset lookup fails', async () => {
    vi.mocked(hasDryRunSupport).mockReturnValue(false)
    vi.mocked(findAsset).mockReturnValue(null)
    const api = createApi(1n)

    await expect(
      getFeeForDestNode({
        api,
        forwardedXcms: undefined,
        origin: 'Moonbeam',
        destination: 'Astar',
        address: 'dest',
        senderAddress: 'sender',
        currency: { symbol: 'FOO', amount: '1' },
        disableFallback: false
      })
    ).rejects.toBeInstanceOf(InvalidCurrencyError)
  })
})
