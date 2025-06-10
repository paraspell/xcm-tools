import { replaceBigInt, type TNodeWithRelayChains } from '@paraspell/sdk-common'

import { InvalidCurrencyError } from '../../errors'
import type { TAsset, TCurrencyInput } from '../../types'
import { findAsset } from './findAsset'

export const findAssetForNodeOrThrow = (
  node: TNodeWithRelayChains,
  currency: TCurrencyInput,
  destination: TNodeWithRelayChains | null
): TAsset => {
  const asset =
    findAsset(node, currency, destination) ??
    (node === 'AssetHubPolkadot' ? findAsset('Ethereum', currency, null) : null)

  if (!asset) {
    throw new InvalidCurrencyError(
      `Asset ${JSON.stringify(currency, replaceBigInt)} not found on ${node}`
    )
  }

  return asset
}
