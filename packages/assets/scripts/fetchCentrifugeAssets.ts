/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import type { ApiPromise } from '@polkadot/api'
import { capitalizeLocation } from './utils'
import { TAssetInfo } from '../src'
import { TLocation } from '@paraspell/sdk-common'

const locationOverrides: Record<string, TLocation> = {
  USD: {
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
          GeneralIndex: 1984
        }
      ]
    }
  }
}

const fetchCentrifugeAssetsBase = async (
  api: ApiPromise,
  query: string,
  filterFn: (era: any) => boolean,
  transformFn?: (asset: TAssetInfo) => TAssetInfo
): Promise<TAssetInfo[]> => {
  const [module, method] = query.split('.')
  const res = await api.query[module][method].entries()

  return res
    .filter(
      ([
        {
          args: [era]
        }
      ]) => filterFn(era)
    )
    .map(
      ([
        {
          args: [era]
        },
        value
      ]) => {
        const eraHuman = era.toHuman()
        const { symbol, decimals, existentialDeposit } = value.toHuman() as any
        const eraObj = era as any
        const locationJson = value.toJSON() as any

        const location =
          locationJson.location !== null
            ? capitalizeLocation(locationJson.location.v3 ?? locationJson.location.v4)
            : undefined

        const asset: TAssetInfo = {
          assetId:
            eraObj.type === 'Tranche'
              ? Object.values(eraHuman ?? {})[0][0].replaceAll(',', '')
              : Object.values(eraHuman ?? {})[0].replaceAll(',', ''),
          symbol,
          decimals: +decimals,
          location: location ?? locationOverrides[symbol],
          existentialDeposit
        }

        return transformFn ? transformFn(asset) : asset
      }
    )
}

export const fetchCentrifugeAssets = (api: ApiPromise, query: string) =>
  fetchCentrifugeAssetsBase(api, query, era => era.toHuman() !== 'Native')

export const fetchCentrifugeNativeAssets = (api: ApiPromise, query: string) =>
  fetchCentrifugeAssetsBase(
    api,
    query,
    era => era.toHuman() === 'Native',
    asset => {
      const { assetId, ...rest } = asset
      return {
        ...rest,
        isNative: true
      }
    }
  )
