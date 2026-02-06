import type { ApiPromise } from '@polkadot/api'
import { type TAssetInfo } from '../src'
import { capitalizeLocation } from './utils'
import { TLocation, TSubstrateChain } from '@paraspell/sdk-common'
import { TAssetInfoNoLoc } from './types'

const getNativeKey = (chain: TSubstrateChain) => {
  if (chain === 'Jamton') return 'Native'
  return 'NativeAssetId'
}

const jamtonLocationOverrides: Record<string, TLocation> = {
  jamTON: {
    parents: 1,
    interior: {
      X3: [
        {
          Parachain: 1000
        },
        {
          PalletInstance: 50
        },
        {
          GeneralIndex: 22222078
        }
      ]
    }
  },
  stDOT: {
    parents: 1,
    interior: {
      X3: [
        {
          Parachain: 2004
        },
        {
          PalletInstance: 110
        },
        {
          AccountKey20: {
            network: null,
            key: '0xbc7e02c4178a7df7d3e564323a5c359dc96c4db4'
          }
        }
      ]
    }
  }
}

const fetchAssets = async (
  api: ApiPromise,
  chain: TSubstrateChain,
  query: string,
  isNative: boolean
): Promise<TAssetInfoNoLoc[]> => {
  const [module, method] = query.split('.')
  const res = await api.query[module][method].entries()

  return res
    .filter(
      ([
        {
          args: [era]
        }
      ]) => {
        const hasNativeAssetId = Object.prototype.hasOwnProperty.call(
          era.toHuman(),
          getNativeKey(chain)
        )
        return isNative ? hasNativeAssetId : !hasNativeAssetId
      }
    )
    .map(
      ([
        {
          args: [era]
        },
        value
      ]) => {
        const { symbol, decimals, existentialDeposit, minimalBalance } = value.toHuman() as any

        const locationJson = value.toJSON() as any

        const location =
          locationJson.location !== null && locationJson.location !== undefined
            ? capitalizeLocation(
                locationJson.location.v4 ?? locationJson.location.v3 ?? locationJson.location.v2
              )
            : undefined

        return {
          assetId: Object.values(era.toHuman() ?? {})[0].replaceAll(',', ''),
          symbol,
          decimals: +decimals,
          existentialDeposit: minimalBalance ?? existentialDeposit,
          location: chain === 'Jamton' && isNative ? jamtonLocationOverrides[symbol] : location
        }
      }
    )
}

export const fetchZeitgeistNativeAssets = async (
  api: ApiPromise,
  chain: TSubstrateChain,
  query: string
): Promise<TAssetInfoNoLoc[]> => {
  return (await fetchAssets(api, chain, query, true)).map(asset => ({
    ...asset,
    isNative: true
  }))
}

export const fetchZeitgeistForeignAssets = async (
  api: ApiPromise,
  chain: TSubstrateChain,
  query: string
): Promise<TAssetInfoNoLoc[]> => {
  return fetchAssets(api, chain, query, false)
}
