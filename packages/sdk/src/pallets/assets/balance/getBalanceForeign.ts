import { type ApiPromise } from '@polkadot/api'
import type { TCurrencyCore, TNodePolkadotKusama } from '../../../types'
import { getDefaultPallet } from '../../pallets'
import { createApiInstanceForNode } from '../../../utils'
import { getAssetBySymbolOrId } from '../getAssetBySymbolOrId'
import { getBalanceForeignXTokens } from './getBalanceForeignXTokens'
import { getBalanceForeignPolkadotXcm } from './getBalanceForeignPolkadotXcm'

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
