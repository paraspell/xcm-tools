/* eslint-disable @typescript-eslint/unbound-method */
import type { TAssetInfo } from '@paraspell/assets'
import {
  findAssetInfoOrThrow,
  findAssetOnDestOrThrow,
  findNativeAssetInfoOrThrow,
  getEdFromAssetOrThrow,
  isAssetEqual
} from '@paraspell/assets'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import type { GeneralBuilder } from '../../builder'
import { DryRunFailedError } from '../../errors'
import { getAssetBalanceInternal } from '../../pallets/assets'
import type { TDryRunResult, TGetXcmFeeResult, TSendBaseOptions } from '../../types'
import { abstractDecimals, validateAddress } from '../../utils'
import { dryRunInternal } from '../dry-run'
import { getXcmFeeInternal } from '../fees/getXcmFeeInternal'
import { resolveFeeAsset } from '../utils'
import * as mod from './getMinTransferableAmount'

vi.mock('@paraspell/assets', () => ({
  findAssetInfoOrThrow: vi.fn(),
  findAssetOnDestOrThrow: vi.fn(),
  findNativeAssetInfoOrThrow: vi.fn(),
  getEdFromAssetOrThrow: vi.fn(),
  isAssetEqual: vi.fn((a: TAssetInfo, b: TAssetInfo) => a?.symbol === b?.symbol)
}))

vi.mock('../../utils')
vi.mock('../utils')
vi.mock('../fees/getXcmFeeInternal')
vi.mock('../dry-run')
vi.mock('../../pallets/assets')

