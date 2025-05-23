import { findAssetForNodeOrThrow } from '@paraspell/assets'
import { getDefaultPallet } from '@paraspell/pallets'

import { InvalidParameterError } from '../../../errors'
import type { TGetBalanceForeignOptions } from '../../../types/TBalance'
import { getBalanceForeignPolkadotXcm } from './getBalanceForeignPolkadotXcm'
import { getBalanceForeignXTokens } from './getBalanceForeignXTokens'

export const getBalanceForeignInternal = async <TApi, TRes>({
  address,
  node,
  currency,
  api
}: TGetBalanceForeignOptions<TApi, TRes>): Promise<bigint> => {
  await api.init(node)

  const asset = findAssetForNodeOrThrow(node, currency, null)

  const defaultPallet = getDefaultPallet(node)

  if (defaultPallet === 'XTokens') {
    return getBalanceForeignXTokens(api, node, address, asset)
  } else if (defaultPallet === 'PolkadotXcm') {
    return getBalanceForeignPolkadotXcm(api, node, address, asset)
  }

  throw new InvalidParameterError('Unsupported pallet')
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
