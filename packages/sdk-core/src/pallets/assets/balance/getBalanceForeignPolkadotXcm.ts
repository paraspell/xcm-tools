import { InvalidCurrencyError, isForeignAsset, type TAsset } from '@paraspell/assets'
import type { TMultiLocation, TNodePolkadotKusama } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../../../api/IPolkadotApi'

export const getBalanceForeignPolkadotXcm = async <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  node: TNodePolkadotKusama,
  address: string,
  asset: TAsset
): Promise<bigint> => {
  if (node === 'Moonbeam' || node === 'Moonriver') {
    if (!isForeignAsset(asset) || !asset.assetId) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no assetId`)
    }

    return api.getBalanceForeignAssetsAccount(address, BigInt(asset.assetId))
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

    return api.getAssetHubForeignBalance(address, asset.multiLocation as TMultiLocation)
  }

  if (node === 'AssetHubPolkadot') {
    if (asset.multiLocation) {
      return api.getAssetHubForeignBalance(address, asset.multiLocation as TMultiLocation)
    } else {
      return api.getBalanceForeignAssetsAccount(address, Number(asset.assetId))
    }
  }

  return api.getBalanceForeignPolkadotXcm(address, asset.assetId)
}
