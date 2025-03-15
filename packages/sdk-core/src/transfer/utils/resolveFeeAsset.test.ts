import type { TAsset, TCurrencyInput } from '@paraspell/assets'
import { findAsset } from '@paraspell/assets'
import type { TMultiLocation } from '@paraspell/sdk-common'
import { isTMultiLocation } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { throwUnsupportedCurrency } from '../../pallets/xcmPallet/utils'
import { resolveFeeAsset } from './resolveFeeAsset'

vi.mock('@paraspell/assets', () => ({
  findAsset: vi.fn()
}))

vi.mock('@paraspell/sdk-common', () => ({
  isTMultiLocation: vi.fn()
}))

vi.mock('../../pallets/xcmPallet/utils', () => ({
  throwUnsupportedCurrency: vi.fn()
}))

describe('resolveFeeAsset', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns asset when found and destination is not a TMultiLocation', () => {
    vi.mocked(isTMultiLocation).mockReturnValue(false)
    const fakeAsset = { id: 'asset1' } as unknown as TAsset
    vi.mocked(findAsset).mockReturnValue(fakeAsset)

    const feeCurrency = {} as TCurrencyInput
    const feeAsset = 'feeAssetSymbol' as unknown as TAsset
    const origin = 'Acala'
    const destination = 'Astar'

    const result = resolveFeeAsset(feeAsset, origin, destination, feeCurrency)
    expect(result).toEqual(fakeAsset)
    expect(findAsset).toHaveBeenCalledWith(origin, feeAsset, destination)
  })

  it('returns asset when found and destination is a TMultiLocation', () => {
    vi.mocked(isTMultiLocation).mockReturnValue(true)
    const fakeAsset = { id: 'asset2' } as unknown as TAsset
    vi.mocked(findAsset).mockReturnValue(fakeAsset)

    const feeCurrency = {} as TCurrencyInput
    const feeAsset = 'feeAssetSymbol' as unknown as TAsset
    const origin = 'Acala'
    const destination = {} as TMultiLocation

    const result = resolveFeeAsset(feeAsset, origin, destination, feeCurrency)
    expect(result).toEqual(fakeAsset)
    expect(findAsset).toHaveBeenCalledWith(origin, feeAsset, null)
  })

  it('throws error when asset is not found', () => {
    vi.mocked(isTMultiLocation).mockReturnValue(false)
    vi.mocked(findAsset).mockReturnValue(null)

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
    expect(findAsset).toHaveBeenCalledWith(origin, feeAsset, destination)
    expect(throwUnsupportedCurrency).toHaveBeenCalledWith(feeAsset, origin)
  })
})
