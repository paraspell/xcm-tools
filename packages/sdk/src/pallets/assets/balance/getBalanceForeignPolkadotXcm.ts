import { ApiPromise } from '@polkadot/api'
import { TNodePolkadotKusama } from '../../../types'
import { Codec } from '@polkadot/types/types'
import { getAssetHubMultiLocation } from './getAssetHubMultiLocation'
import { u32 } from '@polkadot/types'
import { TBalanceResponse } from '../../../types/TBalance'

export const getBalanceForeignPolkadotXcm = async (
  address: string,
  id: string | undefined,
  api: ApiPromise,
  node?: TNodePolkadotKusama,
  symbol?: string
): Promise<bigint | null> => {
  try {
    if (node === 'Mythos') {
      const response: Codec = await api.query.balances.account(address)
      const obj = response.toJSON() as TBalanceResponse
      return obj.free ? BigInt(obj.free) : null
    }

    if (node === 'AssetHubPolkadot') {
      const multiLocation = getAssetHubMultiLocation(symbol ?? id)
      if (multiLocation) {
        const response: Codec = await api.query.foreignAssets.account(multiLocation, address)
        const obj = response.toJSON() as TBalanceResponse
        return BigInt(obj === null || !obj.balance ? 0 : obj.balance)
      }
    }

    const parsedId = new u32(api.registry, id)
    const response: Codec = await api.query.assets.account(parsedId, address)
    const obj = response.toJSON() as TBalanceResponse

    return obj.balance ? BigInt(obj.balance) : null
  } catch (error) {
    console.log('Error while fetching balance', error)

    return null
  }
}
