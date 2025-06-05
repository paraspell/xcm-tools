import { InvalidCurrencyError, isForeignAsset, type TAsset } from '@paraspell/assets'
import { hasJunction, type TNodePolkadotKusama } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../../../api/IPolkadotApi'
import { getMoonbeamErc20Balance } from './getMoonbeamErc20Balance'

export const getBalanceForeignPolkadotXcm = async <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  node: TNodePolkadotKusama,
  address: string,
  asset: TAsset
): Promise<bigint> => {
  if (node === 'Moonbeam' || node === 'Moonriver') {
    if (!isForeignAsset(asset) || !asset.assetId || !asset.multiLocation) {
      throw new InvalidCurrencyError(
        `Asset ${JSON.stringify(asset)} has no multi-location or assetId`
      )
    }

    return getMoonbeamErc20Balance(node, asset.assetId, address)
  }

  if (node === 'Mythos') {
    return api.getMythosForeignBalance(address)
  }

  if (!isForeignAsset(asset)) {
    throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} is not a foreign asset`)
  }

  if (node === 'Polimec') {
    if (asset.multiLocation === undefined) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no multi-location`)
    }

    return api.getBalanceForeignAssetsPallet(address, asset.multiLocation)
  }

  if (node === 'AssetHubPolkadot') {
    const ASSETS_PALLET_ID = 50

    const hasRequiredJunctions =
      asset.multiLocation &&
      hasJunction(asset.multiLocation, 'PalletInstance', ASSETS_PALLET_ID) &&
      hasJunction(asset.multiLocation, 'GeneralIndex')

    if (!asset.multiLocation || hasRequiredJunctions) {
      return api.getBalanceAssetsPallet(address, Number(asset.assetId))
    }

    return api.getBalanceForeignAssetsPallet(address, asset.multiLocation)
  }

  return api.getBalanceForeignPolkadotXcm(address, asset.assetId)
}
