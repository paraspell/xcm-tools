/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import type { ApiPromise } from '@polkadot/api'
import type { TForeignAsset } from '../src'
import { capitalizeMultiLocation } from './fetchOtherAssetsRegistry'

export const fetchMantaOtherAssets = async (
  api: ApiPromise,
  query: string
): Promise<TForeignAsset[]> => {
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

        const assetDetails = await api.query[module].asset(era)
        const existentialDeposit = (assetDetails.toHuman() as any).minBalance

        const multiLocationVersioned = await api.query.assetManager.assetIdLocation(era)

        const multiLocationJson = multiLocationVersioned.toJSON() as any

        const multiLocation =
          multiLocationJson !== null ? capitalizeMultiLocation(multiLocationJson.v3) : undefined

        return {
          assetId: numberAssetId,
          symbol,
          decimals: +decimals,
          existentialDeposit,
          multiLocation
        }
      }
    )
  )

  return assets
}
