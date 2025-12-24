import { isSubstrateBridge, replaceBigInt, type TChain } from '@paraspell/sdk-common'

import { InvalidCurrencyError } from '../../errors'
import type { TAssetInfo, TCurrencyInput } from '../../types'
import { Foreign, Native } from '../assetSelectors'
import { isStableCoinAsset } from '../isStableCoinAsset'
import { findAssetInfo } from './findAssetInfo'
import { findAssetInfoOrThrow } from './findAssetInfoOrThrow'
import { findStablecoinAssets } from './findStablecoinAssets'

export const findAssetInfoOnDest = (
  origin: TChain,
  destination: TChain,
  currency: TCurrencyInput,
  originAsset?: TAssetInfo | null
): TAssetInfo | null => {
  const isBridge = isSubstrateBridge(origin, destination)

  const resolvedOriginAsset = originAsset ?? findAssetInfoOrThrow(origin, currency, destination)

  if (isBridge) {
    // Try native first
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

    // Then try foreign
    const foreignMatch = findAssetInfo(
      destination,
      { symbol: Foreign(resolvedOriginAsset.symbol) },
      null
    )
    if (foreignMatch) return foreignMatch

    return null
  }

  const assetByLocation = resolvedOriginAsset.location
    ? findAssetInfo(destination, { location: resolvedOriginAsset.location }, null)
    : null

  return assetByLocation ?? findAssetInfo(destination, { symbol: resolvedOriginAsset.symbol }, null)
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
