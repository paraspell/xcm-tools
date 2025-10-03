import type { TAmount, TCurrencyCore } from '@paraspell/assets'
import { findAssetInfoOrThrow, isTAsset, type TAsset } from '@paraspell/assets'
import type { Version } from '@paraspell/sdk-common'

import { AMOUNT_ALL, MIN_AMOUNT } from '../../constants'
import type { TAssetClaimOptions } from '../../types'
import { abstractDecimals, assertHasLocation, createAsset, localizeLocation } from '../../utils'

export const resolveAssets = <TApi, TRes>(
  { api, chain, currency }: TAssetClaimOptions<TApi, TRes>,
  version: Version
): TAsset<bigint>[] => {
  const normalizeAsset = (amount: TAmount, currency: TCurrencyCore) => {
    const asset = findAssetInfoOrThrow(chain, currency, null)
    assertHasLocation(asset)
    const abstracted = abstractDecimals(amount, asset.decimals, api)
    const finalAbstracted = abstracted === AMOUNT_ALL ? MIN_AMOUNT : abstracted
    return createAsset(version, finalAbstracted, localizeLocation(chain, asset.location))
  }

  if (Array.isArray(currency)) {
    if (currency.every(asset => isTAsset<TAmount>(asset))) {
      return currency.map(asset => ({
        ...asset,
        fun: { Fungible: BigInt(asset.fun.Fungible) }
      }))
    } else {
      return currency.map(currency => normalizeAsset(currency.amount, currency))
    }
  }

  return [normalizeAsset(currency.amount, currency)]
}
