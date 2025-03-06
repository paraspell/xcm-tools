// Contains different useful asset query operations from compatible Parachains asset map

import { NODE_NAMES_DOT_KSM } from '../../constants'
import assetsMapJson from '../../maps/assets.json' with { type: 'json' }
import { getParaId } from '../../nodes/config'
import type { TAsset, TEcosystemType, TForeignAsset, TNodeWithRelayChains } from '../../types'
import {
  type TAssetJsonMap,
  type TNativeAsset,
  type TNode,
  type TNodeAssets,
  type TRelayChainSymbol
} from '../../types'
import { getNode } from '../../utils'

const assetsMap = assetsMapJson as TAssetJsonMap

/**
 * Retrieves the assets object for a given node containing the native and foreign assets.
 *
 * @param node - The node for which to retrieve the assets object.
 * @returns The assets object associated with the given node.
 */
export const getAssetsObject = (node: TNodeWithRelayChains): TNodeAssets => assetsMap[node]

export const isNodeEvm = (node: TNodeWithRelayChains): boolean => {
  return assetsMap[node].isEVM
}

/**
 * Retrieves the asset ID for a given symbol on a specified node.
 *
 * @param node - The node to search for the asset.
 * @param symbol - The symbol of the asset.
 * @returns The asset ID if found; otherwise, null.
 */
export const getAssetId = (node: TNode, symbol: string): string | null => {
  const asset = getAssetsObject(node).otherAssets.find(o => o.symbol === symbol)
  return asset != null && asset.assetId ? asset.assetId : null
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
export const getNativeAssets = (node: TNode): TNativeAsset[] => getAssetsObject(node).nativeAssets

/**
 * Retrieves the list of other (non-native) assets for a specified node.
 *
 * @param node - The node for which to get other assets.
 * @returns An array of other asset details.
 */
export const getOtherAssets = (node: TNodeWithRelayChains): TForeignAsset[] => {
  const otherAssets = getAssetsObject(node).otherAssets
  return node === 'AssetHubPolkadot'
    ? [...otherAssets, ...getAssetsObject('Ethereum').otherAssets]
    : otherAssets
}

/**
 * Retrieves the complete list of assets for a specified node, including relay chain asset, native, and other assets.
 *
 * @param node - The node for which to get the assets.
 * @returns An array of objects of all assets associated with the node.
 */
export const getAssets = (node: TNodeWithRelayChains): TAsset[] => {
  const { nativeAssets, otherAssets } = getAssetsObject(node)
  return [...nativeAssets, ...otherAssets]
}

/**
 * Retrieves the symbols of all assets (relay chain, native, and other assets) for a specified node.
 *
 * @param node - The node for which to get asset symbols.
 * @returns An array of asset symbols.
 */
export const getAllAssetsSymbols = (node: TNodeWithRelayChains): string[] => {
  const { nativeAssets, otherAssets } = getAssetsObject(node)
  const nativeAssetsSymbols = nativeAssets.map(({ symbol }) => symbol)
  const otherAssetsSymbols = otherAssets.map(({ symbol }) => symbol)

  const ethAssetsSymbols =
    node === 'AssetHubPolkadot'
      ? getAssetsObject('Ethereum').otherAssets.map(({ symbol }) => symbol)
      : []

  return [...nativeAssetsSymbols, ...otherAssetsSymbols, ...ethAssetsSymbols]
}

/**
 * Retrieves the symbol of the native asset for a specified node.
 *
 * @param node - The node for which to get the native asset symbol.
 * @returns The symbol of the native asset.
 */
export const getNativeAssetSymbol = (node: TNodeWithRelayChains): string =>
  getAssetsObject(node).nativeAssetSymbol

/**
 * Determines whether a specified node supports an asset with the given symbol.
 *
 * @param node - The node to check for asset support.
 * @param symbol - The symbol of the asset to check.
 * @returns True if the asset is supported; otherwise, false.
 */
export const hasSupportForAsset = (node: TNodeWithRelayChains, symbol: string): boolean => {
  const lowerSymbol = symbol.toLowerCase()
  const symbolsToCheck = new Set<string>()

  symbolsToCheck.add(lowerSymbol)

  if (lowerSymbol.startsWith('xc')) {
    symbolsToCheck.add(lowerSymbol.substring(2))
  } else {
    symbolsToCheck.add(`xc${lowerSymbol}`)
  }

  if (lowerSymbol.endsWith('.e')) {
    symbolsToCheck.add(lowerSymbol.substring(0, lowerSymbol.length - 2))
  } else {
    symbolsToCheck.add(`${lowerSymbol}.e`)
  }

  const nodeSymbols = getAllAssetsSymbols(node).map(s => s.toLowerCase())

  return nodeSymbols.some(nodeSymbol => symbolsToCheck.has(nodeSymbol))
}
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
 * Retrieves the node name corresponding to a specified parachain ID.
 *
 * @param paraId - The parachain ID.
 * @returns The node name if found; otherwise, null.
 */
export const getTNode = (
  paraId: number,
  ecosystem: TEcosystemType
): TNodeWithRelayChains | null => {
  if (paraId === 0) {
    return ecosystem === 'polkadot' ? 'Polkadot' : 'Kusama'
  }

  if (paraId === 1) {
    return 'Ethereum'
  }

  return (
    NODE_NAMES_DOT_KSM.find(
      nodeName => getNode(nodeName).type === ecosystem && getParaId(nodeName) === paraId
    ) ?? null
  )
}

export const hasDryRunSupport = (node: TNodeWithRelayChains): boolean => {
  return getAssetsObject(node).supportsDryRunApi
}

export * from './getAssetMultiLocation'
export * from './getExistentialDeposit'
