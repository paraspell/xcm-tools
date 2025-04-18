import type { TNodeWithRelayChains } from '@paraspell/sdk-common'

import { InvalidCurrencyError } from '../errors'
import type { TCurrencyCore } from '../types'
import { getAssetsObject } from './assets'
import { findAsset } from './search'

/**
 * Retrieves the existential deposit value for a given node.
 *
 * @param node - The node for which to get the existential deposit.
 * @returns The existential deposit as a string if available; otherwise, null.
 */
export const getExistentialDeposit = (
  node: TNodeWithRelayChains,
  currency?: TCurrencyCore
): string | null => {
  const assetsObject = getAssetsObject(node)
  if (!currency) {
    return assetsObject.nativeAssets[0].existentialDeposit ?? null
  }

  const asset =
    findAsset(node, currency, null) ??
    (node === 'AssetHubPolkadot' ? findAsset('Ethereum', currency, null) : null)

  if (!asset) {
    throw new InvalidCurrencyError(`Asset ${JSON.stringify(currency)} not found on ${node}`)
  }

  return asset.existentialDeposit ?? null
}
