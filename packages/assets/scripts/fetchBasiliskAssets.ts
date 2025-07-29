import type { ApiPromise } from '@polkadot/api'
import type { TForeignAsset } from '../src'
import { capitalizeMultiLocation } from './utils'

export const fetchBasiliskAssets = async (
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

        const multiLocation = await api.query.assetRegistry.assetLocations(era)

        const assetsRes = await api.query[module].assets(era)

        const { existentialDeposit } = assetsRes.toHuman() as any

        return {
          assetId: numberAssetId,
          symbol: symbol ?? '',
          decimals: +decimals,
          multiLocation:
            multiLocation.toJSON() !== null
              ? capitalizeMultiLocation(multiLocation.toJSON())
              : undefined,
          existentialDeposit: existentialDeposit
        }
      }
    )
  )

  return assets.filter(asset => asset.decimals && asset.decimals > 0)
}
