import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InvalidCurrencyError } from '../../../errors'
import { resolveOverriddenAsset } from './resolveOverriddenAsset'
import type {
  TAsset,
  TMultiAsset,
  TMultiAssetWithFee,
  TMultiLocation,
  TMultiLocationValueWithOverride,
  TSendOptions
} from '../../../types'
import { getNode, isForeignAsset } from '../../../utils'
import { isOverrideMultiLocationSpecifier } from '../../../utils/multiLocation/isOverrideMultiLocationSpecifier'
import { getAssetBySymbolOrId } from '../../assets/getAssetBySymbolOrId'
import { createMultiAsset, isTMultiAsset, isTMultiLocation } from '../utils'
import { validateAssetSupport } from './validationUtils'
import type { Extrinsic, TPjsApi } from '../../../pjs'
import type ParachainNode from '../../../nodes/ParachainNode'

vi.mock('../../../utils', () => ({
  getNode: vi.fn(),
  isForeignAsset: vi.fn()
}))

vi.mock('../../../utils/multiLocation/isOverrideMultiLocationSpecifier', () => ({
  isOverrideMultiLocationSpecifier: vi.fn()
}))

vi.mock('../../assets/getAssetBySymbolOrId', () => ({
  getAssetBySymbolOrId: vi.fn()
}))

vi.mock('../utils', () => ({
  createMultiAsset: vi.fn(),
  isTMultiAsset: vi.fn(),
  isTMultiLocation: vi.fn()
}))

vi.mock('./validationUtils', () => ({
  validateAssetSupport: vi.fn()
}))

describe('resolveOverriddenAsset', () => {
  const mockOriginNode = { version: 'testVersion' } as unknown as ParachainNode<TPjsApi, Extrinsic>
  const mockOrigin = 'Acala'
  const mockDestination = {} as TMultiLocation

  const defaultOptions = {
    currency: { symbol: 'TEST', amount: '1000' },
    origin: mockOrigin,
    destination: mockDestination
  } as TSendOptions<TPjsApi, Extrinsic>

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
    } as TSendOptions<TPjsApi, Extrinsic>

    vi.mocked(isOverrideMultiLocationSpecifier).mockReturnValue(true)

    const result = resolveOverriddenAsset(options, false, false)
    expect(result).toEqual({})
  })

  it('returns multiasset if all items in currency.multiasset are already TMultiAsset', () => {
    const multiasset = [{}, {}] as TMultiAssetWithFee[]
    const options = {
      ...defaultOptions,
      currency: { multiasset }
    } as TSendOptions<TPjsApi, Extrinsic>

    vi.mocked(isTMultiAsset).mockReturnValue(true)

    const result = resolveOverriddenAsset(options, false, false)
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

    const result = resolveOverriddenAsset(options, false, true)

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

    expect(() => resolveOverriddenAsset(options, false, false)).toThrow(InvalidCurrencyError)
  })

  it('returns undefined if currency has no multiasset or multilocation', () => {
    const options = {
      ...defaultOptions,
      currency: { symbol: 'NO_OVERRIDE' }
    } as TSendOptions<TPjsApi, Extrinsic>

    const result = resolveOverriddenAsset(options, false, false)
    expect(result).toBeUndefined()
  })
})
