import type { TAssetInfo } from '@paraspell/assets'
import {
  findAssetInfoOrThrow,
  findAssetOnDestOrThrow,
  findNativeAssetInfoOrThrow,
  getEdFromAssetOrThrow,
  isAssetEqual
} from '@paraspell/assets'
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
  TTransferBaseOptionsWithSender
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

describe('getMinTransferableAmountInternal', () => {
  // eslint-disable-next-line @typescript-eslint/require-await
  const buildTx = vi.fn(async () => ({}))

  const destApi = { init: vi.fn() } as unknown as PolkadotApi<unknown, unknown, unknown>
  const api = {
    clone: vi.fn(() => destApi),
    setDisconnectAllowed: vi.fn(),
    disconnect: vi.fn()
  } as unknown as PolkadotApi<unknown, unknown, unknown>

  const mockBuilder = {
    currency: vi.fn().mockReturnThis(),
    buildInternal: vi.fn().mockReturnValue({})
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
    vi.mocked(abstractDecimals).mockReturnValue(100n)
    vi.mocked(isAssetEqual).mockImplementation((a, b) => a?.symbol === b?.symbol)
    vi.mocked(resolveFeeAsset).mockReturnValue(undefined)
    vi.mocked(dryRunInternal).mockResolvedValue({} as TDryRunResult)
    vi.mocked(isAssetEqual).mockImplementation((a, b) => a?.symbol === b?.symbol)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('adds origin/hops/destination (matching asset), ED (when dest balance is 0), plus 1', async () => {
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
    const buildSpy = vi.spyOn(mockBuilder as any, 'buildInternal').mockResolvedValue({})

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
      ...baseOptions,
      destination: 'Hydration'
    })

    expect(res).toBe(0n)
  })

  it('skips unrelated fees when assets differ; only ED + 1 when dest balance is 0', async () => {
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
      ...baseOptions,
      destination: 'Hydration'
    })

    // Only ED(4) + 1
    expect(out).toBe(5n)
  })

  it('returns 0n when createTx keeps failing with AmountTooLowError (even after padding)', async () => {
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

    const result = await mod.getMinTransferableAmountInternal(baseOptions)

    expect(result).toBe(0n)
    expect(dryRunInternal).not.toHaveBeenCalled()
  })
})

describe('getMinTransferableAmount', () => {
  it('sets disconnectAllowed to false, then restores to true and disconnects', async () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ symbol: 'A', decimals: 10 } as TAssetInfo)
    vi.mocked(findAssetOnDestOrThrow).mockReturnValue({
      symbol: 'A',
      location: {}
    } as TAssetInfo)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({ symbol: 'A' } as TAssetInfo)
    vi.mocked(getEdFromAssetOrThrow).mockReturnValue(0n)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(1n)
    vi.mocked(abstractDecimals).mockReturnValue(100n)
    vi.mocked(isAssetEqual).mockReturnValue(true)
    vi.mocked(getXcmFee).mockResolvedValue({
      origin: undefined,
      hops: [],
      destination: undefined
    } as unknown as TGetXcmFeeResult)
    vi.mocked(dryRunInternal).mockResolvedValue({} as TDryRunResult)

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
      disconnect: vi.fn()
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
