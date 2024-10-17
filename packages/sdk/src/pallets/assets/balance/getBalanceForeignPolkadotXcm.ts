import type { TNodePolkadotKusama } from '../../../types'
import { getAssetHubMultiLocation } from './getAssetHubMultiLocation'
import type { IPolkadotApi } from '../../../api/IPolkadotApi'

export const getBalanceForeignPolkadotXcm = async <TApi, TRes>(
  address: string,
  id: string | undefined,
  api: IPolkadotApi<TApi, TRes>,
  node?: TNodePolkadotKusama,
  symbol?: string
): Promise<bigint | null> => {
  try {
    if (node === 'Mythos') {
      return await api.getMythosForeignBalance(address)
    }

    if (node === 'AssetHubPolkadot') {
      const multiLocation = getAssetHubMultiLocation(symbol ?? id)
      if (multiLocation) {
        return api.getAssetHubForeignBalance(address, multiLocation)
      }
    }

    return api.getBalanceForeign(address, id)
  } catch (error) {
    console.log('Error while fetching balance', error)
    return null
  }
}
