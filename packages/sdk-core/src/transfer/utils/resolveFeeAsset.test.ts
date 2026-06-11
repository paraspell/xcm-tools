import type { TAssetInfo, TCurrencyInput } from '@paraspell/assets'
import { InvalidCurrencyError, isAssetEqual } from '@paraspell/assets'
import type { TLocation } from '@paraspell/sdk-common'
import { isTLocation } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { ScenarioNotSupportedError } from '../../errors'
import { abstractDecimals, throwUnsupportedCurrency } from '../../utils'
import { resolveFeeAsset } from './resolveFeeAsset'

vi.mock('@paraspell/assets')
vi.mock('@paraspell/sdk-common')

vi.mock('../../utils')

const createApi = () =>
  ({
    findAssetInfo: vi.fn()
  }) as unknown as PolkadotApi<unknown, unknown, unknown>

describe('resolveFeeAsset', () => {
  let api: PolkadotApi<unknown, unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    api = createApi()
  })

  it('returns asset when found and destination is not a TLocation', () => {
    vi.mocked(isTLocation).mockReturnValue(false)
    const fakeAsset = { assetId: 'asset1' } as TAssetInfo
    const findAssetInfoSpy = vi.spyOn(api, 'findAssetInfo').mockReturnValue(fakeAsset)

    const feeCurrency = {} as TCurrencyInput
    const feeAsset = 'feeAssetSymbol' as unknown as TAssetInfo
    const origin = 'Hydration'
    const destination = 'Astar'

    const result = resolveFeeAsset(api, feeAsset, origin, destination, feeCurrency)
    expect(result).toEqual(fakeAsset)
    expect(findAssetInfoSpy).toHaveBeenCalledWith(origin, feeAsset, destination)
  })

  it('returns asset when found and destination is a TLocation', () => {
    vi.mocked(isTLocation).mockReturnValue(true)
    const fakeAsset = { id: 'asset2' } as unknown as TAssetInfo
    const findAssetInfoSpy = vi.spyOn(api, 'findAssetInfo').mockReturnValue(fakeAsset)

    const feeCurrency = {} as TCurrencyInput
    const feeAsset = 'feeAssetSymbol' as unknown as TAssetInfo
    const origin = 'Hydration'
    const destination = {} as TLocation

    const result = resolveFeeAsset(api, feeAsset, origin, destination, feeCurrency)
    expect(result).toEqual(fakeAsset)
    expect(findAssetInfoSpy).toHaveBeenCalledWith(origin, feeAsset, null)
  })

  it('throws error when asset is not found', () => {
    vi.mocked(isTLocation).mockReturnValue(false)
    const findAssetInfoSpy = vi.spyOn(api, 'findAssetInfo').mockReturnValue(null)

    const feeCurrency = {} as TCurrencyInput
    const feeAsset = 'feeAssetSymbol' as unknown as TAssetInfo
    const origin = 'Hydration'
    const destination = 'Astar'

    vi.mocked(throwUnsupportedCurrency).mockImplementation(() => {
      throw new Error('Unsupported currency')
    })

    expect(() => resolveFeeAsset(api, feeAsset, origin, destination, feeCurrency)).toThrow(
      'Unsupported currency'
    )
    expect(findAssetInfoSpy).toHaveBeenCalledWith(origin, feeAsset, destination)
    expect(throwUnsupportedCurrency).toHaveBeenCalledWith(feeAsset, origin)
  })

  it('throws InvalidParameterError when origin does not support fee assets', () => {
    const origin = 'Moonbeam'
    const feeCurrency = {} as TCurrencyInput
    const feeAsset = {} as TCurrencyInput
    const findAssetInfoSpy = vi.spyOn(api, 'findAssetInfo')

    expect(() => resolveFeeAsset(api, feeAsset, origin, 'Hydration', feeCurrency)).toThrow(
      new ScenarioNotSupportedError(`Fee asset is not supported on ${origin}`)
    )
    expect(findAssetInfoSpy).not.toHaveBeenCalled()
  })

  it('resolves the fee asset for an array currency on any origin', () => {
    vi.mocked(isTLocation).mockReturnValue(false)
    const fakeAsset = { symbol: 'FEE', decimals: 10 } as TAssetInfo
    vi.spyOn(api, 'findAssetInfo').mockReturnValue(fakeAsset)
    vi.mocked(isAssetEqual).mockReturnValue(true)
    vi.mocked(abstractDecimals).mockReturnValue(5n)

    const currency = [
      { symbol: 'FEE', amount: 1n },
      { symbol: 'B', amount: 2n }
    ] as TCurrencyInput
    const feeAsset = { symbol: 'FEE' } as TCurrencyInput

    const result = resolveFeeAsset(api, feeAsset, 'Moonbeam', 'Hydration', currency)

    expect(result).toEqual({ ...fakeAsset, amount: 5n })
  })

  it('throws when the fee asset is not one of the provided assets', () => {
    vi.mocked(isTLocation).mockReturnValue(false)
    vi.spyOn(api, 'findAssetInfo').mockReturnValue({ symbol: 'FEE' } as TAssetInfo)
    vi.mocked(isAssetEqual).mockReturnValue(false)

    const currency = [
      { symbol: 'A', amount: 1n },
      { symbol: 'B', amount: 2n }
    ] as TCurrencyInput
    const feeAsset = { symbol: 'FEE' } as TCurrencyInput

    expect(() => resolveFeeAsset(api, feeAsset, 'Hydration', 'Astar', currency)).toThrow(
      InvalidCurrencyError
    )
  })
})
