import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import { getEdFromAssetOrThrow, isAssetEqual } from '@paraspell/assets'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Version } from '../..'
import type { PolkadotApi } from '../../api'
import { getAssetBalanceInternal } from '../../balance'
import type { GeneralBuilder } from '../../builder'
import { AmountTooLowError } from '../../errors'
import type {
  TDryRunResult,
  TGetMinTransferableAmountOptions,
  TGetXcmFeeResult,
  TTransferBaseOptionsWithSender,
  TXcmFeeDetail
} from '../../types'
import { validateAddress } from '../../utils'
import { dryRunInternal } from '../dry-run'
import { getXcmFee } from '../fees'
import { resolveCurrency, resolveFeeAsset } from '../utils'
import * as mod from './getMinTransferableAmount'

vi.mock('@paraspell/assets')

vi.mock('../../utils')
vi.mock('../utils')
vi.mock('../fees')
vi.mock('../dry-run')
vi.mock('../../balance')

describe('getMinTransferableAmountInternal', () => {
  // eslint-disable-next-line @typescript-eslint/require-await
  const buildTx = vi.fn(async () => ({}))

  const destApi = { init: vi.fn() } as unknown as PolkadotApi<unknown, unknown, unknown>
  const api = {
    clone: vi.fn(() => destApi),
    setDisconnectAllowed: vi.fn(),
    disconnect: vi.fn(),
    findAssetInfoOrThrow: vi.fn(),
    findAssetOnDestOrThrow: vi.fn(),
    findNativeAssetInfoOrThrow: vi.fn()
  } as unknown as PolkadotApi<unknown, unknown, unknown>

  const mockResolvedAsset = (asset: TAssetInfo, amount = 100n) =>
    vi.mocked(resolveCurrency).mockReturnValue({
      assets: [{ ...asset, amount }],
      asset: { ...asset, amount }
    })

  const findAssetOnDestOrThrowSpy = vi.spyOn(api, 'findAssetOnDestOrThrow')
  const findNativeAssetInfoOrThrowSpy = vi.spyOn(api, 'findNativeAssetInfoOrThrow')

  const buildInternal = vi.fn().mockReturnValue({})
  const mockBuilder = {
    currency: vi.fn().mockReturnThis(),
    buildInternal
  } as unknown as GeneralBuilder<
    unknown,
    unknown,
    unknown,
    TTransferBaseOptionsWithSender<unknown, unknown, unknown>
  >

  const baseOptions = {
    api,
    origin: 'Acala',
    sender: 'SENDER',
    recipient: 'DEST_ADDR',
    destination: 'Astar',
    currency: { symbol: 'ASSET', amount: 1n },
    builder: mockBuilder,
    version: Version.V5,
    buildTx
  } as TGetMinTransferableAmountOptions<unknown, unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(isAssetEqual).mockImplementation((a, b) => a?.symbol === b?.symbol)
    vi.mocked(resolveFeeAsset).mockReturnValue(undefined)
    vi.mocked(dryRunInternal).mockResolvedValue({ success: true } as TDryRunResult)
    vi.mocked(isAssetEqual).mockImplementation((a, b) => a?.symbol === b?.symbol)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns per-asset min amounts in input order for currency arrays', async () => {
    const usdt = { symbol: 'USDT', decimals: 6 } as TAssetInfo
    const usdc = { symbol: 'USDC', decimals: 6 } as TAssetInfo

    vi.mocked(resolveFeeAsset).mockReturnValue(usdt)
    vi.mocked(resolveCurrency).mockReturnValue({
      assets: [
        { ...usdt, amount: 100n, isFeeAsset: true },
        { ...usdc, amount: 200n, isFeeAsset: false }
      ],
      asset: { ...usdt, amount: 100n, isFeeAsset: true }
    })
    findAssetOnDestOrThrowSpy.mockReturnValueOnce(usdt).mockReturnValueOnce(usdc)
    findNativeAssetInfoOrThrowSpy.mockReturnValue({ symbol: 'NATIVE' } as TAssetInfo)
    vi.mocked(getEdFromAssetOrThrow).mockReturnValue(10n)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(0n)

    // origin fee (USDT, paid by the fee asset) = 2; destination fee (USDT) = 7
    vi.mocked(getXcmFee).mockResolvedValue({
      success: true,
      origin: { asset: { symbol: 'USDT' } as TAssetInfo, fee: 2n, feeType: 'dryRun' },
      hops: [],
      destination: { asset: { symbol: 'USDT' } as TAssetInfo, fee: 7n, feeType: 'dryRun' }
    })

    buildInternal.mockResolvedValue({})

    const currencySpy = vi.spyOn(mockBuilder, 'currency')

    const res = await mod.getMinTransferableAmountInternal({
      ...baseOptions,
      feeAsset: { symbol: 'USDT' },
      currency: [
        { symbol: 'USDT', amount: 100n },
        { symbol: 'USDC', amount: 200n }
      ]
    })

    // USDT: 2 (origin) + 7 (dest) + 10 (ED) + 1 = 20; USDC: 10 (ED) + 1 = 11
    expect(res).toEqual([20n, 11n])
    expect(currencySpy).toHaveBeenCalledWith([
      { symbol: 'USDT', amount: 20n },
      { symbol: 'USDC', amount: 11n }
    ])
  })

  it('returns zeros for all assets when dryRun reports failureReason for currency arrays', async () => {
    const usdt = { symbol: 'USDT', decimals: 6 } as TAssetInfo
    const usdc = { symbol: 'USDC', decimals: 6 } as TAssetInfo

    vi.mocked(resolveFeeAsset).mockReturnValue(usdt)
    vi.mocked(resolveCurrency).mockReturnValue({
      assets: [
        { ...usdt, amount: 100n, isFeeAsset: true },
        { ...usdc, amount: 200n, isFeeAsset: false }
      ],
      asset: { ...usdt, amount: 100n, isFeeAsset: true }
    })
    findAssetOnDestOrThrowSpy.mockReturnValue(usdt)
    findNativeAssetInfoOrThrowSpy.mockReturnValue({ symbol: 'NATIVE' } as TAssetInfo)
    vi.mocked(getEdFromAssetOrThrow).mockReturnValue(10n)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(0n)
    vi.mocked(getXcmFee).mockResolvedValue({
      success: true,
      origin: { asset: { symbol: 'USDT' } as TAssetInfo, fee: 2n, feeType: 'dryRun' },
      hops: [],
      destination: { asset: { symbol: 'USDT' } as TAssetInfo, fee: 7n, feeType: 'dryRun' }
    })
    buildInternal.mockResolvedValue({})
    vi.mocked(dryRunInternal).mockResolvedValue({
      success: false,
      dryRunError: { reason: 'failed' }
    } as TDryRunResult)

    const res = await mod.getMinTransferableAmountInternal({
      ...baseOptions,
      feeAsset: { symbol: 'USDT' },
      currency: [
        { symbol: 'USDT', amount: 100n },
        { symbol: 'USDC', amount: 200n }
      ]
    })

    expect(res).toEqual([0n, 0n])
  })

  it('adds origin/hops/destination (matching asset), ED (when dest balance is 0), plus 1', async () => {
    const asset = { symbol: 'ASSET', decimals: 12 } as TAssetInfo
    const destAsset = { symbol: 'ASSET', location: {} } as TAssetInfo
    const nativeAsset = { symbol: 'ASSET' } as TAssetInfo

    mockResolvedAsset(asset)
    findAssetOnDestOrThrowSpy.mockReturnValue(destAsset)
    findNativeAssetInfoOrThrowSpy.mockReturnValue(nativeAsset)
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
    buildInternal.mockResolvedValue({})

    const cloneSpy = vi.spyOn(api, 'clone')
    const destInitSpy = vi.spyOn(destApi, 'init')

    const res = await mod.getMinTransferableAmountInternal(baseOptions)

    // 2 + 3 + 7 + 10 + 1 = 23
    expect(res).toBe(23n)

    expect(validateAddress).toHaveBeenCalledWith(api, 'SENDER', 'Acala', false)
    expect(cloneSpy).toHaveBeenCalled()
    expect(destInitSpy).toHaveBeenCalledWith('Astar')
    expect(getAssetBalanceInternal).toHaveBeenCalledWith(
      expect.objectContaining({
        api: destApi,
        address: 'DEST_ADDR',
        chain: 'Astar',
        asset: destAsset
      })
    )
    expect(getXcmFee).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: 'Acala',
        destination: 'Astar',
        disableFallback: false,
        currency: expect.objectContaining({ amount: 100n })
      })
    )
    expect(currencySpy).toHaveBeenCalledWith(expect.objectContaining({ amount: 23n }))
    expect(buildInternal).toHaveBeenCalled()
    expect(dryRunInternal).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: expect.objectContaining({ amount: 23n })
      })
    )
    expect(isAssetEqual).toBeDefined()
  })

  it('no ED when dest balance > 0; origin fee counts when feeAsset resolves to sending asset', async () => {
    const asset = { symbol: 'A' } as TAssetInfo
    const destAssetNoLoc = { symbol: 'A' } as TAssetInfo
    const nativeAsset = { symbol: 'B' } as TAssetInfo
    const resolvedFee = { symbol: 'A' } as TAssetInfo

    mockResolvedAsset(asset)
    findAssetOnDestOrThrowSpy.mockReturnValue(destAssetNoLoc)
    findNativeAssetInfoOrThrowSpy.mockReturnValue(nativeAsset)
    vi.mocked(resolveFeeAsset).mockReturnValue(resolvedFee)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(5n)
    vi.mocked(getEdFromAssetOrThrow).mockReturnValue(999n) // ignored due to balance>0
    vi.mocked(getXcmFee).mockResolvedValue({
      success: true,
      origin: { asset: { symbol: 'A' } as TAssetInfo, fee: 5n, feeType: 'dryRun' },
      hops: [],
      destination: {} as TXcmFeeDetail
    })

    const out = await mod.getMinTransferableAmountInternal({
      ...baseOptions,
      destination: 'Hydration',
      feeAsset: { symbol: 'FEE' }
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
    mockResolvedAsset({ symbol: 'A' } as TAssetInfo)
    findAssetOnDestOrThrowSpy.mockReturnValue({
      symbol: 'A',
      location: {}
    } as TAssetInfo)
    findNativeAssetInfoOrThrowSpy.mockReturnValue({ symbol: 'A' } as TAssetInfo)
    vi.mocked(getEdFromAssetOrThrow).mockReturnValue(1n)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(0n)
    vi.mocked(getXcmFee).mockResolvedValue({
      success: true,
      origin: { asset: { symbol: 'A' } as TAssetInfo, fee: 1n, feeType: 'dryRun' },
      hops: [],
      destination: {} as TXcmFeeDetail
    })
    vi.mocked(dryRunInternal).mockResolvedValue({
      success: false,
      dryRunError: { reason: 'Nope' }
    } as TDryRunResult)

    const res = await mod.getMinTransferableAmountInternal({
      ...baseOptions,
      destination: 'Hydration'
    })

    expect(res).toBe(0n)
  })

  it('skips unrelated fees when assets differ; only ED + 1 when dest balance is 0', async () => {
    mockResolvedAsset({ symbol: 'A' } as TAssetInfo)
    findNativeAssetInfoOrThrowSpy.mockReturnValue({ symbol: 'B' } as TAssetInfo)
    findAssetOnDestOrThrowSpy.mockReturnValue({
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
      ...baseOptions,
      destination: 'Hydration'
    })

    // Only ED(4) + 1
    expect(out).toBe(5n)
  })

  it('returns 0n when createTx keeps failing with AmountTooLowError (even after padding)', async () => {
    mockResolvedAsset({
      symbol: 'ASSET',
      decimals: 12
    } as TAssetInfo)
    findAssetOnDestOrThrowSpy.mockReturnValue({
      symbol: 'ASSET',
      location: {}
    } as TAssetInfo)
    findNativeAssetInfoOrThrowSpy.mockReturnValue({
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
    buildInternal.mockRejectedValue(error)

    const result = await mod.getMinTransferableAmountInternal(baseOptions)

    expect(result).toBe(0n)
    expect(dryRunInternal).not.toHaveBeenCalled()
  })
})

describe('getMinTransferableAmount', () => {
  it('sets disconnectAllowed to false, then restores to true and disconnects', async () => {
    vi.mocked(getEdFromAssetOrThrow).mockReturnValue(0n)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(1n)
    vi.mocked(isAssetEqual).mockReturnValue(true)
    vi.mocked(getXcmFee).mockResolvedValue({
      origin: undefined,
      hops: [],
      destination: undefined
    } as unknown as TGetXcmFeeResult)
    vi.mocked(dryRunInternal).mockResolvedValue({ success: true } as TDryRunResult)
    vi.mocked(resolveCurrency).mockReturnValue({
      assets: [{ symbol: 'A', decimals: 10, amount: 100n } as WithAmount<TAssetInfo>],
      asset: { symbol: 'A', decimals: 10, amount: 100n } as WithAmount<TAssetInfo>
    })

    const disconnectAllowedValues: boolean[] = []
    const destApi = { init: vi.fn() } as unknown as PolkadotApi<unknown, unknown, unknown>
    const mockApi = {
      get disconnectAllowed() {
        return disconnectAllowedValues[disconnectAllowedValues.length - 1] ?? true
      },
      set disconnectAllowed(val: boolean) {
        disconnectAllowedValues.push(val)
      },
      clone: vi.fn(() => destApi),
      disconnect: vi.fn(),
      findAssetInfoOrThrow: vi.fn().mockReturnValue({ symbol: 'A', decimals: 10 }),
      findAssetOnDestOrThrow: vi.fn().mockReturnValue({
        symbol: 'A',
        location: {}
      }),
      findNativeAssetInfoOrThrow: vi.fn().mockReturnValue({ symbol: 'A' })
    } as unknown as PolkadotApi<unknown, unknown, unknown>

    const disconnectSpy = vi.spyOn(mockApi, 'disconnect')

    const mockBuilder = {
      currency: vi.fn().mockReturnThis(),
      buildInternal: vi.fn().mockResolvedValue({})
    }

    const result = await mod.getMinTransferableAmount({
      api: mockApi,
      origin: 'Acala',
      sender: 'SENDER',
      recipient: 'DEST',
      destination: 'Astar',
      currency: { symbol: 'A', amount: 1n },
      builder: mockBuilder,
      version: Version.V5,
      buildTx: vi.fn()
    } as unknown as TGetMinTransferableAmountOptions<unknown, unknown, unknown>)

    expect(result).toBe(1n)
    expect(disconnectAllowedValues).toEqual([false, true])
    expect(disconnectSpy).toHaveBeenCalled()
  })
})
