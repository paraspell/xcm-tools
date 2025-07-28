import type {
  TAssetInfo,
  TAssetWithFee,
  TLocationValueWithOverride,
  TAsset
} from '@paraspell/assets'
import {
  findAssetInfo,
  InvalidCurrencyError,
  isAssetEqual,
  isForeignAsset,
  isOverrideLocationSpecifier,
  isTAsset
} from '@paraspell/assets'
import type { TLocation } from '@paraspell/sdk-common'
import { isTLocation } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type AssetHubPolkadot from '../../nodes/supported/AssetHubPolkadot'
import type { TSendOptions } from '../../types'
import { getNode } from '../../utils'
import { createAsset } from '../../utils/asset'
import { resolveOverriddenAsset } from './resolveOverriddenAsset'
import { validateAssetSupport } from './validateAssetSupport'

vi.mock('../../utils/asset', () => ({
  createAsset: vi.fn()
}))

vi.mock('../../utils', () => ({
  getNode: vi.fn()
}))

vi.mock('@paraspell/sdk-common', () => ({
  isTLocation: vi.fn(),
  Parents: vi.fn(),
  deepEqual: vi.fn()
}))

vi.mock('@paraspell/assets', () => ({
  findAssetInfo: vi.fn(),
  isTAsset: vi.fn(),
  isForeignAsset: vi.fn(),
  isAssetEqual: vi.fn(),
  isOverrideLocationSpecifier: vi.fn(),
  extractAssetLocation: vi.fn().mockResolvedValue({} as TLocation),
  InvalidCurrencyError: class extends Error {}
}))

vi.mock('./validateAssetSupport', () => ({
  validateAssetSupport: vi.fn()
}))

describe('resolveOverriddenAsset', () => {
  const mockOriginNode = { version: 'testVersion' } as unknown as AssetHubPolkadot<unknown, unknown>
  const mockOrigin = 'Acala'
  const mockDestination = {} as TLocation

  const defaultOptions = {
    currency: { symbol: 'TEST', amount: '1000' },
    from: mockOrigin,
    to: mockDestination
  } as TSendOptions<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(isOverrideLocationSpecifier).mockReturnValue(false)
    vi.mocked(isTAsset).mockReturnValue(false)
    vi.mocked(isTLocation).mockReturnValue(false)
    vi.mocked(getNode).mockReturnValue(mockOriginNode)
    vi.mocked(isForeignAsset).mockReturnValue(true)
    vi.mocked(createAsset).mockReturnValue({} as TAsset)
    vi.mocked(findAssetInfo).mockReturnValue({
      location: {}
    } as TAssetInfo)
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
    } as TSendOptions<unknown, unknown>

    vi.mocked(isOverrideLocationSpecifier).mockReturnValue(true)

    const result = resolveOverriddenAsset(options, false, false, {} as TAssetInfo)
    expect(result).toEqual({})
  })

  it('returns multiasset if all items in currency.multiasset are already TAsset', () => {
    const multiasset = [
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
      currency: { multiasset },
      feeAsset: { location: {} }
    } as TSendOptions<unknown, unknown>

    vi.mocked(isTAsset).mockReturnValue(true)

    const result = resolveOverriddenAsset(options, false, false, { symbol: 'ASSET2' } as TAssetInfo)
    expect(result).toEqual(multiasset)
  })

  it('resolves multiasset by fetching assets when not all items are TAsset', () => {
    const multiasset = [
      { symbol: 'ASSET1', amount: 1000n },
      { symbol: 'ASSET2', amount: 2000n }
    ]
    const options = {
      ...defaultOptions,
      currency: { multiasset },
      feeAsset: { symbol: 'ASSET2' }
    }

    vi.mocked(isTAsset).mockImplementationOnce(() => false)
    vi.mocked(isTLocation).mockReturnValue(false)
    vi.mocked(isAssetEqual).mockReturnValueOnce(false).mockReturnValueOnce(true)

    const result = resolveOverriddenAsset(options, false, true, { symbol: 'DOT' } as TAssetInfo)

    expect(validateAssetSupport).toHaveBeenCalledTimes(2)
    expect(findAssetInfo).toHaveBeenCalledTimes(multiasset.length)
    expect(createAsset).toHaveBeenCalledTimes(multiasset.length)
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
    const asset = [{ symbol: 'ASSET_NO_LOCATION', amount: 500n }]
    const options = {
      ...defaultOptions,
      currency: { multiasset: asset }
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
      currency: { multiasset: [{}, {}] }
    } as TSendOptions<unknown, unknown>

    vi.mocked(isTAsset).mockReturnValue(true)

    expect(() => resolveOverriddenAsset(options, false, false, {} as TAssetInfo)).toThrow(
      'Overridden multi assets cannot be used without specifying fee asset'
    )
  })

  it('throws an InvalidCurrencyError if using raw multi-assets and no fee asset by not multi-location', () => {
    const options = {
      ...defaultOptions,
      currency: { multiasset: [{}, {}] },
      feeAsset: { symbol: 'ASSET' }
    } as TSendOptions<unknown, unknown>

    vi.mocked(isOverrideLocationSpecifier).mockReturnValue(false)
    vi.mocked(isTAsset).mockReturnValue(true)

    expect(() =>
      resolveOverriddenAsset(options, false, false, { symbol: 'ASSET' } as TAssetInfo)
    ).toThrow('Fee asset must be specified by location when using raw overridden multi assets')
  })

  it('throws an InvalidCurrencyError if using raw multi-assets and no fee asset uses override location', () => {
    const options = {
      ...defaultOptions,
      currency: { multiasset: [{}, {}] },
      feeAsset: {
        location: {
          type: 'Override',
          value: {}
        }
      }
    } as TSendOptions<unknown, unknown>

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
    } as TSendOptions<unknown, unknown>

    const result = resolveOverriddenAsset(options, false, false, {} as TAssetInfo)
    expect(result).toBeUndefined()
  })
})
