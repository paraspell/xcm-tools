import { type TAssetInfo } from '@paraspell/assets'
import { hasJunction, type TNodePolkadotKusama } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../../../api/IPolkadotApi'
import { assertHasId, assertHasLocation, assertIsForeign } from '../../../utils'
import { getMoonbeamErc20Balance } from './getMoonbeamErc20Balance'

export const getBalanceForeignPolkadotXcm = async <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  node: TNodePolkadotKusama,
  address: string,
  asset: TAssetInfo
): Promise<bigint> => {
  if (node === 'Moonbeam' || node === 'Moonriver') {
    assertHasId(asset)
    return getMoonbeamErc20Balance(node, asset.assetId, address)
  }

  if (node === 'Mythos') {
    return api.getMythosForeignBalance(address)
  }

  assertIsForeign(asset)

  if (node === 'Polimec') {
    assertHasLocation(asset)

    return api.getBalanceForeignAssetsPallet(address, asset.location)
  }

  if (node === 'AssetHubPolkadot') {
    const ASSETS_PALLET_ID = 50

    const hasRequiredJunctions =
      asset.location &&
      hasJunction(asset.location, 'PalletInstance', ASSETS_PALLET_ID) &&
      hasJunction(asset.location, 'GeneralIndex')

    if (!asset.location || hasRequiredJunctions) {
      return api.getBalanceAssetsPallet(address, Number(asset.assetId))
    }

    return api.getBalanceForeignAssetsPallet(address, asset.location)
  }

  return api.getBalanceForeignPolkadotXcm(address, asset.assetId)
}
