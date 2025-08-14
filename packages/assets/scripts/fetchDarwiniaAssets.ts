import type { ApiPromise } from '@polkadot/api'
import type { TForeignAssetInfo } from '../src'
import { capitalizeLocation } from './utils'

export const fetchDarwiniaAssets = async (
  api: ApiPromise,
  query: string
): Promise<TForeignAssetInfo[]> => {
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

        const assetDetails = await api.query[module].asset(era)
        const existentialDeposit = (assetDetails.toHuman() as any).minBalance

        const locationRes = await api.query.assetManager.assetIdType(era)

        const locationJson = locationRes.toJSON() as any

        const location = locationJson !== null ? capitalizeLocation(locationJson.xcm) : undefined

        const assetId = era.toHuman() as string

        return {
          assetId: assetId.replace(/[,]/g, ''),
          symbol,
          decimals: +decimals,
          location,
          existentialDeposit: existentialDeposit
        }
      }
    )
  )
}
