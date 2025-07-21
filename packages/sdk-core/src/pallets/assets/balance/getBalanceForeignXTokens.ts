import type { TAsset } from '@paraspell/assets'
import type { TNodePolkadotKusama } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../../../api'
import { assertHasId } from '../../../utils'

export const getBalanceForeignXTokens = async <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  node: TNodePolkadotKusama,
  address: string,
  asset: TAsset
): Promise<bigint> => {
  if (node === 'Astar' || node === 'Shiden') {
    assertHasId(asset)

    return api.getBalanceAssetsPallet(address, BigInt(asset.assetId))
  }

  if (node === 'BifrostPolkadot' || node === 'BifrostKusama') {
    return api.getBalanceForeignBifrost(address, asset)
  }

  return api.getBalanceForeignXTokens(node, address, asset)
}
