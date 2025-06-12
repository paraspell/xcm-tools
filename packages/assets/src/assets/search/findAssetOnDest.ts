import { replaceBigInt, type TNodeWithRelayChains } from '@paraspell/sdk-common'

import { InvalidCurrencyError } from '../../errors'
import type { TAsset, TCurrencyInput } from '../../types'
import { findAsset } from './findAsset'
import { findAssetForNodeOrThrow } from './findAssetForNodeOrThrow'

export const findAssetOnDest = (
  origin: TNodeWithRelayChains,
  destination: TNodeWithRelayChains,
  currency: TCurrencyInput,
  originAsset?: TAsset | null
): TAsset | null => {
  const isDotKsmBridge =
    (origin === 'AssetHubPolkadot' && destination === 'AssetHubKusama') ||
    (origin === 'AssetHubKusama' && destination === 'AssetHubPolkadot')

  const resolvedOriginAsset = originAsset ?? findAssetForNodeOrThrow(origin, currency, destination)

  const assetByMultiLocation =
    !isDotKsmBridge && resolvedOriginAsset.multiLocation
      ? findAsset(destination, { multilocation: resolvedOriginAsset.multiLocation }, null)
      : null

  return (
    assetByMultiLocation ?? findAsset(destination, { symbol: resolvedOriginAsset.symbol }, null)
  )
}

export const findAssetOnDestOrThrow = (
  origin: TNodeWithRelayChains,
  destination: TNodeWithRelayChains,
  currency: TCurrencyInput
): TAsset => {
  const asset = findAssetOnDest(origin, destination, currency)

  if (!asset) {
    throw new InvalidCurrencyError(
      `Asset ${JSON.stringify(currency, replaceBigInt)} not found on ${destination}`
    )
  }

  return asset
}
