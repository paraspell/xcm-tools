import type { TAsset, TMultiLocation, TNodePolkadotKusama } from '../../../types'
import type { IPolkadotApi } from '../../../api/IPolkadotApi'
import { InvalidCurrencyError } from '../../../errors'
import { isForeignAsset } from '../../../utils/assets'

export const getBalanceForeignPolkadotXcm = async <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  node: TNodePolkadotKusama,
  address: string,
  asset: TAsset
): Promise<bigint> => {
  if (node === 'Mythos') {
    return await api.getMythosForeignBalance(address)
  }

  if (!isForeignAsset(asset)) {
    throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} is not a foreign asset`)
  }

  if (node === 'Polimec') {
    if (asset.assetId === undefined) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no assetId`)
    }

    return api.getForeignAssetsByIdBalance(address, asset.assetId)
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
