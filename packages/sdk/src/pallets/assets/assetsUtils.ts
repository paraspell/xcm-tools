// Contains function for getting Asset ID or Symbol used in XCM call creation

import { DuplicateAssetError } from '../../errors'
import {
  TAssetDetails,
  TCurrency,
  TCurrencyCore,
  TNativeAssetDetails,
  type TNode
} from '../../types'
import { isTMulti } from '../xcmPallet/utils'
import { getAssetsObject } from './assets'

type TAsset = TAssetDetails | TNativeAssetDetails

const findAssetBySymbol = (
  otherAssets: TAssetDetails[],
  nativeAssets: TNativeAssetDetails[],
  symbol: string,
  isRelayDestination: boolean
) => {
  const otherAssetsMatches = otherAssets.filter(
    ({ symbol: assetSymbol }) => assetSymbol?.toLowerCase() === symbol.toLowerCase()
  )

  const nativeAssetsMatches = nativeAssets.filter(
    ({ symbol: assetSymbol }) => assetSymbol?.toLowerCase() === symbol.toLowerCase()
  )

  if (otherAssetsMatches.length > 1 && !isRelayDestination) {
    throw new DuplicateAssetError(symbol)
  }

  return otherAssetsMatches[0] || nativeAssetsMatches[0] || null
}

const findAssetById = (assets: TAsset[], assetId: TCurrency) =>
  assets.find(({ assetId: currentAssetId }) => currentAssetId === assetId)

export const getAssetBySymbolOrId = (
  node: TNode,
  currency: TCurrencyCore,
  isRelayDestination: boolean = false,
  isSymbol: boolean | undefined = undefined
): { symbol?: string; assetId?: string } | null => {
  if (isTMulti(currency)) {
    return null
  }

  const currencyString = currency.toString()
  const { otherAssets, nativeAssets, relayChainAssetSymbol } = getAssetsObject(node)
  const combinedAssets = [...otherAssets, ...nativeAssets]

  let asset
  if (isSymbol === true) {
    asset = findAssetBySymbol(otherAssets, nativeAssets, currencyString, isRelayDestination)
  } else if (isSymbol === false) {
    asset = findAssetById(combinedAssets, currencyString)
  } else {
    asset =
      findAssetBySymbol(otherAssets, nativeAssets, currencyString, isRelayDestination) ||
      findAssetById(combinedAssets, currencyString)
  }

  if (asset) {
    return { symbol: asset.symbol, assetId: asset.assetId }
  }

  if (relayChainAssetSymbol === currencyString && isSymbol !== false) {
    return { symbol: relayChainAssetSymbol }
  }

  return null
}
