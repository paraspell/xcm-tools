import type { TAsset, TNodePolkadotKusama } from '../../../types'
import { getAssetHubMultiLocation } from './getAssetHubMultiLocation'
import type { IPolkadotApi } from '../../../api/IPolkadotApi'
import { InvalidCurrencyError } from '../../../errors'

export const getBalanceForeignPolkadotXcm = async <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  node: TNodePolkadotKusama,
  address: string,
  asset: TAsset
): Promise<bigint> => {
  if (node === 'Mythos') {
    return await api.getMythosForeignBalance(address)
  }

  if (node === 'AssetHubPolkadot') {
    const multiLocation = getAssetHubMultiLocation(asset.symbol)
    if (multiLocation) {
      return api.getAssetHubForeignBalance(address, multiLocation)
    } else {
      if (asset.assetId === undefined) {
        throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no assetId`)
      }
      return api.getBalanceForeignAssetsAccount(address, Number(asset.assetId))
    }
  }

  return api.getBalanceForeignPolkadotXcm(address, asset.assetId)
}
