import type { TAssetInfo, TCurrencyInput } from '@paraspell/assets'
import { findAssetInfo } from '@paraspell/assets'
import type { TLocation } from '@paraspell/sdk-common'
import { isTLocation } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ScenarioNotSupportedError } from '../../errors'
import { throwUnsupportedCurrency } from '../../utils'
import { resolveFeeAsset } from './resolveFeeAsset'

vi.mock('@paraspell/assets')
vi.mock('@paraspell/sdk-common')

vi.mock('../../utils')

describe('resolveFeeAsset', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns asset when found and destination is not a TLocation', () => {
    vi.mocked(isTLocation).mockReturnValue(false)
    const fakeAsset = { assetId: 'asset1' } as TAssetInfo
    vi.mocked(findAssetInfo).mockReturnValue(fakeAsset)

    const feeCurrency = {} as TCurrencyInput
    const feeAsset = 'feeAssetSymbol' as unknown as TAssetInfo
    const origin = 'Hydration'
    const destination = 'Astar'

    const result = resolveFeeAsset(feeAsset, origin, destination, feeCurrency)
    expect(result).toEqual(fakeAsset)
    expect(findAssetInfo).toHaveBeenCalledWith(origin, feeAsset, destination)
  })

  it('returns asset when found and destination is a TLocation', () => {
    vi.mocked(isTLocation).mockReturnValue(true)
    const fakeAsset = { id: 'asset2' } as unknown as TAssetInfo
    vi.mocked(findAssetInfo).mockReturnValue(fakeAsset)

    const feeCurrency = {} as TCurrencyInput
    const feeAsset = 'feeAssetSymbol' as unknown as TAssetInfo
    const origin = 'Hydration'
    const destination = {} as TLocation

    const result = resolveFeeAsset(feeAsset, origin, destination, feeCurrency)
    expect(result).toEqual(fakeAsset)
    expect(findAssetInfo).toHaveBeenCalledWith(origin, feeAsset, null)
  })

  it('throws error when asset is not found', () => {
    vi.mocked(isTLocation).mockReturnValue(false)
    vi.mocked(findAssetInfo).mockReturnValue(null)

    const feeCurrency = {} as TCurrencyInput
    const feeAsset = 'feeAssetSymbol' as unknown as TAssetInfo
    const origin = 'Hydration'
    const destination = 'Astar'

    vi.mocked(throwUnsupportedCurrency).mockImplementation(() => {
      throw new Error('Unsupported currency')
    })

    expect(() => resolveFeeAsset(feeAsset, origin, destination, feeCurrency)).toThrow(
      'Unsupported currency'
    )
    expect(findAssetInfo).toHaveBeenCalledWith(origin, feeAsset, destination)
    expect(throwUnsupportedCurrency).toHaveBeenCalledWith(feeAsset, origin)
  })

  it('throws InvalidParameterError when origin does not support fee assets', () => {
    const origin = 'Moonbeam'
    const feeCurrency = {} as TCurrencyInput
    const feeAsset = {} as TCurrencyInput

    expect(() => resolveFeeAsset(feeAsset, origin, 'Hydration', feeCurrency)).toThrow(
      new ScenarioNotSupportedError(`Fee asset is not supported on ${origin}`)
    )
    expect(findAssetInfo).not.toHaveBeenCalled()
  })
})
