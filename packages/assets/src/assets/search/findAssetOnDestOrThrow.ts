import type { TNodeWithRelayChains } from '@paraspell/sdk-common'

import type { TAsset, TCurrencyInput } from '../../types'
import { findAsset } from './findAsset'
import { findAssetForNodeOrThrow } from './findAssetForNodeOrThrow'

export const findAssetOnDestOrThrow = (
  origin: TNodeWithRelayChains,
  destination: TNodeWithRelayChains,
  currency: TCurrencyInput
): TAsset => {
  const isDotKsmBridge =
    (origin === 'AssetHubPolkadot' && destination === 'AssetHubKusama') ||
    (origin === 'AssetHubKusama' && destination === 'AssetHubPolkadot')

  const originAsset = findAssetForNodeOrThrow(origin, currency, destination)

  const assetByMultiLocation =
    !isDotKsmBridge && originAsset.multiLocation
      ? findAsset(destination, { multilocation: originAsset.multiLocation }, null)
      : null

  return (
    assetByMultiLocation ??
    findAssetForNodeOrThrow(destination, { symbol: originAsset.symbol }, null)
  )
}
