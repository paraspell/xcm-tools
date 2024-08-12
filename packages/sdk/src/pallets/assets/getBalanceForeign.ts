/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ApiPromise } from '@polkadot/api'
import { TMultiLocation, TNodePolkadotKusama } from '../../types'
import { getDefaultPallet } from '../pallets'
import { createApiInstanceForNode } from '../../utils'
import { type StorageKey, u32 } from '@polkadot/types'
import { type AnyTuple, type Codec } from '@polkadot/types/types'
import { getAssetBySymbolOrId } from './assetsUtils'
import { getOtherAssets } from './assets'

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
      _value1
    ]) => {
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

const getAssetHubMultiLocation = (symbol?: string): TMultiLocation | null => {
  if (symbol === 'MYTH') {
    return {
      parents: 1,
      interior: {
        X1: {
          Parachain: '3369'
        }
      }
    }
  } else if (symbol === 'KSM') {
    return {
      parents: 2,
      interior: {
        X1: {
          GlobalConsensus: 'Kusama'
        }
      }
    }
  }
  const ethAssets = getOtherAssets('Ethereum')
  const ethAsset = ethAssets.find(asset => asset.symbol === symbol)
  if (ethAsset) {
    return {
      parents: 2,
      interior: {
        X2: [
          {
            GlobalConsensus: {
              Ethereum: {
                chainId: 1
              }
            }
          },
          {
            AccountKey20: {
              network: null,
              key: ethAsset.assetId
            }
          }
        ]
      }
    }
  }
  return null
}

const getBalanceForeignPolkadotXcm = async (
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
      apiWithFallback,
      node,
      asset?.symbol
    )
  }
  throw new Error('Unsupported pallet')
}
