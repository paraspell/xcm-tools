import type {
  TAsset,
  TAssetInfo,
  TAssetWithFee,
  TLocationValueWithOverride
} from '@paraspell/assets'
import {
  findAssetInfo,
  InvalidCurrencyError,
  isAssetEqual,
  isOverrideLocationSpecifier,
  isTAsset
} from '@paraspell/assets'
import type { TLocation } from '@paraspell/sdk-common'
import { isTLocation } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import type { TSendOptions } from '../../types'
import { abstractDecimals, createAsset } from '../../utils'
import { resolveOverriddenAsset } from './resolveOverriddenAsset'
import { validateAssetSupport } from './validateAssetSupport'

vi.mock('../../utils')
vi.mock('../abstractDecimals')
vi.mock('./validateAssetSupport')

vi.mock('@paraspell/sdk-common')
vi.mock('@paraspell/assets', () => ({
  findAssetInfo: vi.fn(),
  isTAsset: vi.fn(),
  isAssetEqual: vi.fn(),
  isOverrideLocationSpecifier: vi.fn(),
  extractAssetLocation: vi.fn().mockResolvedValue({} as TLocation),
  InvalidCurrencyError: class extends Error {}
}))

describe('resolveOverriddenAsset', () => {
  const mockOrigin = 'Acala'
  const mockDestination = {} as TLocation

  const defaultOptions = {
    api: {} as unknown as IPolkadotApi<unknown, unknown, unknown>,
    currency: { symbol: 'TEST', amount: '1000' },
    from: mockOrigin,
    to: mockDestination
  } as TSendOptions<unknown, unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(isOverrideLocationSpecifier).mockReturnValue(false)
    vi.mocked(isTAsset).mockReturnValue(false)
    vi.mocked(isTLocation).mockReturnValue(false)
    vi.mocked(createAsset).mockReturnValue({} as TAsset)
    vi.mocked(findAssetInfo).mockReturnValue({
      location: {}
    } as TAssetInfo)
    vi.mocked(abstractDecimals).mockImplementation(amount => BigInt(amount))
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
    } as TSendOptions<unknown, unknown, unknown>

    vi.mocked(isOverrideLocationSpecifier).mockReturnValue(true)

    const result = resolveOverriddenAsset(options, false, false, {} as TAssetInfo)
    expect(result).toEqual({})
  })

  it('returns multiple assets if all items in currency are already TAsset', () => {
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
    } as TSendOptions<unknown, unknown, unknown>

    vi.mocked(isTAsset).mockReturnValue(true)

    const result = resolveOverriddenAsset(options, false, false, { symbol: 'ASSET2' } as TAssetInfo)
    expect(result).toEqual(assets)
  })

  it('resolves multiple assets by fetching assets when not all items are TAsset', () => {
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

    const result = resolveOverriddenAsset(options, false, true, { symbol: 'DOT' } as TAssetInfo)

    expect(validateAssetSupport).toHaveBeenCalledTimes(2)
    expect(findAssetInfo).toHaveBeenCalledTimes(assets.length)
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

  it('throws an InvalidCurrencyError if fetched asset has no location', () => {
    const assets = [{ symbol: 'ASSET_NO_LOCATION', amount: 500n }]
    const options = {
      ...defaultOptions,
      currency: assets
    }

    vi.mocked(isTAsset).mockImplementationOnce(() => false)
    vi.mocked(findAssetInfo).mockReturnValue({} as TAssetInfo)

    expect(() => resolveOverriddenAsset(options, false, false, {} as TAssetInfo)).toThrow(
      InvalidCurrencyError
    )
  })

  it('throws an InvalidCurrencyError if using raw multi-assets and no fee asset is provided', () => {
    const options = {
      ...defaultOptions,
      currency: [{}, {}]
    } as TSendOptions<unknown, unknown, unknown>

    vi.mocked(isTAsset).mockReturnValue(true)

    expect(() => resolveOverriddenAsset(options, false, false, {} as TAssetInfo)).toThrow(
      'Overridden multi assets cannot be used without specifying fee asset'
    )
  })

  it('throws an InvalidCurrencyError if using raw multi-assets and no fee asset by not location', () => {
    const options = {
      ...defaultOptions,
      currency: [{}, {}],
      feeAsset: { symbol: 'ASSET' }
    } as TSendOptions<unknown, unknown, unknown>

    vi.mocked(isOverrideLocationSpecifier).mockReturnValue(false)
    vi.mocked(isTAsset).mockReturnValue(true)

    expect(() =>
      resolveOverriddenAsset(options, false, false, { symbol: 'ASSET' } as TAssetInfo)
    ).toThrow('Fee asset must be specified by location when using raw overridden multi assets')
  })

  it('throws an InvalidCurrencyError if using raw multi-assets and no fee asset uses override location', () => {
    const options = {
      ...defaultOptions,
      currency: [{}, {}],
      feeAsset: {
        location: {
          type: 'Override',
          value: {}
        }
      }
    } as TSendOptions<unknown, unknown, unknown>

    vi.mocked(isOverrideLocationSpecifier).mockReturnValue(true)
    vi.mocked(isTAsset).mockReturnValue(true)

    expect(() => resolveOverriddenAsset(options, false, false, {} as TAssetInfo)).toThrow(
      'Fee asset cannot be an overridden location specifier'
    )
  })

  it('returns undefined if currency has no multiasset or location', () => {
    const options = {
      ...defaultOptions,
      currency: { symbol: 'NO_OVERRIDE' }
    } as TSendOptions<unknown, unknown, unknown>

    const result = resolveOverriddenAsset(options, false, false, {} as TAssetInfo)
    expect(result).toBeUndefined()
  })
})
