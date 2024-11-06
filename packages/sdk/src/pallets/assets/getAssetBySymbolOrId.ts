import type { TAsset, TCurrencyInput, TNativeAsset, TNodeWithRelayChains } from '../../types'
import { isSymbolSpecifier } from '../../utils/assets/isSymbolSpecifier'
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

  const resolvedOtherAssets = destination === 'Ethereum' ? getOtherAssets('Ethereum') : otherAssets

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
    asset = findAssetById(resolvedOtherAssets, currency.id)
  }

  if (asset) {
    return asset
  }

  if (
    'symbol' in currency &&
    ((isSymbolSpecifier(currency.symbol) &&
      currency.symbol.type === 'Native' &&
      relayChainAssetSymbol.toLowerCase() === currency.symbol.value.toLowerCase()) ||
      (!isSymbolSpecifier(currency.symbol) &&
        relayChainAssetSymbol.toLowerCase() === currency.symbol.toLowerCase()))
  ) {
    const relayChainAsset: TNativeAsset = {
      symbol: relayChainAssetSymbol,
      decimals: getAssetDecimals(node, relayChainAssetSymbol) as number
    }
    return relayChainAsset
  }

  return null
}
