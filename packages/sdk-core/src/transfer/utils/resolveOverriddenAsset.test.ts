import type { TAsset, TAssetInfo } from '@paraspell/assets'
import { isAssetEqual } from '@paraspell/assets'
import type { TLocation } from '@paraspell/sdk-common'
import { isTLocation } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { MIN_AMOUNT } from '../../constants'
import type { TSubstrateTransferOptions } from '../../types'
import { abstractDecimals, createAsset, sortAssets } from '../../utils'
import { resolveOverriddenAsset } from './resolveOverriddenAsset'
import { validateAssetSupport } from './validateAssetSupport'

vi.mock('../../utils')
vi.mock('./validateAssetSupport')

vi.mock('@paraspell/sdk-common')
vi.mock('@paraspell/assets', () => ({
  isAssetEqual: vi.fn(),
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
    vi.mocked(isTLocation).mockReturnValue(false)
    vi.mocked(createAsset).mockReturnValue({} as TAsset)
    vi.spyOn(mockApi, 'findAssetInfo').mockReturnValue({
      location: {}
    } as TAssetInfo)
    vi.mocked(abstractDecimals).mockImplementation(amount => BigInt(amount))
    vi.mocked(sortAssets).mockImplementation(assets => assets)
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

  it('throws an InvalidCurrencyError if a currency array is provided without a fee asset', () => {
    const options = {
      ...defaultOptions,
      currency: [{}, {}]
    } as TSubstrateTransferOptions<unknown, unknown, unknown>

    expect(() => resolveOverriddenAsset(options, false, false, {} as TAssetInfo)).toThrow(
      'Overridden assets cannot be used without specifying fee asset'
    )
  })

  it('returns undefined if currency is not an array', () => {
    const options = {
      ...defaultOptions,
      currency: { symbol: 'NO_OVERRIDE' }
    } as TSubstrateTransferOptions<unknown, unknown, unknown>

    const result = resolveOverriddenAsset(options, false, false, {} as TAssetInfo)
    expect(result).toBeUndefined()
  })

  it('clamps every multi-asset amount below MIN_AMOUNT so no zero-value Fungible is built', () => {
    const options = {
      ...defaultOptions,
      // amounts floor to 0 and 1 planck, i.e. below MIN_AMOUNT (2)
      currency: [
        { symbol: 'ASSET1', amount: '0' },
        { symbol: 'ASSET2', amount: '1' },
        { symbol: 'ASSET3', amount: '2' }
      ],
      feeAsset: { symbol: 'ASSET1' }
    } as unknown as TSubstrateTransferOptions<unknown, unknown, unknown>

    // first element is the fee asset, the rest are not
    vi.mocked(isAssetEqual).mockReturnValueOnce(true).mockReturnValue(false).mockReturnValue(false)

    resolveOverriddenAsset(options, false, true, { symbol: 'DOT' } as TAssetInfo)

    const amounts = vi
      .mocked(createAsset)
      .mock.calls.map((call: Parameters<typeof createAsset>) => call[1])
    expect(amounts).toEqual([MIN_AMOUNT, MIN_AMOUNT, 2n])
  })

  it('leaves multi-asset amounts at or above MIN_AMOUNT untouched', () => {
    const options = {
      ...defaultOptions,
      currency: [
        { symbol: 'ASSET1', amount: '500' },
        { symbol: 'ASSET2', amount: '2000' }
      ],
      feeAsset: { symbol: 'ASSET1' }
    } as unknown as TSubstrateTransferOptions<unknown, unknown, unknown>

    vi.mocked(isAssetEqual).mockReturnValueOnce(true).mockReturnValue(false)

    resolveOverriddenAsset(options, false, true, { symbol: 'DOT' } as TAssetInfo)

    const amounts = vi
      .mocked(createAsset)
      .mock.calls.map((call: Parameters<typeof createAsset>) => call[1])
    expect(amounts).toEqual([500n, 2000n])
  })
})
