import type { TAssetInfo } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../../../api'
import { assertHasId } from '../../../utils'

export const getBalanceForeignXTokens = async <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  chain: TSubstrateChain,
  address: string,
  asset: TAssetInfo
): Promise<bigint> => {
  if (
    chain === 'Astar' ||
    chain === 'Shiden' ||
    chain === 'CrustShadow' ||
    chain.startsWith('Integritee')
  ) {
    assertHasId(asset)
    return api.getBalanceAssetsPallet(
      address,
      chain.startsWith('Integritee') ? Number(asset.assetId) : BigInt(asset.assetId)
    )
  }

  if (chain === 'BifrostPolkadot' || chain === 'BifrostKusama') {
    return api.getBalanceForeignBifrost(address, asset)
  }

  return api.getBalanceForeignXTokens(chain, address, asset)
}
