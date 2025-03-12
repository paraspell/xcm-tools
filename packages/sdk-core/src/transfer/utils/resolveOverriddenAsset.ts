import { InvalidCurrencyError } from '../../errors'
import { getAssetBySymbolOrId } from '../../pallets/assets/getAssetBySymbolOrId'
import { createMultiAsset, isTMultiAsset, isTMultiLocation } from '../../pallets/xcmPallet/utils'
import type {
  TAsset,
  TMultiAsset,
  TMultiLocation,
  TNodePolkadotKusama,
  TSendOptions
} from '../../types'
import { getNode, isForeignAsset } from '../../utils'
import { isAssetEqual } from '../../utils'
import { isOverrideMultiLocationSpecifier } from '../../utils/multiLocation/isOverrideMultiLocationSpecifier'
import { validateAssetSupport } from './validationUtils'

export const resolveOverriddenAsset = <TApi, TRes>(
  options: TSendOptions<TApi, TRes>,
  isBridge: boolean,
  assetCheckEnabled: boolean,
  feeAsset: TAsset | undefined
): TMultiLocation | TMultiAsset[] | undefined => {
  const { currency, from: origin, to: destination } = options
  if ('multilocation' in currency && isOverrideMultiLocationSpecifier(currency.multilocation)) {
    return currency.multilocation.value
  }

  if ('multiasset' in currency) {
    if (!feeAsset) {
      throw new InvalidCurrencyError(
        'Overridden multi assets cannot be used without specifying fee asset'
      )
    }

    if (currency.multiasset.every(asset => isTMultiAsset(asset))) {
      return currency.multiasset
    }

    // MultiAsset is an array of TCurrencyCore, search for assets
    const assets = currency.multiasset.map(currency => {
      const asset = getAssetBySymbolOrId(
        origin,
        currency,
        !isTMultiLocation(destination) ? destination : null
      )

      if (asset && (!isForeignAsset(asset) || !asset.multiLocation)) {
        throw new InvalidCurrencyError(
          `Asset ${JSON.stringify(currency)} does not have a multiLocation`
        )
      }

      if (!asset) {
        throw new InvalidCurrencyError(
          `Origin node ${origin} does not support currency ${JSON.stringify(currency)}`
        )
      }

      validateAssetSupport(options, assetCheckEnabled, isBridge, asset)

      const originTyped = origin as TNodePolkadotKusama
      const originNode = getNode<TApi, TRes, typeof originTyped>(originTyped)
      return {
        isFeeAsset: isAssetEqual(feeAsset, asset),
        ...createMultiAsset(
          originNode.version,
          currency.amount,
          asset.multiLocation as TMultiLocation
        )
      }
    })

    if (assets.filter(asset => asset.isFeeAsset).length > 1) {
      throw new InvalidCurrencyError(`Fee asset matches multiple assets in multiassets`)
    }

    if (assets.filter(asset => asset.isFeeAsset).length === 0) {
      throw new InvalidCurrencyError(`Fee asset not found in multiassets`)
    }

    return assets
  }

  return undefined
}
