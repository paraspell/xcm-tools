import type { ApiPromise } from '@polkadot/api'
import type { TForeignAsset } from '../src'
import { capitalizeLocation } from './utils'

export const fetchHydrationAssets = async (
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

        const location = await api.query.assetRegistry.assetLocations(era)

        return {
          assetId: numberAssetId,
          symbol: symbol ?? '',
          decimals: +decimals,
          existentialDeposit,
          location: location.toJSON() !== null ? capitalizeLocation(location.toJSON()) : undefined
        }
      }
    )
  )

  return assets.filter(asset => asset.decimals && asset.decimals > 0)
}
