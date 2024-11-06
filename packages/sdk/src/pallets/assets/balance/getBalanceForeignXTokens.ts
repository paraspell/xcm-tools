import type { IPolkadotApi } from '../../../api'
import { InvalidCurrencyError } from '../../../errors'
import type { TAsset, TNodePolkadotKusama } from '../../../types'
import { isForeignAsset } from '../../../utils/assets'

export const getBalanceForeignXTokens = async <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  node: TNodePolkadotKusama,
  address: string,
  asset: TAsset
): Promise<bigint> => {
  if (node === 'Moonbeam' || node === 'Moonriver' || node === 'Astar' || node === 'Shiden') {
    if (!isForeignAsset(asset)) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no assetId`)
    }

    return api.getBalanceForeignAssetsAccount(address, BigInt(asset.assetId))
  }

  return api.getBalanceForeignXTokens(address, asset)
}
