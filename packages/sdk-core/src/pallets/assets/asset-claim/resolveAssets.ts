import type { TAmount, TCurrencyCore } from '@paraspell/assets'
import { findAssetInfoOrThrow, isTAsset, type TAsset } from '@paraspell/assets'
import type { Version } from '@paraspell/sdk-common'

import type { TAssetClaimOptions } from '../../../types'
import { assertHasLocation, createAsset, localizeLocation } from '../../../utils'
import { abstractDecimals } from '../../../utils/transfer/abstractDecimals'

export const resolveAssets = <TApi, TRes>(
  { api, chain, currency }: TAssetClaimOptions<TApi, TRes>,
  version: Version
): TAsset<bigint>[] => {
  const normalizeAsset = (amount: TAmount, currency: TCurrencyCore) => {
    const asset = findAssetInfoOrThrow(chain, currency, null)
    assertHasLocation(asset)
    const abstracted = abstractDecimals(amount, asset.decimals, api)
    return createAsset(version, abstracted, localizeLocation(chain, asset.location))
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
