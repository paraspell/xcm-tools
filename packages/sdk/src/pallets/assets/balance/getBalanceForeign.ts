import { getDefaultPallet } from '../../pallets'
import { getAssetBySymbolOrId } from '../getAssetBySymbolOrId'
import { getBalanceForeignPolkadotXcm } from './getBalanceForeignPolkadotXcm'
import type { TGetBalanceForeignOptions } from '../../../types/TBalance'
import { InvalidCurrencyError } from '../../../errors'
import { getBalanceForeignXTokens } from './getBalanceForeignXTokens'

export const getBalanceForeign = async <TApi, TRes>({
  address,
  node,
  currency,
  api
}: TGetBalanceForeignOptions<TApi, TRes>): Promise<bigint> => {
  await api.init(node)

  const asset =
    getAssetBySymbolOrId(node, currency, null) ??
    (node === 'AssetHubPolkadot' ? getAssetBySymbolOrId('Ethereum', currency, null) : null)

  if (!asset) {
    throw new InvalidCurrencyError(`Asset ${JSON.stringify(currency)} not found on ${node}`)
  }

  if (getDefaultPallet(node) === 'XTokens') {
    return await getBalanceForeignXTokens(api, node, address, asset)
  } else if (getDefaultPallet(node) === 'PolkadotXcm') {
    return await getBalanceForeignPolkadotXcm(api, node, address, asset)
  }
  throw new Error('Unsupported pallet')
}
