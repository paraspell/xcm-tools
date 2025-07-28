/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import type { ApiPromise } from '@polkadot/api'
import type { TForeignAsset } from '../src'
import { capitalizeLocation } from './utils'

export const fetchMantaOtherAssets = async (
  api: ApiPromise,
  query: string
): Promise<TForeignAsset[]> => {
  const [module, method] = query.split('.')
  const assets = await api.query[module][method].entries()

  return Promise.all(
    assets.map(
      async ([
        {
          args: [era]
        },
        value
      ]) => {
        const { symbol, decimals } = value.toHuman() as any
        const assetId = era.toHuman() as string
        const numberAssetId = assetId.replace(/[,]/g, '')

        const assetDetails = await api.query[module].asset(era)
        const existentialDeposit = (assetDetails.toHuman() as any).minBalance

        const locationVersioned = await api.query.assetManager.assetIdLocation(era)

        const locationJson = locationVersioned.toJSON() as any

        const location = locationJson !== null ? capitalizeLocation(locationJson.v3) : undefined

        return {
          assetId: numberAssetId,
          symbol,
          decimals: +decimals,
          existentialDeposit,
          location
        }
      }
    )
  )
}
