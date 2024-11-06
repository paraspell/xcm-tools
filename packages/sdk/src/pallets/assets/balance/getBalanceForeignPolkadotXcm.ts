import type { TAsset, TNodePolkadotKusama } from '../../../types'
import { getAssetHubMultiLocation } from './getAssetHubMultiLocation'
import type { IPolkadotApi } from '../../../api/IPolkadotApi'
import { InvalidCurrencyError } from '../../../errors'
import { ethers } from 'ethers'
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
    throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no assetId`)
  }

  if (node === 'AssetHubPolkadot') {
    const multiLocation = getAssetHubMultiLocation(asset.symbol)
    // Ethereum address ID indicates that it is an Ethereum asset
    if (multiLocation && isForeignAsset(asset) && ethers.isAddress(asset.assetId)) {
      return api.getAssetHubForeignBalance(address, multiLocation)
    } else {
      return api.getBalanceForeignAssetsAccount(address, Number(asset.assetId))
    }
  }

  return api.getBalanceForeignPolkadotXcm(address, asset.assetId)
}
