// Contains different useful asset query operations from compatible Parachains asset map

import * as assetsMapJson from '../../maps/assets.json' assert { type: 'json' }
import { NODE_NAMES } from '../../maps/consts'
import { TAssetJsonMap, TNode } from '../../types'

const assetsMap = assetsMapJson as TAssetJsonMap

export function getAssetsObject(node: TNode) {
  return assetsMap[node]
}

export function getAssetId(node: TNode, symbol: string) {
  const info = getAssetsObject(node).otherAssets.find(function (o) {
    return o.symbol === symbol
  })
  return info ? info.assetId : null
}

export function getRelayChainSymbol(node: TNode) {
  return getAssetsObject(node).relayChainAssetSymbol
}

export function getNativeAssets(node: TNode) {
  const info = getAssetsObject(node).nativeAssets
  return info || []
}

export function getOtherAssets(node: TNode) {
  return getAssetsObject(node).otherAssets
}

export function getAllAssetsSymbols(node: TNode) {
  const { relayChainAssetSymbol, nativeAssets, otherAssets } = getAssetsObject(node)
  return [
    relayChainAssetSymbol,
    ...nativeAssets.map(({ symbol }) => symbol),
    ...otherAssets.filter(asset => !!asset.symbol).map(({ symbol }) => symbol)
  ]
}

export function hasSupportForAsset(node: TNode, symbol: string) {
  return getAllAssetsSymbols(node).includes(symbol)
}

export function getAssetDecimals(node: TNode, symbol: string) {
  const { otherAssets, nativeAssets } = getAssetsObject(node)
  const asset = [...otherAssets, ...nativeAssets].find(function (o) {
    return o.symbol === symbol
  })
  return asset ? asset.decimals : null
}

export function getParaId(node: TNode) {
  return getAssetsObject(node).paraId
}

export function getTNode(nodeID: number) {
  for (const node of NODE_NAMES) {
    if (getParaId(node) === nodeID) return node
  }
}
