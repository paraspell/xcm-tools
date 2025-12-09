import type { ApiPromise } from '@polkadot/api'
import type { TAssetInfo } from '../src'
import { capitalizeLocation } from './utils'

export const fetchDarwiniaAssets = async (
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

        const details = await api.query[module].asset(era)
        const detailsHuman = details.toHuman() as any

        if (detailsHuman.status !== 'Live') return null

        const existentialDeposit = detailsHuman.minBalance

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

  return assets.filter(item => item !== null)
}
