/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ApiPromise } from '@polkadot/api'
import { TNodePolkadotKusama } from '../../types'
import { getDefaultPallet } from '../pallets'
import { createApiInstanceForNode } from '../../utils'
import { type StorageKey, u32 } from '@polkadot/types'
import { type AnyTuple, type Codec } from '@polkadot/types/types'
import { getAssetBySymbolOrId } from './assetsUtils'

const getBalanceForeignXTokens = async (
  address: string,
  symbolOrId: string,
  symbol: string | undefined,
  id: string | undefined,
  api: ApiPromise
): Promise<bigint | null> => {
  const response: Array<[StorageKey<AnyTuple>, Codec]> =
    await api.query.tokens.accounts.entries(address)

  const entry: any = response.find(
    ([
      {
        args: [_, asset]
      },
      value1
    ]) => {
      console.log(asset.toHuman(), value1.toHuman())
      return (
        asset.toString() === symbolOrId ||
        asset.toString() === id ||
        asset.toString() === symbol ||
        Object.values(asset.toHuman() ?? {}).toString() === symbolOrId ||
        Object.values(asset.toHuman() ?? {}).toString() === id ||
        Object.values(asset.toHuman() ?? {}).toString() === symbol
      )
    }
  )
  return entry ? BigInt(entry[1].free.toString()) : null
}

const getBalanceForeignPolkadotXcm = async (
  address: string,
  id: string | undefined,
  api: ApiPromise
): Promise<bigint | null> => {
  try {
    const parsedId = new u32(api.registry, id)
    const response: Codec = await api.query.assets.account(parsedId, address)
    const obj: any = response.toJSON()
    return BigInt(obj.balance)
  } catch (error) {
    console.log('Error while fetching balance', error)

    return null
  }
}

export const getBalanceForeign = async (
  address: string,
  node: TNodePolkadotKusama,
  symbolOrId: string,
  api?: ApiPromise
): Promise<bigint | null> => {
  const apiWithFallback = api ?? (await createApiInstanceForNode(node))
  const asset = getAssetBySymbolOrId(node, symbolOrId)
  if (getDefaultPallet(node) === 'XTokens') {
    return await getBalanceForeignXTokens(
      address,
      symbolOrId,
      asset?.symbol,
      asset?.assetId,
      apiWithFallback
    )
  } else if (getDefaultPallet(node) === 'PolkadotXcm') {
    return await getBalanceForeignPolkadotXcm(
      address,
      asset?.assetId ?? symbolOrId,
      apiWithFallback
    )
  }
  throw new Error('Unsupported pallet')
}
