import { isSnowbridge, isSubstrateBridge, replaceBigInt, type TChain } from '@paraspell/sdk-common'

import { InvalidCurrencyError } from '../../errors'
import type { TAssetInfo, TCurrencyInput } from '../../types'
import { Foreign, Native } from '../assetSelectors'
import { isStableCoinAsset } from '../isStableCoinAsset'
import { isSystemAsset } from '../isSystemAsset'
import { findAssetInfo } from './findAssetInfo'
import { findAssetInfoOrThrow } from './findAssetInfoOrThrow'
import { findStablecoinAssets } from './findStablecoinAssets'

const findAssetInfoOnSubBridgeDest = (
  destination: TChain,
  resolvedOriginAsset: TAssetInfo
): TAssetInfo | null => {
  const nativeMatch = findAssetInfo(
    destination,
    { symbol: Native(resolvedOriginAsset.symbol) },
    null
  )
  if (nativeMatch) return nativeMatch

  const isStablecoin = isStableCoinAsset(resolvedOriginAsset)

  if (isStablecoin) {
    const stablecoins = findStablecoinAssets(destination)
    const match = stablecoins.find(asset => asset.symbol === resolvedOriginAsset.symbol)
    if (match) return match
  }

  const foreignMatch = findAssetInfo(
    destination,
    { symbol: Foreign(resolvedOriginAsset.symbol) },
    null
  )
  if (foreignMatch) return foreignMatch

  return null
}

export const findAssetInfoOnDest = (
  origin: TChain,
  destination: TChain,
  currency: TCurrencyInput,
  originAsset?: TAssetInfo | null
): TAssetInfo | null => {
  const isSubBridge = isSubstrateBridge(origin, destination)
  const isSb = isSnowbridge(origin, destination)

  const resolvedOriginAsset = originAsset ?? findAssetInfoOrThrow(origin, currency, destination)

  if (isSubBridge) {
    return findAssetInfoOnSubBridgeDest(destination, resolvedOriginAsset)
  }

  if (isSb && isSystemAsset(resolvedOriginAsset)) {
    const match = findAssetInfo(destination, { symbol: resolvedOriginAsset.symbol }, null)
    if (match) return match
  }

  return findAssetInfo(destination, { location: resolvedOriginAsset.location }, null)
}

export const findAssetOnDestOrThrow = (
  origin: TChain,
  destination: TChain,
  currency: TCurrencyInput
): TAssetInfo => {
  const asset = findAssetInfoOnDest(origin, destination, currency)

  if (!asset) {
    throw new InvalidCurrencyError(
      `Asset ${JSON.stringify(currency, replaceBigInt)} not found on ${destination}`
    )
  }

  return asset
}
