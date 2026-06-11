import type {
  TAsset,
  TAssetInfo,
  TAssetWithFee,
  TLocationValueWithOverride
} from '@paraspell/assets'
import { isAssetEqual, isOverrideLocationSpecifier, isTAsset } from '@paraspell/assets'
import type { TLocation } from '@paraspell/sdk-common'
import { isTLocation } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import type { TSubstrateTransferOptions } from '../../types'
import { abstractDecimals, createAsset, sortAssets } from '../../utils'
import { resolveOverriddenAsset } from './resolveOverriddenAsset'
import { validateAssetSupport } from './validateAssetSupport'

vi.mock('../../utils')
vi.mock('../abstractDecimals')
vi.mock('./validateAssetSupport')

vi.mock('@paraspell/sdk-common')
vi.mock('@paraspell/assets', () => ({
  isTAsset: vi.fn(),
  isAssetEqual: vi.fn(),
  isOverrideLocationSpecifier: vi.fn(),
  extractAssetLocation: vi.fn().mockResolvedValue({}),
  InvalidCurrencyError: class extends Error {}
}))

describe('resolveOverriddenAsset', () => {
  const mockOrigin = 'Acala'
  const mockDestination = {} as TLocation

  const mockApi = {
    findAssetInfo: vi.fn()
  } as unknown as PolkadotApi<unknown, unknown, unknown>

  const defaultOptions = {
    api: mockApi,
    currency: { symbol: 'TEST', amount: '1000' },
    from: mockOrigin,
    to: mockDestination
  } as TSubstrateTransferOptions<unknown, unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(isOverrideLocationSpecifier).mockReturnValue(false)
    vi.mocked(isTAsset).mockReturnValue(false)
    vi.mocked(isTLocation).mockReturnValue(false)
    vi.mocked(createAsset).mockReturnValue({} as TAsset)
    vi.spyOn(mockApi, 'findAssetInfo').mockReturnValue({
      location: {}
    } as TAssetInfo)
    vi.mocked(abstractDecimals).mockImplementation(amount => BigInt(amount))
    vi.mocked(sortAssets).mockImplementation(assets => assets)
  })

  it('returns the overridden location if currency has override location', () => {
    const options = {
      ...defaultOptions,
      currency: {
        location: {
          type: 'Override',
          value: {}
        } as TLocationValueWithOverride,
        amount: '1000'
      }
    } as TSubstrateTransferOptions<unknown, unknown, unknown>

    vi.mocked(isOverrideLocationSpecifier).mockReturnValue(true)

    const result = resolveOverriddenAsset(options, false, false, {} as TAssetInfo)
    expect(result).toEqual({})
  })

  it('throws when using raw TAsset overrides', () => {
    const assets = [
      {
        fun: {
          Fungible: 1000n
        }
      },
      {
        fun: {
          Fungible: 2000n
        }
      }
    ] as TAssetWithFee[]
    const options = {
      ...defaultOptions,
      currency: assets,
      feeAsset: { location: {} }
    } as TSubstrateTransferOptions<unknown, unknown, unknown>

    vi.mocked(isTAsset).mockReturnValue(true)

    expect(() =>
      resolveOverriddenAsset(options, false, false, { symbol: 'ASSET2' } as TAssetInfo)
    ).toThrow('Raw asset overrides are no longer supported. Please use custom assets instead.')
  })

  it('resolves currencies by fetching assets when not all items are TAsset', () => {
    const assets = [
      { symbol: 'ASSET1', amount: 1000n },
      { symbol: 'ASSET2', amount: 2000n }
    ]
    const options = {
      ...defaultOptions,
      currency: assets,
      feeAsset: { symbol: 'ASSET2' }
    }

    vi.mocked(isTAsset).mockImplementationOnce(() => false)
    vi.mocked(isTLocation).mockReturnValue(false)
    vi.mocked(isAssetEqual).mockReturnValueOnce(false).mockReturnValueOnce(true)

    const spy = vi.spyOn(mockApi, 'findAssetInfo')

    const result = resolveOverriddenAsset(options, false, true, { symbol: 'DOT' } as TAssetInfo)

    expect(validateAssetSupport).toHaveBeenCalledTimes(2)
    expect(spy).toHaveBeenCalledTimes(assets.length)
    expect(createAsset).toHaveBeenCalledTimes(assets.length)
    expect(result).toEqual([
      {
        isFeeAsset: false
      },
      {
        isFeeAsset: true
      }
    ])
  })

  it('throws an InvalidCurrencyError if using raw TAsset overrides and no fee asset is provided', () => {
    const options = {
      ...defaultOptions,
      currency: [{}, {}]
    } as TSubstrateTransferOptions<unknown, unknown, unknown>

    vi.mocked(isTAsset).mockReturnValue(true)

    expect(() => resolveOverriddenAsset(options, false, false, {} as TAssetInfo)).toThrow(
      'Overridden assets cannot be used without specifying fee asset'
    )
  })

  it('throws an InvalidCurrencyError if using raw TAsset overrides and fee asset uses override location', () => {
    const options = {
      ...defaultOptions,
      currency: [{}, {}],
      feeAsset: {
        location: {
          type: 'Override',
          value: {}
        }
      }
    } as TSubstrateTransferOptions<unknown, unknown, unknown>

    vi.mocked(isOverrideLocationSpecifier).mockReturnValue(true)
    vi.mocked(isTAsset).mockReturnValue(true)

    expect(() => resolveOverriddenAsset(options, false, false, {} as TAssetInfo)).toThrow(
      'Fee asset cannot be an overridden location specifier'
    )
  })

  it('returns undefined if currency is not an array or override location', () => {
    const options = {
      ...defaultOptions,
      currency: { symbol: 'NO_OVERRIDE' }
    } as TSubstrateTransferOptions<unknown, unknown, unknown>

    const result = resolveOverriddenAsset(options, false, false, {} as TAssetInfo)
    expect(result).toBeUndefined()
  })
})
