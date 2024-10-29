import type { TAsset, TNodePolkadotKusama } from '../../../types'
import { getAssetHubMultiLocation } from './getAssetHubMultiLocation'
import type { IPolkadotApi } from '../../../api/IPolkadotApi'

export const getBalanceForeignPolkadotXcm = async <TApi, TRes>(
  address: string,
  asset: TAsset,
  api: IPolkadotApi<TApi, TRes>,
  node?: TNodePolkadotKusama
): Promise<bigint | null> => {
  try {
    if (node === 'Mythos') {
      return await api.getMythosForeignBalance(address)
    }

    if (node === 'AssetHubPolkadot') {
      const multiLocation = getAssetHubMultiLocation(asset.symbol)
      if (multiLocation) {
        return api.getAssetHubForeignBalance(address, multiLocation)
      }
    }

    return api.getBalanceForeign(address, asset.assetId)
  } catch (error) {
    console.log('Error while fetching balance', error)
    return null
  }
}
