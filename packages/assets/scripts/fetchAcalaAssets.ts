import type { ApiPromise } from '@polkadot/api'
import type { TAssetInfo, TForeignAssetInfo, TNativeAssetInfo } from '../src'
import { capitalizeLocation } from './utils'
import { getParaId } from '../../sdk-core/src'

const ACALA_ASSET_GENERAL_KEYS = new Map<string, { length: number; data: string; paraId?: number }>(
  [
    [
      'ACA',
      { length: 2, data: '0x0000000000000000000000000000000000000000000000000000000000000000' }
    ],
    [
      'aSEED',
      { length: 2, data: '0x0001000000000000000000000000000000000000000000000000000000000000' }
    ],
    [
      'LcDOT',
      { length: 5, data: '0x040d000000000000000000000000000000000000000000000000000000000000' }
    ],
    [
      'LDOT',
      { length: 2, data: '0x0003000000000000000000000000000000000000000000000000000000000000' }
    ]
  ]
)

const KARURA_ASSET_GENERAL_KEYS = new Map<
  string,
  { length: number; data: string; paraId?: number }
>([
  [
    'KAR',
    {
      length: 2,
      data: '0x0080000000000000000000000000000000000000000000000000000000000000',
      paraId: 2000
    }
  ],
  [
    'LKSM',
    {
      length: 2,
      data: '0x0083000000000000000000000000000000000000000000000000000000000000',
      paraId: 2000
    }
  ],
  [
    'aSEED',
    {
      length: 2,
      data: '0x0081000000000000000000000000000000000000000000000000000000000000',
      paraId: 2000
    }
  ],
  [
    'KINT',
    {
      length: 2,
      data: '0x000c000000000000000000000000000000000000000000000000000000000000',
      paraId: 2092
    }
  ],
  [
    'KBTC',
    {
      length: 2,
      data: '0x000b000000000000000000000000000000000000000000000000000000000000',
      paraId: 2092
    }
  ]
])

const constructNativeLocation = (chain: 'Acala' | 'Karura', symbol: string): any | undefined => {
  const assetMap = chain === 'Acala' ? ACALA_ASSET_GENERAL_KEYS : KARURA_ASSET_GENERAL_KEYS
  const assetInfo = assetMap.get(symbol)

  if (!assetInfo) {
    return undefined
  }

  return {
    parents: 1,
    interior: {
      X2: [
        { Parachain: assetInfo?.paraId ?? getParaId(chain) },
        {
          GeneralKey: {
            length: assetInfo.length,
            data: assetInfo.data
          }
        }
      ]
    }
  }
}

const fetchAssets = async (
  chain: 'Acala' | 'Karura',
  api: ApiPromise,
  query: string,
  isNative: boolean,
  key: string
): Promise<TAssetInfo[]> => {
  const [module, method] = query.split('.')
  const res = await api.query[module][method].entries()

  return await Promise.all(
    res
      .filter(
        ([
          {
            args: [era]
          }
        ]) => {
          return Object.prototype.hasOwnProperty.call(era.toHuman(), key)
        }
      )
      .map(
        async ([
          {
            args: [era]
          },
          value
        ]) => {
          const { symbol, decimals, existentialDeposit, minimalBalance } = value.toHuman() as any

          const baseAsset = {
            symbol,
            decimals: +decimals,
            existentialDeposit: minimalBalance ?? existentialDeposit
          } as TNativeAssetInfo

          if (isNative) {
            return {
              ...baseAsset,
              location: constructNativeLocation(chain, symbol)
            }
          }

          const assetId = Object.values(era.toHuman() ?? {})[0].replaceAll(',', '')

          const locationRes = await api.query[module].foreignAssetLocations(Number(assetId))

          const location =
            locationRes.toJSON() !== null ? capitalizeLocation(locationRes.toJSON()) : undefined

          return {
            ...baseAsset,
            assetId,
            location
          }
        }
      )
  )
}

export const fetchAcalaNativeAssets = async (
  chain: 'Acala' | 'Karura',
  api: ApiPromise,
  query: string
): Promise<TNativeAssetInfo[]> => {
  return (await fetchAssets(chain, api, query, true, 'NativeAssetId')).map(asset => ({
    ...asset,
    isNative: true
  }))
}

export const fetchAcalaForeignAssets = async (
  api: ApiPromise,
  query: string
): Promise<TForeignAssetInfo[]> => {
  return fetchAssets('Acala', api, query, false, 'ForeignAssetId') as Promise<TForeignAssetInfo[]>
}
