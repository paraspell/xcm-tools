import { InvalidCurrencyError } from '../../errors'
import { getAssetBySymbolOrId } from '../../pallets/assets/getAssetBySymbolOrId'
import { createMultiAsset, isTMultiAsset, isTMultiLocation } from '../../pallets/xcmPallet/utils'
import type {
  TAsset,
  TMultiAssetWithFee,
  TMultiLocation,
  TNodePolkadotKusama,
  TSendOptions
} from '../../types'
import { deepEqual, getNode, isForeignAsset } from '../../utils'
import { isAssetEqual } from '../../utils'
import { extractMultiAssetLoc, isOverrideMultiLocationSpecifier } from '../../utils/multiLocation'
import { validateAssetSupport } from './validationUtils'

export const resolveOverriddenAsset = <TApi, TRes>(
  options: TSendOptions<TApi, TRes>,
  isBridge: boolean,
  assetCheckEnabled: boolean,
  resolvedFeeAsset: TAsset | undefined
): TMultiLocation | TMultiAssetWithFee[] | undefined => {
  const { currency, feeAsset, from: origin, to: destination } = options
  if ('multilocation' in currency && isOverrideMultiLocationSpecifier(currency.multilocation)) {
    return currency.multilocation.value
  }

  if ('multiasset' in currency) {
    if (!feeAsset) {
      throw new InvalidCurrencyError(
        'Overridden multi assets cannot be used without specifying fee asset'
      )
    }

    if ('multilocation' in feeAsset && isOverrideMultiLocationSpecifier(feeAsset.multilocation)) {
      throw new InvalidCurrencyError('Fee asset cannot be an overridden multi location specifier')
    }

    if (currency.multiasset.every(asset => isTMultiAsset(asset))) {
      if (!feeAsset) {
        throw new InvalidCurrencyError('Fee asset not provided')
      }

      if (!('multilocation' in feeAsset)) {
        throw new InvalidCurrencyError(
          'Fee asset must be specified by multilocation when using raw overridden multi assets'
        )
      }

      return currency.multiasset.map(multiAsset => {
        const ml = extractMultiAssetLoc(multiAsset)
        return {
          ...multiAsset,
          isFeeAsset: deepEqual(ml, feeAsset.multilocation)
        }
      })
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

      if (!resolvedFeeAsset) {
        throw new InvalidCurrencyError('Fee asset not found')
      }

      validateAssetSupport(options, assetCheckEnabled, isBridge, asset)

      const originTyped = origin as TNodePolkadotKusama
      const originNode = getNode<TApi, TRes, typeof originTyped>(originTyped)
      return {
        isFeeAsset: isAssetEqual(resolvedFeeAsset, asset),
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
