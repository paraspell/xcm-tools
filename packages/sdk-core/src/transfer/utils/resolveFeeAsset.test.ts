import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getAssetBySymbolOrId } from '../../pallets/assets/getAssetBySymbolOrId'
import { isTMultiLocation, throwUnsupportedCurrency } from '../../pallets/xcmPallet/utils'
import type { TAsset, TCurrencyInput, TMultiLocation } from '../../types'
import { resolveFeeAsset } from './resolveFeeAsset'

vi.mock('../../pallets/assets/getAssetBySymbolOrId', () => ({
  getAssetBySymbolOrId: vi.fn()
}))

vi.mock('../../pallets/xcmPallet/utils', () => ({
  isTMultiLocation: vi.fn(),
  throwUnsupportedCurrency: vi.fn()
}))

describe('resolveFeeAsset', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns asset when found and destination is not a TMultiLocation', () => {
    vi.mocked(isTMultiLocation).mockReturnValue(false)
    const fakeAsset = { id: 'asset1' } as unknown as TAsset
    vi.mocked(getAssetBySymbolOrId).mockReturnValue(fakeAsset)

    const feeCurrency = {} as TCurrencyInput
    const feeAsset = 'feeAssetSymbol' as unknown as TAsset
    const origin = 'Acala'
    const destination = 'Astar'

    const result = resolveFeeAsset(feeAsset, origin, destination, feeCurrency)
    expect(result).toEqual(fakeAsset)
    expect(getAssetBySymbolOrId).toHaveBeenCalledWith(origin, feeAsset, destination)
  })

  it('returns asset when found and destination is a TMultiLocation', () => {
    vi.mocked(isTMultiLocation).mockReturnValue(true)
    const fakeAsset = { id: 'asset2' } as unknown as TAsset
    vi.mocked(getAssetBySymbolOrId).mockReturnValue(fakeAsset)

    const feeCurrency = {} as TCurrencyInput
    const feeAsset = 'feeAssetSymbol' as unknown as TAsset
    const origin = 'Acala'
    const destination = {} as TMultiLocation

    const result = resolveFeeAsset(feeAsset, origin, destination, feeCurrency)
    expect(result).toEqual(fakeAsset)
    expect(getAssetBySymbolOrId).toHaveBeenCalledWith(origin, feeAsset, null)
  })

  it('throws error when asset is not found', () => {
    vi.mocked(isTMultiLocation).mockReturnValue(false)
    vi.mocked(getAssetBySymbolOrId).mockReturnValue(null)

    const feeCurrency = {} as TCurrencyInput
    const feeAsset = 'feeAssetSymbol' as unknown as TAsset
    const origin = 'Acala'
    const destination = 'Astar'

    vi.mocked(throwUnsupportedCurrency).mockImplementation(() => {
      throw new Error('Unsupported currency')
    })

    expect(() => resolveFeeAsset(feeAsset, origin, destination, feeCurrency)).toThrow(
      'Unsupported currency'
    )
    expect(getAssetBySymbolOrId).toHaveBeenCalledWith(origin, feeAsset, destination)
    expect(throwUnsupportedCurrency).toHaveBeenCalledWith(feeAsset, origin)
  })
})
