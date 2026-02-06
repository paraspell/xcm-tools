import type { ApiPromise } from '@polkadot/api'
import { capitalizeLocation } from './utils'
import { TAssetInfoNoLoc } from './types'

export const fetchEnergyWebXAssets = async (
  api: ApiPromise,
  query: string
): Promise<TAssetInfoNoLoc[]> => {
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

        const locationJson = era.toJSON() as any

        const location = locationJson !== null ? capitalizeLocation(locationJson) : undefined

        return {
          symbol,
          decimals: +decimals,
          existentialDeposit: existentialDeposit,
          location
        }
      }
    )
  )

  return assets.filter(item => item !== null)
}
