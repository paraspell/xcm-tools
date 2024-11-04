import type { TAsset, TCurrencyInput, TNativeAssetDetails, TNodeWithRelayChains } from '../../types'
import { getAssetDecimals, getAssetsObject, getOtherAssets } from './assets'
import { findAssetById, findAssetBySymbol } from './assetsUtils'

export const getAssetBySymbolOrId = (
  node: TNodeWithRelayChains,
  currency: TCurrencyInput,
  isRelayDestination: boolean = false,
  destination?: TNodeWithRelayChains
): TAsset | null => {
  if ('multilocation' in currency || 'multiasset' in currency) {
    return null
  }

  const { otherAssets, nativeAssets, relayChainAssetSymbol } = getAssetsObject(node)
  const combinedAssets =
    destination === 'Ethereum' ? [...getOtherAssets('Ethereum')] : [...otherAssets, ...nativeAssets]

  let asset: TAsset | undefined
  if ('symbol' in currency) {
    asset = findAssetBySymbol(
      node,
      destination,
      otherAssets,
      nativeAssets,
      currency.symbol,
      isRelayDestination
    )
  } else {
    asset = findAssetById(combinedAssets, currency.id)
  }

  if (asset) {
    return asset
  }

  if (
    'symbol' in currency &&
    relayChainAssetSymbol.toLowerCase() === currency.symbol.toLowerCase()
  ) {
    const relayChainAsset: TNativeAssetDetails = {
      symbol: relayChainAssetSymbol,
      decimals: getAssetDecimals(node, relayChainAssetSymbol) as number
    }
    return relayChainAsset
  }

  return null
}
