import type { TNodeWithRelayChains } from '@paraspell/sdk-common'

import { isOverrideLocationSpecifier } from '../../guards'
import type { TAssetInfo, TCurrencyInput, TForeignAssetInfo } from '../../types'
import { getAssetsObject, getOtherAssets } from '../assets'
import { filterEthCompatibleAssets } from '../filterEthCompatibleAssets'
import { findAssetInfoById } from './findAssetInfoById'
import { findAssetInfoByLoc } from './findAssetInfoByLoc'
import { findAssetInfoBySymbol } from './findAssetInfoBySymbol'

export const findAssetInfo = (
  node: TNodeWithRelayChains,
  currency: TCurrencyInput,
  destination: TNodeWithRelayChains | null
): TAssetInfo | null => {
  if (
    ('location' in currency && isOverrideLocationSpecifier(currency.location)) ||
    'multiasset' in currency
  ) {
    return null
  }

  const { otherAssets, nativeAssets } = getAssetsObject(node)

  const isEthereumDestination = destination === 'Ethereum'

  const getEthereumAssets = () => getOtherAssets('Ethereum')
  const getFilteredEthereumAssets = () => filterEthCompatibleAssets(otherAssets)

  let asset: TAssetInfo | undefined
  if ('symbol' in currency) {
    // If destination is Ethereum first try to find Ethereum compatible assets
    // If not found, search Ethereum assets directly
    if (isEthereumDestination) {
      asset =
        findAssetInfoBySymbol(
          destination,
          getFilteredEthereumAssets(),
          nativeAssets,
          currency.symbol
        ) ?? findAssetInfoBySymbol(destination, getEthereumAssets(), nativeAssets, currency.symbol)
    } else {
      asset = findAssetInfoBySymbol(destination, otherAssets, nativeAssets, currency.symbol)
    }
  } else if ('location' in currency && !isOverrideLocationSpecifier(currency.location)) {
    const resolvedAssets = isEthereumDestination ? getEthereumAssets() : otherAssets
    asset =
      findAssetInfoByLoc(resolvedAssets, currency.location) ??
      findAssetInfoByLoc(nativeAssets as TForeignAssetInfo[], currency.location)
  } else if ('id' in currency) {
    if (isEthereumDestination) {
      asset =
        findAssetInfoById(getFilteredEthereumAssets(), currency.id) ??
        findAssetInfoById(getEthereumAssets(), currency.id)
    } else {
      asset = findAssetInfoById(otherAssets, currency.id)
    }
  }

  return asset ?? null
}
