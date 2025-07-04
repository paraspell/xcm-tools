/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import type { ApiPromise } from '@polkadot/api'
import type { TForeignAsset } from '../src'
import { capitalizeMultiLocation } from './fetchOtherAssetsRegistry'

export const fetchHydrationOtherAssets = async (
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
        const { symbol, decimals, existentialDeposit } = value.toHuman() as any
        const assetId = era.toHuman() as string
        const numberAssetId = assetId.replace(/[,]/g, '')

        const multiLocation = await api.query.assetRegistry.assetLocations(era)

        return {
          assetId: numberAssetId,
          symbol: symbol ?? '',
          decimals: +decimals,
          existentialDeposit,
          multiLocation:
            multiLocation.toJSON() !== null
              ? capitalizeMultiLocation(multiLocation.toJSON())
              : undefined
        }
      }
    )
  )

  return assets.filter(asset => asset.decimals && asset.decimals > 0)
}
