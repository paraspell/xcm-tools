import type { TNodeWithRelayChains } from '@paraspell/sdk-common'

import type { TCurrencyCore } from '../types'
import { getAssetsObject } from './assets'
import { findAssetForNodeOrThrow } from './search'

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

  const asset = findAssetForNodeOrThrow(node, currency, null)

  return asset.existentialDeposit ?? null
}
