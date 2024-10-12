import { type ApiPromise } from '@polkadot/api'
import type { TCurrencyCore, TNodePolkadotKusama } from '../../../types'
import { getDefaultPallet } from '../../pallets'
import { createApiInstanceForNode } from '../../../utils'
import { getAssetBySymbolOrId } from '../getAssetBySymbolOrId'
import { getBalanceForeignXTokens } from './getBalanceForeignXTokens'
import { getBalanceForeignPolkadotXcm } from './getBalanceForeignPolkadotXcm'

/**
 * Retrieves the balance of a foreign asset for a given account on a specified node.
 *
 * @param address - The address of the account.
 * @param node - The node on which to query the balance.
 * @param symbolOrId - The symbol or ID of the currency to query.
 * @param api - Optional API instance; if not provided, one will be created.
 * @returns The balance of the foreign asset as a bigint, or null if not found.
 * @throws Error if the pallet is unsupported.
 */
export const getBalanceForeign = async (
  address: string,
  node: TNodePolkadotKusama,
  symbolOrId: TCurrencyCore,
  api?: ApiPromise
): Promise<bigint | null> => {
  const apiWithFallback = api ?? (await createApiInstanceForNode(node))
  const asset = getAssetBySymbolOrId(node, symbolOrId)
  if (getDefaultPallet(node) === 'XTokens') {
    return await getBalanceForeignXTokens(
      address,
      symbolOrId,
      asset?.symbol,
      asset?.assetId,
      apiWithFallback
    )
  } else if (getDefaultPallet(node) === 'PolkadotXcm') {
    const currencyStr =
      'symbol' in symbolOrId
        ? symbolOrId.symbol
        : 'id' in symbolOrId
          ? symbolOrId.id.toString()
          : undefined
    return await getBalanceForeignPolkadotXcm(
      address,
      asset?.assetId ?? currencyStr,
      apiWithFallback,
      node,
      asset?.symbol
    )
  }
  throw new Error('Unsupported pallet')
}