const makeApis = () => {
  const destApi = { init: vi.fn() } as unknown as IPolkadotApi<unknown, unknown>
  const api = {
    clone: vi.fn(() => destApi),
    setDisconnectAllowed: vi.fn(),
    disconnect: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>
  return { api, destApi }
}

describe('getMinTransferableAmountInternal', () => {
  let mockBuilder: GeneralBuilder<unknown, unknown, TSendBaseOptions>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(abstractDecimals).mockReturnValue(100n)
    vi.mocked(resolveFeeAsset).mockReturnValue(undefined)
    vi.mocked(dryRunInternal).mockResolvedValue({} as TDryRunResult)
    mockBuilder = {
      currency: vi.fn().mockReturnThis(),
      build: vi.fn().mockReturnValue({} as unknown)
    } as unknown as GeneralBuilder<unknown, unknown, TSendBaseOptions>
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('adds origin/hops/destination (matching asset), ED (when dest balance is 0), plus 1', async () => {
    const { api, destApi } = makeApis()

    const asset = { symbol: 'ASSET', decimals: 12 } as TAssetInfo
    const destAsset = {
      symbol: 'ASSET',
      location: {} as unknown
    } as TAssetInfo
    const nativeAsset = { symbol: 'ASSET' } as TAssetInfo

    vi.mocked(findAssetInfoOrThrow).mockReturnValue(asset)
    vi.mocked(findAssetOnDestOrThrow).mockReturnValue(destAsset)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue(nativeAsset)
    vi.mocked(getEdFromAssetOrThrow).mockReturnValue(10n)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(0n)

    // Fees: origin(A)=2 + hop(A)=3 + hop(B ignored)=5 + destination(A)=7

    vi.mocked(getXcmFeeInternal).mockResolvedValue({
      origin: { asset: { symbol: 'ASSET' }, fee: 2n },
      hops: [
        { result: { asset: { symbol: 'ASSET' }, fee: 3n } },
        { result: { asset: { symbol: 'B' }, fee: 5n } }
      ],
      destination: { asset: { symbol: 'ASSET' }, fee: 7n }
    } as TGetXcmFeeResult)

    const currencySpy = vi.spyOn(mockBuilder, 'currency')
    const buildSpy = vi.spyOn(mockBuilder, 'build').mockResolvedValue({} as unknown)

    const res = await mod.getMinTransferableAmountInternal({
      api,
      origin: 'Acala',
      senderAddress: 'SENDER',
      address: 'DEST_ADDR',
      destination: 'Astar',
      currency: { symbol: 'ASSET', amount: 1n },
      tx: {} as unknown,
      builder: mockBuilder
    })

    // 2 + 3 + 7 + 10 + 1 = 23
    expect(res).toBe(23n)

    expect(validateAddress).toHaveBeenCalledWith('SENDER', 'Acala', false)
    expect(api.clone).toHaveBeenCalled()
    expect(destApi.init).toHaveBeenCalledWith('Astar')
    expect(getAssetBalanceInternal).toHaveBeenCalledWith(
      expect.objectContaining({
        api: destApi,
        address: 'DEST_ADDR',
        chain: 'Astar',
        currency: expect.objectContaining({ location: expect.anything() })
      })
    )
    expect(abstractDecimals).toHaveBeenCalledWith(1n, 12, api)
    expect(getXcmFeeInternal).toHaveBeenCalledWith(
      expect.objectContaining({
        disableFallback: false,
        currency: expect.objectContaining({ amount: 100n })
      }),
      true
    )
    expect(currencySpy).toHaveBeenCalledWith(expect.objectContaining({ amount: 23n }))
    expect(buildSpy).toHaveBeenCalled()
    expect(dryRunInternal).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: expect.objectContaining({ amount: 23n })
      })
    )
    expect(isAssetEqual).toBeDefined()
  })

  it('no ED when dest balance > 0; origin fee counts when feeAsset resolves to sending asset', async () => {
    const { api } = makeApis()

    const asset = { symbol: 'A' } as TAssetInfo
    const destAssetNoLoc = { symbol: 'A' } as TAssetInfo
    const nativeAsset = { symbol: 'B' } as TAssetInfo
    const resolvedFee = { symbol: 'A' } as TAssetInfo

    vi.mocked(findAssetInfoOrThrow).mockReturnValue(asset)
    vi.mocked(findAssetOnDestOrThrow).mockReturnValue(destAssetNoLoc)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue(nativeAsset)
    vi.mocked(resolveFeeAsset).mockReturnValue(resolvedFee)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(5n)
    vi.mocked(getEdFromAssetOrThrow).mockReturnValue(999n) // ignored due to balance>0
    vi.mocked(getXcmFeeInternal).mockResolvedValue({
      origin: { asset: { symbol: 'A' }, fee: 5n },
      hops: [],
      destination: {}
    } as unknown as TGetXcmFeeResult)

    const out = await mod.getMinTransferableAmountInternal<unknown, unknown>({
      api,
      origin: 'Acala',
      senderAddress: 'S1',
      address: 'D1',
      destination: 'Hydration',
      currency: { symbol: 'ASSET', amount: 123n },
      tx: {} as unknown,
      feeAsset: { symbol: 'FEE' } as TAssetInfo,
      builder: mockBuilder
    })

    // origin(5) + 0 + 0 + ED(0) + 1 = 6
    expect(out).toBe(6n)

    expect(getAssetBalanceInternal).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: { symbol: 'A' }
      })
    )
    expect(resolveFeeAsset).toHaveBeenCalled()
  })

  it('throws DryRunFailedError when dryRun returns failureReason', async () => {
    const { api } = makeApis()

    vi.mocked(findAssetInfoOrThrow).mockReturnValue({
      symbol: 'A'
    } as TAssetInfo)
    vi.mocked(findAssetOnDestOrThrow).mockReturnValue({
      symbol: 'A',
      location: {} as unknown
    } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
      symbol: 'A'
    } as TAssetInfo)
    vi.mocked(getEdFromAssetOrThrow).mockReturnValue(1n)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(0n)
    vi.mocked(getXcmFeeInternal).mockResolvedValue({
      origin: { asset: { symbol: 'A' }, fee: 1n },
      hops: [],
      destination: {}
    } as unknown as TGetXcmFeeResult)
    vi.mocked(dryRunInternal).mockResolvedValue({
      failureReason: 'Nope'
    } as unknown as TDryRunResult)

    await expect(
      mod.getMinTransferableAmountInternal<unknown, unknown>({
        api,
        origin: 'Acala',
        senderAddress: 'S1',
        address: 'D1',
        destination: 'Hydration',
        currency: { symbol: 'ASSET', amount: 1n },
        tx: {} as unknown,
        builder: mockBuilder
      })
    ).rejects.toBeInstanceOf(DryRunFailedError)

    await expect(
      mod.getMinTransferableAmountInternal<unknown, unknown>({
        api,
        origin: 'Acala',
        senderAddress: 'S',
        address: 'D',
        destination: 'Hydration',
        currency: { symbol: 'ASSET', amount: 1n },
        tx: {} as unknown,
        builder: mockBuilder
      })
    ).rejects.toThrow('Not enough balance for XCM')
  })

  it('skips unrelated fees when assets differ; only ED + 1 when dest balance is 0', async () => {
    const { api } = makeApis()

    vi.mocked(findAssetInfoOrThrow).mockReturnValue({
      symbol: 'A'
    } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
      symbol: 'B'
    } as TAssetInfo)
    vi.mocked(findAssetOnDestOrThrow).mockReturnValue({
      symbol: 'B',
      location: {} as unknown
    } as TAssetInfo)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(0n)
    vi.mocked(getEdFromAssetOrThrow).mockReturnValue(4n)
    vi.mocked(getXcmFeeInternal).mockResolvedValue({
      origin: { asset: { symbol: 'B' }, fee: 9n },
      hops: [{ result: { asset: { symbol: 'B' }, fee: 8n } }],
      destination: { asset: { symbol: 'B' }, fee: 7n }
    } as TGetXcmFeeResult)

    const out = await mod.getMinTransferableAmountInternal<unknown, unknown>({
      api,
      origin: 'Acala',
      senderAddress: 'S',
      address: 'D',
      destination: 'Hydration',
      currency: { symbol: 'ASSET', amount: 1n },
      tx: {} as unknown,
      builder: mockBuilder
    })

    // Only ED(4) + 1
    expect(out).toBe(5n)
  })
})
