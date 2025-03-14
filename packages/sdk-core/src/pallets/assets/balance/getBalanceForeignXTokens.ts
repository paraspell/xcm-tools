import type { TAsset } from '@paraspell/assets'
import { InvalidCurrencyError, isForeignAsset } from '@paraspell/assets'
import type { TNodePolkadotKusama } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../../../api'

export const getBalanceForeignXTokens = async <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  node: TNodePolkadotKusama,
  address: string,
  asset: TAsset
): Promise<bigint> => {
  if (node === 'Astar' || node === 'Shiden') {
    if (!isForeignAsset(asset) || !asset.assetId) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no assetId`)
    }

    return api.getBalanceForeignAssetsAccount(address, BigInt(asset.assetId))
  }

  if (node === 'BifrostPolkadot' || node === 'BifrostKusama') {
    return api.getBalanceForeignBifrost(address, asset)
  }

  return api.getBalanceForeignXTokens(node, address, asset)
}
