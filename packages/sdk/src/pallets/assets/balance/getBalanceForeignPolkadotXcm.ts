/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiPromise } from '@polkadot/api'
import { TNodePolkadotKusama } from '../../../types'
import { Codec } from '@polkadot/types/types'
import { getAssetHubMultiLocation } from './getAssetHubMultiLocation'
import { u32 } from '@polkadot/types'

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
      const obj: any = response.toJSON()
      return BigInt(obj.free)
    }

    if (node === 'AssetHubPolkadot') {
      const multiLocation = getAssetHubMultiLocation(symbol ?? id)
      if (multiLocation) {
        const response: Codec = await api.query.foreignAssets.account(multiLocation, address)
        const obj: any = response.toJSON()
        return BigInt(obj === null ? 0 : obj.balance)
      }
    }

    const parsedId = new u32(api.registry, id)
    const response: Codec = await api.query.assets.account(parsedId, address)
    const obj: any = response.toJSON()

    return BigInt(obj.balance)
  } catch (error) {
    console.log('Error while fetching balance', error)

    return null
  }
}
