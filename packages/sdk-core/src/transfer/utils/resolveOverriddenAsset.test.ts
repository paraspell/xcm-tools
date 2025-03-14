import type {
  TAsset,
  TMultiAsset,
  TMultiAssetWithFee,
  TMultiLocationValueWithOverride
} from '@paraspell/assets'
import {
  findAsset,
  InvalidCurrencyError,
  isAssetEqual,
  isForeignAsset,
  isOverrideMultiLocationSpecifier,
  isTMultiAsset
} from '@paraspell/assets'
import { isTMultiLocation, type TMultiLocation } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type ParachainNode from '../../nodes/ParachainNode'
import { createMultiAsset } from '../../pallets/xcmPallet/utils'
import type { TSendOptions } from '../../types'
import { getNode } from '../../utils'
import { resolveOverriddenAsset } from './resolveOverriddenAsset'
import { validateAssetSupport } from './validationUtils'

vi.mock('../../pallets/xcmPallet/utils', () => ({
  createMultiAsset: vi.fn()
}))

vi.mock('../../utils', () => ({
  getNode: vi.fn()
}))

vi.mock('@paraspell/sdk-common', () => ({
  isTMultiLocation: vi.fn(),
  Parents: vi.fn(),
  deepEqual: vi.fn()
}))

vi.mock('@paraspell/assets', () => ({
  findAsset: vi.fn(),
  createMultiAsset: vi.fn(),
  isTMultiAsset: vi.fn(),
  isForeignAsset: vi.fn(),
  isAssetEqual: vi.fn(),
  isOverrideMultiLocationSpecifier: vi.fn(),
  extractMultiAssetLoc: vi.fn().mockResolvedValue({} as TMultiLocation),
  InvalidCurrencyError: class extends Error {}
}))

vi.mock('./validationUtils', () => ({
  validateAssetSupport: vi.fn()
}))

