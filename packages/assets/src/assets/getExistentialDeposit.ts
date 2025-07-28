import { replaceBigInt, type TNodeWithRelayChains } from '@paraspell/sdk-common'

import { InvalidCurrencyError } from '../errors'
import type { TAssetInfo, TCurrencyCore } from '../types'
import { getNativeAssetSymbol } from './assets'
import { Native } from './assetSelectors'
import { findAssetInfo, findAssetInfoOrThrow } from './search'

/**
 * Retrieves the existential deposit value for a given node.
 *
 * @param node - The node for which to get the existential deposit.
 * @returns The existential deposit as a bigint if available; otherwise, null.
 */
export const getExistentialDeposit = (
  node: TNodeWithRelayChains,
  currency?: TCurrencyCore
): bigint | null => {
  let asset: TAssetInfo | null

  if (!currency) {
    const nativeAssetSymbol = getNativeAssetSymbol(node)
    asset =
      findAssetInfo(node, { symbol: Native(nativeAssetSymbol) }, null) ??
      findAssetInfoOrThrow(node, { symbol: nativeAssetSymbol }, null)
  } else {
    asset = findAssetInfoOrThrow(node, currency, null)
  }

  return asset?.existentialDeposit ? BigInt(asset.existentialDeposit) : null
}

export const getExistentialDepositOrThrow = (
  node: TNodeWithRelayChains,
  currency?: TCurrencyCore
): bigint => {
  const ed = getExistentialDeposit(node, currency)
  if (ed === null) {
    throw new InvalidCurrencyError(
      `Existential deposit not found for currency ${JSON.stringify(currency, replaceBigInt)} on node ${node}.`
    )
  }
  return ed
}
