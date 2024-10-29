// Contains function for getting Asset ID or Symbol used in XCM call creation

import { DuplicateAssetError, DuplicateAssetIdError } from '../../errors'
import type {
  TAsset,
  TAssetDetails,
  TCurrency,
  TNativeAssetDetails,
  TNodePolkadotKusama,
  TNodeWithRelayChains
} from '../../types'
import { isRelayChain } from '../../utils'
import { getDefaultPallet } from '../pallets'

export const findAssetBySymbol = (
  node: TNodeWithRelayChains,
  destination: TNodeWithRelayChains | undefined,
  otherAssets: TAssetDetails[],
  nativeAssets: TNativeAssetDetails[],
  combinedAssets: TAsset[],
  symbol: string,
  isRelayDestination: boolean
) => {
  if (destination === 'Ethereum') {
    return combinedAssets.find(
      ({ symbol: assetSymbol }) => assetSymbol?.toLowerCase() === symbol.toLowerCase()
    )
  }

  const otherAssetsMatches = otherAssets.filter(
    ({ symbol: assetSymbol }) => assetSymbol?.toLowerCase() === symbol.toLowerCase()
  )

  const nativeAssetsMatches = nativeAssets.filter(
    ({ symbol: assetSymbol }) => assetSymbol?.toLowerCase() === symbol.toLowerCase()
  )

  const isPolkadotXcm =
    !isRelayChain(node) &&
    node !== 'Ethereum' &&
    getDefaultPallet(node as TNodePolkadotKusama) === 'PolkadotXcm'

  if (node === 'Astar' || node === 'Shiden' || isPolkadotXcm) {
    return nativeAssetsMatches[0] || otherAssetsMatches[0] || null
  }

  if (otherAssetsMatches.length > 1 && !isRelayDestination) {
    throw new DuplicateAssetError(symbol)
  }

  return otherAssetsMatches[0] || nativeAssetsMatches[0] || null
}

export const findAssetById = (assets: TAsset[], assetId: TCurrency) => {
  const otherAssetsMatches = assets.filter(
    ({ assetId: currentAssetId }) => currentAssetId === assetId.toString()
  )

  if (otherAssetsMatches.length > 1) {
    throw new DuplicateAssetIdError(assetId.toString())
  }

  return assets.find(({ assetId: currentAssetId }) => currentAssetId === assetId.toString())
}
