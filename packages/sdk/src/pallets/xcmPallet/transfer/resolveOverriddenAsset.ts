import { InvalidCurrencyError } from '../../../errors'
import type {
  TMultiAssetWithFee,
  TMultiLocation,
  TNodePolkadotKusama,
  TSendOptions
} from '../../../types'
import { getNode, isForeignAsset } from '../../../utils'
import { isOverrideMultiLocationSpecifier } from '../../../utils/multiLocation/isOverrideMultiLocationSpecifier'
import { getAssetBySymbolOrId } from '../../assets/getAssetBySymbolOrId'
import { createMultiAsset, isTMultiAsset, isTMultiLocation } from '../utils'
import { validateAssetSupport } from './validationUtils'

export const resolveOverriddenAsset = <TApi, TRes>(
  options: TSendOptions<TApi, TRes>,
  isBridge: boolean,
  assetCheckEnabled: boolean
): TMultiLocation | TMultiAssetWithFee[] | undefined => {
  const { currency, origin, destination } = options
  if ('multilocation' in currency && isOverrideMultiLocationSpecifier(currency.multilocation)) {
    return currency.multilocation.value
  }

  if ('multiasset' in currency) {
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

      validateAssetSupport(options, assetCheckEnabled, isBridge, asset)

      const originTyped = origin as TNodePolkadotKusama
      const originNode = getNode<TApi, TRes, typeof originTyped>(originTyped)
      return {
        isFeeAsset: currency.isFeeAsset ?? false,
        ...createMultiAsset(
          originNode.version,
          currency.amount,
          asset?.multiLocation as TMultiLocation
        )
      }
    })

    return assets
  }

  return undefined
}
