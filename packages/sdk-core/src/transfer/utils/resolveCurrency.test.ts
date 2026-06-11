import type { TAssetInfo } from '@paraspell/assets'
import { InvalidCurrencyError } from '@paraspell/assets'
import type { TLocation, TSubstrateChain } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { AMOUNT_ALL } from '../../constants'
import type { TDestination } from '../../types'
import { resolveCurrency } from './resolveCurrency'

const usdtLoc: TLocation = {
  parents: 0,
  interior: { X2: [{ PalletInstance: 50 }, { GeneralIndex: 1984 }] }
}
const usdcLoc: TLocation = {
  parents: 0,
  interior: { X2: [{ PalletInstance: 50 }, { GeneralIndex: 1337 }] }
}

const USDT: TAssetInfo = { symbol: 'USDT', decimals: 6, location: usdtLoc, assetId: '1984' }
const USDC: TAssetInfo = { symbol: 'USDC', decimals: 6, location: usdcLoc, assetId: '1337' }

const ASSETS_BY_SYMBOL: Record<string, TAssetInfo> = { USDT, USDC }

describe('resolveCurrency', () => {
  const origin: TSubstrateChain = 'AssetHubPolkadot'
  const destination: TDestination = 'Hydration'

  const findAssetInfo = vi.fn((_chain: unknown, currency: { symbol?: string }) =>
    currency.symbol ? (ASSETS_BY_SYMBOL[currency.symbol] ?? null) : null
  )

  const findAssetInfoOrThrow = vi.fn((_chain: unknown, currency: { symbol?: string }) => {
    const asset = currency.symbol ? ASSETS_BY_SYMBOL[currency.symbol] : undefined
    if (!asset) throw new InvalidCurrencyError('not found')
    return asset
  })

  const api = {
    config: undefined,
    findAssetInfo,
    findAssetInfoOrThrow
  } as unknown as PolkadotApi<unknown, unknown, unknown>

  const currencies = [
    { symbol: 'USDT', amount: 100n },
    { symbol: 'USDC', amount: 200n }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('array currency', () => {
    it('resolves each asset, marking the matching fee asset', () => {
      const { assets } = resolveCurrency(api, currencies, USDC, origin, destination)

      expect(assets).toEqual([
        { ...USDT, amount: 100n, isFeeAsset: false },
        { ...USDC, amount: 200n, isFeeAsset: true }
      ])
      expect(findAssetInfo).toHaveBeenCalledTimes(2)
    })

    it('returns the resolved fee asset as the representative', () => {
      const result = resolveCurrency(api, currencies, USDC, origin, destination)

      expect(result.asset).toEqual({ ...USDC, amount: 0n })
    })

    it('reads the representative amount from the resolved fee asset', () => {
      const result = resolveCurrency(
        api,
        currencies,
        { ...USDC, amount: 200n },
        origin,
        destination
      )

      expect(result.asset.amount).toBe(200n)
    })

    it('passes the destination chain (not a location) to findAssetInfo', () => {
      resolveCurrency(api, currencies, USDC, origin, destination)
      expect(findAssetInfo).toHaveBeenCalledWith(
        origin,
        { symbol: 'USDT', amount: 100n },
        destination
      )
    })

    it('passes null destination when destination is a location', () => {
      resolveCurrency(api, currencies, USDC, origin, usdtLoc)
      expect(findAssetInfo).toHaveBeenCalledWith(origin, { symbol: 'USDT', amount: 100n }, null)
    })

    it('invokes the onAsset hook once per resolved asset', () => {
      const onAsset = vi.fn()
      resolveCurrency(api, currencies, USDC, origin, destination, onAsset)
      expect(onAsset).toHaveBeenCalledTimes(2)
      expect(onAsset).toHaveBeenCalledWith(USDT)
      expect(onAsset).toHaveBeenCalledWith(USDC)
    })

    it('throws when an element uses amount-all', () => {
      expect(() =>
        resolveCurrency(api, [{ symbol: 'USDT', amount: AMOUNT_ALL }], USDC, origin, destination)
      ).toThrow(InvalidCurrencyError)
    })

    it('throws when an asset is not found on the origin', () => {
      expect(() =>
        resolveCurrency(api, [{ symbol: 'UNKNOWN', amount: 1n }], USDC, origin, destination)
      ).toThrow('does not support currency')
    })

    it('throws when no resolved fee asset is provided', () => {
      expect(() => resolveCurrency(api, currencies, undefined, origin, destination)).toThrow(
        'Fee asset is required when providing more than one asset'
      )
    })

    it('throws when the fee asset matches no element', () => {
      const otherFee: TAssetInfo = {
        symbol: 'DOT',
        decimals: 10,
        location: { parents: 1, interior: { Here: null } }
      }
      expect(() => resolveCurrency(api, currencies, otherFee, origin, destination)).toThrow(
        'Fee asset must be one of the provided assets'
      )
    })

    it('throws when the fee asset matches more than one element', () => {
      expect(() =>
        resolveCurrency(
          api,
          [
            { symbol: 'USDC', amount: 100n },
            { symbol: 'USDC', amount: 200n }
          ],
          USDC,
          origin,
          destination
        )
      ).toThrow('Fee asset matches more than one of the provided assets')
    })
  })

  describe('single currency', () => {
    it('resolves the representative via findAssetInfoOrThrow', () => {
      const result = resolveCurrency(
        api,
        { symbol: 'USDT', amount: 100n },
        undefined,
        origin,
        destination
      )

      expect(result.asset).toEqual({ ...USDT, amount: 100n })
      expect(result.assets).toEqual([{ ...USDT, amount: 100n }])
      expect(findAssetInfoOrThrow).toHaveBeenCalledWith(
        origin,
        { symbol: 'USDT', amount: 100n },
        destination
      )
    })

    it('passes null destination when destination is a location', () => {
      resolveCurrency(api, { symbol: 'USDT', amount: 100n }, undefined, origin, usdtLoc)
      expect(findAssetInfoOrThrow).toHaveBeenCalledWith(
        origin,
        { symbol: 'USDT', amount: 100n },
        null
      )
    })

    it('propagates a not-found error from findAssetInfoOrThrow', () => {
      expect(() =>
        resolveCurrency(api, { symbol: 'UNKNOWN', amount: 1n }, undefined, origin, destination)
      ).toThrow(InvalidCurrencyError)
    })
  })
})
