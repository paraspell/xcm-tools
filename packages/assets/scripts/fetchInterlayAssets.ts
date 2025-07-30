import type { ApiPromise } from '@polkadot/api'
import type { TForeignAssetInfo } from '../src'
import { capitalizeLocation } from './utils'

export const fetchInterlayAssets = async (
  api: ApiPromise,
  query: string
): Promise<TForeignAssetInfo[]> => {
  const [module, method] = query.split('.')
  const assets = await api.query[module][method].entries()

  return assets.map(
    ([
      {
        args: [era]
      },
      value
    ]) => {
      const { symbol, decimals, existentialDeposit } = value.toHuman() as any

      const locationJson = value.toJSON() as any

      const location =
        locationJson.location !== null
          ? capitalizeLocation(locationJson.location.v3 ?? locationJson.location.v2)
          : undefined

      return {
        assetId: Object.values(era.toHuman() ?? {})[0],
        symbol,
        decimals: +decimals,
        location,
        existentialDeposit: existentialDeposit
      }
    }
  )
}
