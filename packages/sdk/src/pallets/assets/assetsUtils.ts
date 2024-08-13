// Contains function for getting Asset ID or Symbol used in XCM call creation

import { DuplicateAssetError } from '../../errors'
import {
  TAsset,
  TAssetDetails,
  TCurrency,
  TCurrencyCore,
  TNativeAssetDetails,
  TNodeWithRelayChains
} from '../../types'
import { isTMulti } from '../xcmPallet/utils'
import { getAssetDecimals, getAssetsObject, getOtherAssets } from './assets'

const findAssetBySymbol = (
  node: TNodeWithRelayChains,
  destination: TNodeWithRelayChains | undefined,
  otherAssets: TAssetDetails[],
  nativeAssets: TNativeAssetDetails[],
  combinedAssets: TAsset[],
  symbol: string,
  isRelayDestination: boolean,
  isSymbol: boolean | undefined
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

  if (node === 'Astar' || node === 'Shiden') {
    return nativeAssetsMatches[0] || otherAssetsMatches[0] || null
  }

  if (otherAssetsMatches.length > 1 && !isRelayDestination && isSymbol === undefined) {
    throw new DuplicateAssetError(symbol)
  }

  return otherAssetsMatches[0] || nativeAssetsMatches[0] || null
}

const findAssetById = (assets: TAsset[], assetId: TCurrency) =>
  assets.find(({ assetId: currentAssetId }) => currentAssetId === assetId)

export const getAssetBySymbolOrId = (
  node: TNodeWithRelayChains,
  currency: TCurrencyCore,
  isRelayDestination: boolean = false,
  isSymbol: boolean | undefined = undefined,
  destination?: TNodeWithRelayChains
): TAsset | null => {
  if (isTMulti(currency)) {
    return null
  }

  const currencyString = currency.toString()
  const { otherAssets, nativeAssets, relayChainAssetSymbol } = getAssetsObject(node)
  const combinedAssets =
    destination === 'Ethereum' ? [...getOtherAssets('Ethereum')] : [...otherAssets, ...nativeAssets]

  let asset: TAsset | undefined
  if (isSymbol === true) {
    asset = findAssetBySymbol(
      node,
      destination,
      otherAssets,
      nativeAssets,
      combinedAssets,
      currencyString,
      isRelayDestination,
      isSymbol
    )
  } else if (isSymbol === false) {
    asset = findAssetById(combinedAssets, currencyString)
  } else {
    asset =
      findAssetBySymbol(
        node,
        destination,
        otherAssets,
        nativeAssets,
        combinedAssets,
        currencyString,
        isRelayDestination,
        isSymbol
      ) || findAssetById(combinedAssets, currencyString)
  }

  if (asset) {
    return asset
  }

  if (relayChainAssetSymbol.toLowerCase() === currencyString.toLowerCase() && isSymbol !== false) {
    const relayChainAsset: TNativeAssetDetails = {
      symbol: relayChainAssetSymbol,
      decimals: getAssetDecimals(node, relayChainAssetSymbol) as number
    }
    return relayChainAsset
  }

  return null
}