describe('resolveOverriddenAsset', () => {
  const mockOriginNode = { version: 'testVersion' } as unknown as ParachainNode<unknown, unknown>
  const mockOrigin = 'Acala'
  const mockDestination = {} as TMultiLocation

  const defaultOptions = {
    currency: { symbol: 'TEST', amount: '1000' },
    from: mockOrigin,
    to: mockDestination
  } as TSendOptions<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(isOverrideMultiLocationSpecifier).mockReturnValue(false)
    vi.mocked(isTMultiAsset).mockReturnValue(false)
    vi.mocked(isTMultiLocation).mockReturnValue(false)
    vi.mocked(getNode).mockReturnValue(mockOriginNode)
    vi.mocked(isForeignAsset).mockReturnValue(true)
    vi.mocked(createMultiAsset).mockReturnValue({} as TMultiAsset)
    vi.mocked(findAsset).mockReturnValue({
      multiLocation: {} as TMultiLocation
    } as TAsset)
  })

  it('returns the overridden multiLocation if currency has override multilocation', () => {
    const options = {
      ...defaultOptions,
      currency: {
        multilocation: {
          type: 'Override',
          value: {} as TMultiLocation
        } as TMultiLocationValueWithOverride,
        amount: '1000'
      }
    } as TSendOptions<unknown, unknown>

    vi.mocked(isOverrideMultiLocationSpecifier).mockReturnValue(true)

    const result = resolveOverriddenAsset(options, false, false, {} as TAsset)
    expect(result).toEqual({})
  })

  it('returns multiasset if all items in currency.multiasset are already TMultiAsset', () => {
    const multiasset = [{}, {}] as TMultiAssetWithFee[]
    const options = {
      ...defaultOptions,
      currency: { multiasset },
      feeAsset: { multilocation: {} }
    } as TSendOptions<unknown, unknown>

    vi.mocked(isTMultiAsset).mockReturnValue(true)

    const result = resolveOverriddenAsset(options, false, false, { symbol: 'ASSET2' } as TAsset)
    expect(result).toEqual(multiasset)
  })

  it('resolves multiasset by fetching assets when not all items are TMultiAsset', () => {
    const multiasset = [
      { symbol: 'ASSET1', amount: '1000' },
      { symbol: 'ASSET2', amount: '2000' }
    ]
    const options = {
      ...defaultOptions,
      currency: { multiasset },
      feeAsset: { symbol: 'ASSET2' }
    }

    vi.mocked(isTMultiAsset).mockImplementationOnce(() => false)
    vi.mocked(isTMultiLocation).mockReturnValue(false)
    vi.mocked(isAssetEqual).mockReturnValueOnce(false).mockReturnValueOnce(true)

    const result = resolveOverriddenAsset(options, false, true, { symbol: 'DOT' } as TAsset)

    expect(validateAssetSupport).toHaveBeenCalledTimes(2)
    expect(findAsset).toHaveBeenCalledTimes(multiasset.length)
    expect(createMultiAsset).toHaveBeenCalledTimes(multiasset.length)
    expect(result).toEqual([
      {
        isFeeAsset: false
      },
      {
        isFeeAsset: true
      }
    ])
  })

  it('throws an InvalidCurrencyError if fetched asset has no multiLocation', () => {
    const multiasset = [{ symbol: 'ASSET_NO_LOCATION', amount: '500' }]
    const options = {
      ...defaultOptions,
      currency: { multiasset }
    }

    vi.mocked(isTMultiAsset).mockImplementationOnce(() => false)
    vi.mocked(findAsset).mockReturnValue({} as TAsset)

    expect(() => resolveOverriddenAsset(options, false, false, {} as TAsset)).toThrow(
      InvalidCurrencyError
    )
  })

  it('throws an InvalidCurrencyError if using raw multi-assets and no fee asset is provided', () => {
    const options = {
      ...defaultOptions,
      currency: { multiasset: [{}, {}] }
    } as TSendOptions<unknown, unknown>

    vi.mocked(isTMultiAsset).mockReturnValue(true)

    expect(() => resolveOverriddenAsset(options, false, false, {} as TAsset)).toThrow(
      'Overridden multi assets cannot be used without specifying fee asset'
    )
  })

  it('throws an InvalidCurrencyError if using raw multi-assets and no fee asset by not multi-location', () => {
    const options = {
      ...defaultOptions,
      currency: { multiasset: [{}, {}] },
      feeAsset: { symbol: 'ASSET' }
    } as TSendOptions<unknown, unknown>

    vi.mocked(isOverrideMultiLocationSpecifier).mockReturnValue(false)
    vi.mocked(isTMultiAsset).mockReturnValue(true)

    expect(() =>
      resolveOverriddenAsset(options, false, false, { symbol: 'ASSET' } as TAsset)
    ).toThrow('Fee asset must be specified by multilocation when using raw overridden multi assets')
  })

  it('throws an InvalidCurrencyError if using raw multi-assets and no fee asset uses override multi-location', () => {
    const options = {
      ...defaultOptions,
      currency: { multiasset: [{}, {}] },
      feeAsset: {
        multilocation: {
          type: 'Override',
          value: {}
        }
      }
    } as TSendOptions<unknown, unknown>

    vi.mocked(isOverrideMultiLocationSpecifier).mockReturnValue(true)
    vi.mocked(isTMultiAsset).mockReturnValue(true)

    expect(() => resolveOverriddenAsset(options, false, false, {} as TAsset)).toThrow(
      'Fee asset cannot be an overridden multi location specifier'
    )
  })

  it('returns undefined if currency has no multiasset or multilocation', () => {
    const options = {
      ...defaultOptions,
      currency: { symbol: 'NO_OVERRIDE' }
    } as TSendOptions<unknown, unknown>

    const result = resolveOverriddenAsset(options, false, false, {} as TAsset)
    expect(result).toBeUndefined()
  })
})
