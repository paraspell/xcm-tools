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
import { getAssetBalanceInternal } from '../../balance'
import type { GeneralBuilder } from '../../builder'
import { AmountTooLowError } from '../../errors'
import type {
  TDryRunResult,
  TGetXcmFeeResult,
  TSendBaseOptionsWithSenderAddress
} from '../../types'
import { abstractDecimals, validateAddress } from '../../utils'
import { dryRunInternal } from '../dry-run'
import { getXcmFee } from '../fees'
import { resolveFeeAsset } from '../utils'
import * as mod from './getMinTransferableAmount'

vi.mock('@paraspell/assets')

vi.mock('../../utils')
vi.mock('../utils')
vi.mock('../fees')
vi.mock('../dry-run')
vi.mock('../../balance')

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
  let mockBuilder: GeneralBuilder<unknown, unknown, TSendBaseOptionsWithSenderAddress>

  // eslint-disable-next-line @typescript-eslint/require-await
  const buildTx = vi.fn(async () => ({}) as unknown)

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(abstractDecimals).mockReturnValue(100n)
    vi.mocked(isAssetEqual).mockImplementation(
      (a: TAssetInfo, b: TAssetInfo) => a?.symbol === b?.symbol
    )
    vi.mocked(resolveFeeAsset).mockReturnValue(undefined)
    vi.mocked(dryRunInternal).mockResolvedValue({} as TDryRunResult)
    vi.mocked(isAssetEqual).mockImplementation(
      (a: TAssetInfo, b: TAssetInfo) => a?.symbol === b?.symbol
    )
    mockBuilder = {
      currency: vi.fn().mockReturnThis(),
      buildInternal: vi.fn().mockReturnValue({} as unknown)
    } as unknown as GeneralBuilder<unknown, unknown, TSendBaseOptionsWithSenderAddress>
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('adds origin/hops/destination (matching asset), ED (when dest balance is 0), plus 1', async () => {
    const { api, destApi } = makeApis()

    const asset = { symbol: 'ASSET', decimals: 12 } as TAssetInfo
    const destAsset = { symbol: 'ASSET', location: {} } as TAssetInfo
    const nativeAsset = { symbol: 'ASSET' } as TAssetInfo

    vi.mocked(findAssetInfoOrThrow).mockReturnValue(asset)
    vi.mocked(findAssetOnDestOrThrow).mockReturnValue(destAsset)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue(nativeAsset)
    vi.mocked(getEdFromAssetOrThrow).mockReturnValue(10n)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(0n)

    // Fees: origin(A)=2 + hop(A)=3 + hop(B ignored)=5 + destination(A)=7
    vi.mocked(getXcmFee).mockResolvedValue({
      origin: { asset: { symbol: 'ASSET' }, fee: 2n },
      hops: [
        { result: { asset: { symbol: 'ASSET' }, fee: 3n } },
        { result: { asset: { symbol: 'B' }, fee: 5n } }
      ],
      destination: { asset: { symbol: 'ASSET' }, fee: 7n }
    } as TGetXcmFeeResult)

    const currencySpy = vi.spyOn(mockBuilder, 'currency')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buildSpy = vi.spyOn(mockBuilder as any, 'buildInternal').mockResolvedValue({} as unknown)

    const res = await mod.getMinTransferableAmountInternal({
      api,
      origin: 'Acala',
      senderAddress: 'SENDER',
      address: 'DEST_ADDR',
      destination: 'Astar',
      currency: { symbol: 'ASSET', amount: 1n },
      builder: mockBuilder,
      buildTx
    })

    // 2 + 3 + 7 + 10 + 1 = 23
    expect(res).toBe(23n)

    expect(validateAddress).toHaveBeenCalledWith(api, 'SENDER', 'Acala', false)
    expect(api.clone).toHaveBeenCalled()
    expect(destApi.init).toHaveBeenCalledWith('Astar')
    expect(getAssetBalanceInternal).toHaveBeenCalledWith(
      expect.objectContaining({
        api: destApi,
        address: 'DEST_ADDR',
        chain: 'Astar',
        asset: destAsset
      })
    )
    expect(abstractDecimals).toHaveBeenCalledWith(1n, 12, api)
    expect(getXcmFee).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: 'Acala',
        destination: 'Astar',
        disableFallback: false,
        currency: expect.objectContaining({ amount: 100n })
      })
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
    vi.mocked(getXcmFee).mockResolvedValue({
      origin: { asset: { symbol: 'A' }, fee: 5n },
      hops: [],
      destination: {}
    } as unknown as TGetXcmFeeResult)

    const out = await mod.getMinTransferableAmountInternal({
      api,
      origin: 'Acala',
      senderAddress: 'S1',
      address: 'D1',
      destination: 'Hydration',
      currency: { symbol: 'ASSET', amount: 123n },
      feeAsset: { symbol: 'FEE' } as TAssetInfo,
      builder: mockBuilder,
      buildTx
    })

    // origin(5) + 0 + 0 + ED(0) + 1 = 6
    expect(out).toBe(6n)

    expect(getAssetBalanceInternal).toHaveBeenCalledWith(
      expect.objectContaining({
        asset
      })
    )

    expect(resolveFeeAsset).toHaveBeenCalled()
  })

  it('returns 0n when dryRun reports failureReason', async () => {
    const { api } = makeApis()

    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'A' } as TAssetInfo)
    vi.mocked(findAssetOnDestOrThrow).mockReturnValue({
      symbol: 'A',
      location: {}
    } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'A' } as TAssetInfo)
    vi.mocked(getEdFromAssetOrThrow).mockReturnValue(1n)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(0n)
    vi.mocked(getXcmFee).mockResolvedValue({
      origin: { asset: { symbol: 'A' }, fee: 1n },
      hops: [],
      destination: {}
    } as unknown as TGetXcmFeeResult)
    vi.mocked(dryRunInternal).mockResolvedValue({
      failureReason: 'Nope'
    } as unknown as TDryRunResult)

    const res = await mod.getMinTransferableAmountInternal({
      api,
      origin: 'Acala',
      senderAddress: 'S1',
      address: 'D1',
      destination: 'Hydration',
      currency: { symbol: 'ASSET', amount: 1n },
      builder: mockBuilder,
      buildTx
    })

    expect(res).toBe(0n)
  })

  it('skips unrelated fees when assets differ; only ED + 1 when dest balance is 0', async () => {
    const { api } = makeApis()

    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'A' } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'B' } as TAssetInfo)
    vi.mocked(findAssetOnDestOrThrow).mockReturnValue({
      symbol: 'B',
      location: {}
    } as TAssetInfo)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(0n)
    vi.mocked(getEdFromAssetOrThrow).mockReturnValue(4n)
    vi.mocked(getXcmFee).mockResolvedValue({
      origin: { asset: { symbol: 'B' }, fee: 9n },
      hops: [{ result: { asset: { symbol: 'B' }, fee: 8n } }],
      destination: { asset: { symbol: 'B' }, fee: 7n }
    } as TGetXcmFeeResult)

    const out = await mod.getMinTransferableAmountInternal({
      api,
      origin: 'Acala',
      senderAddress: 'S',
      address: 'D',
      destination: 'Hydration',
      currency: { symbol: 'ASSET', amount: 1n },
      builder: mockBuilder,
      buildTx
    })

    // Only ED(4) + 1
    expect(out).toBe(5n)
  })

  it('returns 0n when createTx keeps failing with AmountTooLowError (even after padding)', async () => {
    const { api } = makeApis()

    vi.mocked(findAssetInfoOrThrow).mockReturnValue({
      symbol: 'ASSET',
      decimals: 12
    } as TAssetInfo)
    vi.mocked(findAssetOnDestOrThrow).mockReturnValue({
      symbol: 'ASSET',
      location: {}
    } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
      symbol: 'ASSET'
    } as TAssetInfo)
    vi.mocked(getEdFromAssetOrThrow).mockReturnValue(0n)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(0n)
    vi.mocked(getXcmFee).mockResolvedValue({
      origin: undefined,
      hops: [],
      destination: undefined
    } as unknown as TGetXcmFeeResult)

    const error = new AmountTooLowError()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(mockBuilder as any, 'buildInternal').mockRejectedValue(error)

    const result = await mod.getMinTransferableAmountInternal({
      api,
      origin: 'Acala',
      senderAddress: 'SENDER',
      address: 'DEST',
      destination: 'Astar',
      currency: { symbol: 'ASSET', amount: 1n },
      builder: mockBuilder,
      buildTx
    })

    expect(result).toBe(0n)
    expect(dryRunInternal).not.toHaveBeenCalled()
  })
})
