// Contains different useful asset query operations from compatible Parachains asset map

import * as assetsMapJson from '../../maps/assets.json' assert { type: 'json' }
import { NODE_NAMES } from '../../maps/consts'
import {
  type TNodeAssets,
  type TAssetJsonMap,
  type TNode,
  type TRelayChainSymbol,
  type TNativeAssetDetails,
  type TAssetDetails,
  TNodeWithRelayChains,
  TAsset
} from '../../types'
import { determineRelayChain } from '../../utils'
import { getAssetBySymbolOrId } from './getAssetBySymbolOrId'

const assetsMap = assetsMapJson as TAssetJsonMap

export const getAssetsObject = (node: TNodeWithRelayChains): TNodeAssets => assetsMap[node]

export const getAssetId = (node: TNode, symbol: string): string | null => {
  const info = getAssetsObject(node).otherAssets.find(o => o.symbol === symbol)
  return info != null ? info.assetId : null
}

export const getRelayChainSymbol = (node: TNodeWithRelayChains): TRelayChainSymbol =>
  getAssetsObject(node).relayChainAssetSymbol

export const getNativeAssets = (node: TNode): TNativeAssetDetails[] =>
  getAssetsObject(node).nativeAssets

export const getOtherAssets = (node: TNode): TAssetDetails[] => getAssetsObject(node).otherAssets

export const getAssets = (node: TNodeWithRelayChains): TAsset[] => {
  const { nativeAssets, otherAssets } = getAssetsObject(node)
  const relayChainAsset = getAssetBySymbolOrId(determineRelayChain(node), {
    symbol: getRelayChainSymbol(node)
  })
  return [...(relayChainAsset ? [relayChainAsset] : []), ...nativeAssets, ...otherAssets]
}

export const getAllAssetsSymbols = (node: TNodeWithRelayChains): string[] => {
  const { relayChainAssetSymbol, nativeAssets, otherAssets } = getAssetsObject(node)
  const nativeAssetsSymbols = nativeAssets.map(({ symbol }) => symbol)
  const otherAssetsSymbols = otherAssets
    .filter(asset => asset.symbol !== undefined)
    .map(({ symbol }) => symbol) as string[]
  return [relayChainAssetSymbol, ...nativeAssetsSymbols, ...otherAssetsSymbols]
}

export const getNativeAssetSymbol = (node: TNodeWithRelayChains): string => {
  if (node === 'Polkadot') {
    return 'DOT'
  } else if (node === 'Kusama') {
    return 'KSM'
  }
  return getAssetsObject(node).nativeAssetSymbol
}
export const hasSupportForAsset = (node: TNode, symbol: string): boolean =>
  getAllAssetsSymbols(node)
    .map(s => s.toLowerCase())
    .includes(symbol.toLowerCase())

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

  return [...originAssets.filter(asset => destinationAssets.some(a => a.symbol === asset.symbol))]
}

export const getAssetDecimals = (node: TNodeWithRelayChains, symbol: string): number | null => {
  const { otherAssets, nativeAssets } = getAssetsObject(node)
  const asset = [...otherAssets, ...nativeAssets].find(o => o.symbol === symbol)
  return asset?.decimals !== undefined ? asset.decimals : null
}

export const getParaId = (node: TNode): number => {
  return getAssetsObject(node).paraId as number
}

export const getTNode = (paraId: number): TNode | null =>
  NODE_NAMES.find(node => getParaId(node) === paraId) ?? null
