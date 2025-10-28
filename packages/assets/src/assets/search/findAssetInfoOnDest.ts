import { replaceBigInt, type TChain } from '@paraspell/sdk-common'

import { InvalidCurrencyError } from '../../errors'
import type { TAssetInfo, TCurrencyInput } from '../../types'
import { findAssetInfo } from './findAssetInfo'
import { findAssetInfoOrThrow } from './findAssetInfoOrThrow'

export const findAssetInfoOnDest = (
  origin: TChain,
  destination: TChain,
  currency: TCurrencyInput,
  originAsset?: TAssetInfo | null
): TAssetInfo | null => {
  const resolvedOriginAsset = originAsset ?? findAssetInfoOrThrow(origin, currency, destination)

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
