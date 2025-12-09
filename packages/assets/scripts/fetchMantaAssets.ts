/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import type { ApiPromise } from '@polkadot/api'
import type { TAssetInfo } from '../src'
import { capitalizeLocation } from './utils'

export const fetchMantaOtherAssets = async (
  api: ApiPromise,
  query: string
): Promise<TAssetInfo[]> => {
  const [module, method] = query.split('.')
  const response = await api.query[module][method].entries()

  const assets = await Promise.all(
    response.map(
      async ([
        {
          args: [era]
        },
        value
      ]) => {
        const { symbol, decimals } = value.toHuman() as any
        const assetId = era.toHuman() as string
        const numberAssetId = assetId.replace(/[,]/g, '')

        const details = await api.query[module].asset(era)
        const detailsHuman = details.toHuman() as any

        if (detailsHuman.status !== 'Live') return null

        const existentialDeposit = detailsHuman.minBalance

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

  return assets.filter(item => item !== null)
}
