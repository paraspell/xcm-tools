import type { ApiPromise } from '@polkadot/api'
import type { TForeignAssetInfo } from '../src'
import { capitalizeLocation } from './utils'

export const fetchBasiliskAssets = async (
  api: ApiPromise,
  query: string
): Promise<TForeignAssetInfo[]> => {
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

        const location = await api.query.assetRegistry.assetLocations(era)

        const assetsRes = await api.query[module].assets(era)

        const { existentialDeposit } = assetsRes.toHuman() as any

        return {
          assetId: numberAssetId,
          symbol: symbol ?? '',
          decimals: +decimals,
          location: location.toJSON() !== null ? capitalizeLocation(location.toJSON()) : undefined,
          existentialDeposit: existentialDeposit
        }
      }
    )
  )

  return assets.filter(asset => asset.decimals && asset.decimals > 0)
}
