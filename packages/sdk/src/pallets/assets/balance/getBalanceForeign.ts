import { getDefaultPallet } from '../../pallets'
import { getAssetBySymbolOrId } from '../getAssetBySymbolOrId'
import { getBalanceForeignPolkadotXcm } from './getBalanceForeignPolkadotXcm'
import type { TGetBalanceForeignOptions } from '../../../types/TBalance'
import { InvalidCurrencyError } from '../../../errors'

export const getBalanceForeign = async <TApi, TRes>({
  address,
  node,
  currency,
  api
}: TGetBalanceForeignOptions<TApi, TRes>): Promise<bigint | null> => {
  await api.init(node)

  const asset = getAssetBySymbolOrId(node, currency)

  if (!asset) {
    throw new InvalidCurrencyError(`Asset ${JSON.stringify(currency)} not found on ${node}`)
  }

  if (getDefaultPallet(node) === 'XTokens') {
    return await api.getBalanceForeignXTokens(address, asset)
  } else if (getDefaultPallet(node) === 'PolkadotXcm') {
    return await getBalanceForeignPolkadotXcm(address, asset, api, node)
  }
  throw new Error('Unsupported pallet')
}
