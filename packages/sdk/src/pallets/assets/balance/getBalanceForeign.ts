import { getDefaultPallet } from '../../pallets'
import { getAssetBySymbolOrId } from '../getAssetBySymbolOrId'
import { getBalanceForeignPolkadotXcm } from './getBalanceForeignPolkadotXcm'
import type { TGetBalanceForeignOptions } from '../../../types/TBalance'

export const getBalanceForeign = async <TApi, TRes>({
  address,
  node,
  currency,
  api
}: TGetBalanceForeignOptions<TApi, TRes>): Promise<bigint | null> => {
  await api.init(node)
  const asset = getAssetBySymbolOrId(node, currency)
  if (getDefaultPallet(node) === 'XTokens') {
    return await api.getBalanceForeignXTokens(address, currency, asset?.symbol, asset?.assetId)
  } else if (getDefaultPallet(node) === 'PolkadotXcm') {
    const currencyStr =
      'symbol' in currency ? currency.symbol : 'id' in currency ? currency.id.toString() : undefined
    return await getBalanceForeignPolkadotXcm(
      address,
      asset?.assetId ?? currencyStr,
      api,
      node,
      asset?.symbol
    )
  }
  throw new Error('Unsupported pallet')
}
