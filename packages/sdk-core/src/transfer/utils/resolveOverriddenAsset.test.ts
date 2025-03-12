import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InvalidCurrencyError } from '../../errors'
import type ParachainNode from '../../nodes/ParachainNode'
import { getAssetBySymbolOrId } from '../../pallets/assets/getAssetBySymbolOrId'
import { createMultiAsset, isTMultiAsset, isTMultiLocation } from '../../pallets/xcmPallet/utils'
import type {
  TAsset,
  TMultiAsset,
  TMultiAssetWithFee,
  TMultiLocation,
  TMultiLocationValueWithOverride,
  TSendOptions
} from '../../types'
import { getNode, isAssetEqual, isForeignAsset } from '../../utils'
import { isOverrideMultiLocationSpecifier } from '../../utils/multiLocation/isOverrideMultiLocationSpecifier'
import { resolveOverriddenAsset } from './resolveOverriddenAsset'
import { validateAssetSupport } from './validationUtils'

vi.mock('../../utils', () => ({
  getNode: vi.fn(),
  isForeignAsset: vi.fn(),
  isAssetEqual: vi.fn()
}))

vi.mock('../../utils/multiLocation/isOverrideMultiLocationSpecifier', () => ({
  isOverrideMultiLocationSpecifier: vi.fn()
}))

vi.mock('../../pallets/assets/getAssetBySymbolOrId', () => ({
  getAssetBySymbolOrId: vi.fn()
}))

vi.mock('../../pallets/xcmPallet/utils', () => ({
  createMultiAsset: vi.fn(),
  isTMultiAsset: vi.fn(),
  isTMultiLocation: vi.fn()
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
    vi.clearAllMocks()
    vi.mocked(isOverrideMultiLocationSpecifier).mockReturnValue(false)
    vi.mocked(isTMultiAsset).mockReturnValue(false)
    vi.mocked(isTMultiLocation).mockReturnValue(false)
    vi.mocked(getNode).mockReturnValue(mockOriginNode)
    vi.mocked(isForeignAsset).mockReturnValue(true)
    vi.mocked(createMultiAsset).mockReturnValue({} as TMultiAsset)
    vi.mocked(getAssetBySymbolOrId).mockReturnValue({
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
      currency: { multiasset }
    } as TSendOptions<unknown, unknown>

    vi.mocked(isTMultiAsset).mockReturnValue(true)

    const result = resolveOverriddenAsset(options, false, false, {} as TAsset)
    expect(result).toEqual(multiasset)
  })

  it('resolves multiasset by fetching assets when not all items are TMultiAsset', () => {
    const multiasset = [
      { symbol: 'ASSET1', amount: '1000' },
      { symbol: 'ASSET2', amount: '2000', isFeeAsset: true }
    ]
    const options = {
      ...defaultOptions,
      currency: { multiasset }
    }

    vi.mocked(isTMultiAsset).mockImplementationOnce(() => false)
    vi.mocked(isTMultiLocation).mockReturnValue(false)
    vi.mocked(isAssetEqual).mockReturnValueOnce(false).mockReturnValueOnce(true)

    const result = resolveOverriddenAsset(options, false, true, { symbol: 'DOT' } as TAsset)

    expect(validateAssetSupport).toHaveBeenCalledTimes(2)
    expect(getAssetBySymbolOrId).toHaveBeenCalledTimes(multiasset.length)
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
    vi.mocked(getAssetBySymbolOrId).mockReturnValue({} as TAsset)

    expect(() => resolveOverriddenAsset(options, false, false, {} as TAsset)).toThrow(
      InvalidCurrencyError
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
