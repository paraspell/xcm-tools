import type {
  TAsset,
  TCurrencyInput,
  TJunction,
  TMultiLocation,
  TNodeWithRelayChains
} from '../../types'
import { isOverrideMultiLocationSpecifier } from '../../utils/multiLocation/isOverrideMultiLocationSpecifier'
import { getAssetsObject, getOtherAssets } from './assets'
import { findAssetById, findAssetBySymbol } from './assetsUtils'
import { findAssetByMultiLocation } from './findAssetByMultiLocation'

export const getAssetBySymbolOrId = (
  node: TNodeWithRelayChains,
  currency: TCurrencyInput,
  isRelayDestination: boolean = false,
  destination?: TNodeWithRelayChains,
  preferForeignAssets = false
): TAsset | null => {
  if (
    ('multilocation' in currency && isOverrideMultiLocationSpecifier(currency.multilocation)) ||
    'multiasset' in currency
  ) {
    return null
  }

  const { otherAssets, nativeAssets } = getAssetsObject(node)

  const resolvedOtherAssets = destination === 'Ethereum' ? getOtherAssets('Ethereum') : otherAssets

  let asset: TAsset | undefined
  if ('symbol' in currency) {
    asset = findAssetBySymbol(
      node,
      destination,
      otherAssets,
      nativeAssets,
      currency.symbol,
      isRelayDestination,
      preferForeignAssets
    )
  } else if (
    'multilocation' in currency &&
    !isOverrideMultiLocationSpecifier(currency.multilocation)
  ) {
    asset = findAssetByMultiLocation(
      resolvedOtherAssets,
      currency.multilocation as string | TMultiLocation | TJunction[]
    )
  } else if ('id' in currency) {
    asset = findAssetById(resolvedOtherAssets, currency.id)
  } else {
    throw new Error('Invalid currency input')
  }

  if (asset) {
    return asset
  }

  return null
}
