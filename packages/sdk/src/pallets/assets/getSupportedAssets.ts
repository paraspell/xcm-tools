import type { TAsset, TNodeWithRelayChains } from '../../types'
import { getAssets, getOtherAssets } from './assets'
import { getAssetBySymbolOrId } from './getAssetBySymbolOrId'

/**
 * Normalizes an asset symbol by stripping the 'xc' prefix (if present) and converting it to lowercase.
 *
 * @param symbol - The symbol to normalize.
 * @returns The normalized symbol.
 */
const normalizeSymbol = (symbol: string | undefined): string => {
  if (!symbol) return ''
  const lowerSymbol = symbol.toLowerCase()
  return lowerSymbol.startsWith('xc') ? lowerSymbol.substring(2) : lowerSymbol
}

/**
 * Retrieves the list of assets that are supported for transfers between two specified nodes.
 *
 * @param origin - The origin node.
 * @param destination - The destination node.
 * @returns An array of assets supported between the origin and destination nodes.
 */
export const getSupportedAssets = (
  origin: TNodeWithRelayChains,
  destination: TNodeWithRelayChains
): TAsset[] => {
  const originAssets = getAssets(origin)
  const destinationAssets = getAssets(destination)

  if (destination === 'Ethereum' || origin === 'Ethereum') {
    return getOtherAssets('Ethereum')
  }

  if (
    (origin === 'AssetHubPolkadot' && destination === 'AssetHubKusama') ||
    (origin === 'AssetHubKusama' && destination === 'AssetHubPolkadot')
  ) {
    const polkadotAsset = getAssetBySymbolOrId('Polkadot', { symbol: 'DOT' }, null)
    const kusamaAsset = getAssetBySymbolOrId('Kusama', { symbol: 'KSM' }, null)
    return [...(polkadotAsset ? [polkadotAsset] : []), ...(kusamaAsset ? [kusamaAsset] : [])]
  }

  const supportedAssets = originAssets.filter(asset =>
    destinationAssets.some(a => normalizeSymbol(a.symbol) === normalizeSymbol(asset.symbol))
  )

  if (origin === 'AssetHubPolkadot' && destination === 'BifrostPolkadot') {
    const wethAsset = getOtherAssets('Ethereum').find(({ symbol }) => symbol === 'WETH')
    if (wethAsset)
      supportedAssets.push({
        assetId: wethAsset.assetId,
        symbol: `${wethAsset.symbol}.e`
      })
  }

  return supportedAssets
}
