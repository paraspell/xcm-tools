import * as assetsMap from '../../maps/assets.json' assert { type: 'json' }
import { TAssetJsonMap, TNode } from '../../types'

const assetsMapJson = assetsMap as TAssetJsonMap

function hasAssetsInfo(node: string) {
  return Object.prototype.hasOwnProperty.call(assetsMapJson, node)
}

function getAssetsInfo(node: TNode) {
  return assetsMapJson[node]
}

export function getAssetsObject(node: TNode) {
  if (!hasAssetsInfo(node)) { return null }
  return getAssetsInfo(node)
}

export function getAssetId(node: TNode, symbol: string) {
  if (!hasAssetsInfo(node)) { return null }
  const info = getAssetsInfo(node).otherAssets.find(function (o) {
    return o.symbol === symbol
  })
  return info ? info.assetId : null
}

export function getRelayChainSymbol(node: TNode) {
  if (!hasAssetsInfo(node)) { return null }
  return getAssetsInfo(node).relayChainAssetSymbol
}

export function getNativeAssets(node: TNode) {
  if (!hasAssetsInfo(node)) { return [] }
  const info = getAssetsInfo(node).nativeAssets
  return info || []
}

export function getOtherAssets(node: TNode) {
  if (!hasAssetsInfo(node)) { return [] }
  return getAssetsInfo(node).otherAssets
}

export function getAllAssetsSymbols(node: TNode) {
  if (!hasAssetsInfo(node)) { return [] }
  const { relayChainAssetSymbol, nativeAssets, otherAssets } = getAssetsInfo(node)
  return [relayChainAssetSymbol, ...nativeAssets, ...otherAssets.map(function ({ symbol }) {
    return symbol
  })]
}

export function hasSupportForAsset(node: TNode, symbol: string) {
  if (!hasAssetsInfo(node)) { return false }
  return getAllAssetsSymbols(node).includes(symbol)
}
