import { InvalidCurrencyError } from '../../../errors'
import type { TGetBalanceForeignOptions } from '../../../types/TBalance'
import { getDefaultPallet } from '../../pallets'
import { getAssetBySymbolOrId } from '../getAssetBySymbolOrId'
import { getBalanceForeignPolkadotXcm } from './getBalanceForeignPolkadotXcm'
import { getBalanceForeignXTokens } from './getBalanceForeignXTokens'

export const getBalanceForeignInternal = async <TApi, TRes>({
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

  const defaultPallet = getDefaultPallet(node)

  if (defaultPallet === 'XTokens') {
    return getBalanceForeignXTokens(api, node, address, asset)
  } else if (defaultPallet === 'PolkadotXcm') {
    return getBalanceForeignPolkadotXcm(api, node, address, asset)
  }

  throw new Error('Unsupported pallet')
}

export const getBalanceForeign = async <TApi, TRes>(
  options: TGetBalanceForeignOptions<TApi, TRes>
): Promise<bigint> => {
  const { api } = options
  try {
    return await getBalanceForeignInternal(options)
  } finally {
    await api.disconnect()
  }
}
