// Contains different useful asset query operations from compatible Parachains asset map

import * as assetsMapJson from '../../maps/assets.json' assert { type: 'json' }
import { NODE_NAMES } from '../../maps/consts'
import type { TNodeWithRelayChains, TAsset } from '../../types'
import {
  type TNodeAssets,
  type TAssetJsonMap,
  type TNode,
  type TRelayChainSymbol,
  type TNativeAssetDetails,
  type TAssetDetails
} from '../../types'
import { determineRelayChain } from '../../utils'
import { getAssetBySymbolOrId } from './getAssetBySymbolOrId'

const assetsMap = assetsMapJson as TAssetJsonMap

/**
 * Retrieves the assets object for a given node containing the native and foreign assets.
 *
 * @param node - The node for which to retrieve the assets object.
 * @returns The assets object associated with the given node.
 */
export const getAssetsObject = (node: TNodeWithRelayChains): TNodeAssets => assetsMap[node]

/**
 * Retrieves the asset ID for a given symbol on a specified node.
 *
 * @param node - The node to search for the asset.
 * @param symbol - The symbol of the asset.
 * @returns The asset ID if found; otherwise, null.
 */
export const getAssetId = (node: TNode, symbol: string): string | null => {
  const info = getAssetsObject(node).otherAssets.find(o => o.symbol === symbol)
  return info != null ? info.assetId : null
}

/**
 * Retrieves the relay chain asset symbol for a specified node.
 *
 * @param node - The node for which to get the relay chain symbol.
 * @returns The relay chain asset symbol.
 */
export const getRelayChainSymbol = (node: TNodeWithRelayChains): TRelayChainSymbol =>
  getAssetsObject(node).relayChainAssetSymbol

/**
 * Retrieves the list of native assets for a specified node.
 *
 * @param node - The node for which to get native assets.
 * @returns An array of native asset details.
 */
export const getNativeAssets = (node: TNode): TNativeAssetDetails[] =>
  getAssetsObject(node).nativeAssets

/**
 * Retrieves the list of other (non-native) assets for a specified node.
 *
 * @param node - The node for which to get other assets.
 * @returns An array of other asset details.
 */
export const getOtherAssets = (node: TNode): TAssetDetails[] => getAssetsObject(node).otherAssets

/**
 * Retrieves the complete list of assets for a specified node, including relay chain asset, native, and other assets.
 *
 * @param node - The node for which to get the assets.
 * @returns An array of objects of all assets associated with the node.
 */
export const getAssets = (node: TNodeWithRelayChains): TAsset[] => {
  const { nativeAssets, otherAssets } = getAssetsObject(node)
  const relayChainAsset = getAssetBySymbolOrId(determineRelayChain(node), {
    symbol: getRelayChainSymbol(node)
  })
  return [...(relayChainAsset ? [relayChainAsset] : []), ...nativeAssets, ...otherAssets]
}

/**
 * Retrieves the symbols of all assets (relay chain, native, and other assets) for a specified node.
 *
 * @param node - The node for which to get asset symbols.
 * @returns An array of asset symbols.
 */
export const getAllAssetsSymbols = (node: TNodeWithRelayChains): string[] => {
  const { relayChainAssetSymbol, nativeAssets, otherAssets } = getAssetsObject(node)
  const nativeAssetsSymbols = nativeAssets.map(({ symbol }) => symbol)
  const otherAssetsSymbols = otherAssets
    .filter(asset => asset.symbol !== undefined)
    .map(({ symbol }) => symbol) as string[]
  return [relayChainAssetSymbol, ...nativeAssetsSymbols, ...otherAssetsSymbols]
}

/**
 * Retrieves the symbol of the native asset for a specified node.
 *
 * @param node - The node for which to get the native asset symbol.
 * @returns The symbol of the native asset.
 */
export const getNativeAssetSymbol = (node: TNodeWithRelayChains): string => {
  if (node === 'Polkadot') {
    return 'DOT'
  } else if (node === 'Kusama') {
    return 'KSM'
  }
  return getAssetsObject(node).nativeAssetSymbol
}

/**
 * Determines whether a specified node supports an asset with the given symbol.
 *
 * @param node - The node to check for asset support.
 * @param symbol - The symbol of the asset to check.
 * @returns True if the asset is supported; otherwise, false.
 */
export const hasSupportForAsset = (node: TNode, symbol: string): boolean =>
  getAllAssetsSymbols(node)
    .map(s => s.toLowerCase())
    .includes(symbol.toLowerCase())

/**
 * Retrieves the number of decimals for an asset with the given symbol on a specified node.
 *
 * @param node - The node where the asset is located.
 * @param symbol - The symbol of the asset.
 * @returns The number of decimals if the asset is found; otherwise, null.
 */
export const getAssetDecimals = (node: TNodeWithRelayChains, symbol: string): number | null => {
  const { otherAssets, nativeAssets } = getAssetsObject(node)
  const asset = [...otherAssets, ...nativeAssets].find(o => o.symbol === symbol)
  return asset?.decimals !== undefined ? asset.decimals : null
}

/**
 * Retrieves the parachain ID for a specified node.
 *
 * @param node - The node for which to get the paraId.
 * @returns The parachain ID of the node.
 */
export const getParaId = (node: TNode): number => {
  return getAssetsObject(node).paraId as number
}

/**
 * Retrieves the node name corresponding to a specified parachain ID.
 *
 * @param paraId - The parachain ID.
 * @returns The node name if found; otherwise, null.
 */
export const getTNode = (paraId: number): TNode | null =>
  NODE_NAMES.find(node => getParaId(node) === paraId) ?? null
