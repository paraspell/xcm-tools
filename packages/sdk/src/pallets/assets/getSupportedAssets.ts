import type { TAsset, TNodePolkadotKusama, TNodeWithRelayChains } from '../../types'
import { isRelayChain } from '../../utils'
import { getDefaultPallet } from '../pallets'
import { getAssets, getOtherAssets } from './assets'
import { getAssetBySymbolOrId } from './getAssetBySymbolOrId'

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
    const polkadotAsset = getAssetBySymbolOrId('Polkadot', { symbol: 'DOT' })
    const kusamaAsset = getAssetBySymbolOrId('Kusama', { symbol: 'KSM' })
    return [...(polkadotAsset ? [polkadotAsset] : []), ...(kusamaAsset ? [kusamaAsset] : [])]
  }

  if (
    !isRelayChain(origin) &&
    getDefaultPallet(origin as TNodePolkadotKusama) === 'XTokens' &&
    (destination === 'AssetHubPolkadot' || destination === 'AssetHubKusama')
  ) {
    return getOtherAssets(destination).filter(
      asset =>
        originAssets.some(a => a.symbol?.toLowerCase() === asset.symbol?.toLowerCase()) &&
        asset.assetId !== ''
    )
  }

  return originAssets.filter(asset =>
    destinationAssets.some(a => a.symbol?.toLocaleLowerCase() === asset.symbol?.toLowerCase())
  )
}
