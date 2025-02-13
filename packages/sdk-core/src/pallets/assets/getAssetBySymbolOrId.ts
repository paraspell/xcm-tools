import type { TAsset, TCurrencyInput, TNodeWithRelayChains } from '../../types'
import { isOverrideMultiLocationSpecifier } from '../../utils/multiLocation/isOverrideMultiLocationSpecifier'
import { getAssetsObject, getOtherAssets } from './assets'
import { findAssetById, findAssetBySymbol } from './assetsUtils'
import { filterEthCompatibleAssets } from './filterEthCompatibleAssets'
import { findAssetByMultiLocation } from './findAssetByMultiLocation'

export const getAssetBySymbolOrId = (
  node: TNodeWithRelayChains,
  currency: TCurrencyInput,
  destination: TNodeWithRelayChains | null
): TAsset | null => {
  if (
    ('multilocation' in currency && isOverrideMultiLocationSpecifier(currency.multilocation)) ||
    'multiasset' in currency
  ) {
    return null
  }

  const { otherAssets, nativeAssets } = getAssetsObject(node)
  const isEthereumDestination = destination === 'Ethereum'

  const getEthereumAssets = () => getOtherAssets('Ethereum')
  const getFilteredEthereumAssets = () => filterEthCompatibleAssets(otherAssets)

  let asset: TAsset | undefined
  if ('symbol' in currency) {
    // If destination is Ethereum first try to find Ethereum compatible assets
    // If not found, search Ethereum assets directly
    if (isEthereumDestination) {
      asset =
        findAssetBySymbol(
          node,
          destination,
          getFilteredEthereumAssets(),
          nativeAssets,
          currency.symbol
        ) ??
        findAssetBySymbol(node, destination, getEthereumAssets(), nativeAssets, currency.symbol)
    } else {
      asset = findAssetBySymbol(node, destination, otherAssets, nativeAssets, currency.symbol)
    }
  } else if (
    'multilocation' in currency &&
    !isOverrideMultiLocationSpecifier(currency.multilocation)
  ) {
    const resolvedAssets = isEthereumDestination ? getEthereumAssets() : otherAssets
    asset = findAssetByMultiLocation(resolvedAssets, currency.multilocation)
  } else if ('id' in currency) {
    if (isEthereumDestination) {
      asset =
        findAssetById(getFilteredEthereumAssets(), currency.id) ??
        findAssetById(getEthereumAssets(), currency.id)
    } else {
      asset = findAssetById(otherAssets, currency.id)
    }
  } else {
    throw new Error('Invalid currency input')
  }

  return asset ?? null
}
