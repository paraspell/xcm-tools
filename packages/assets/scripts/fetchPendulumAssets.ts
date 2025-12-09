import type { ApiPromise } from '@polkadot/api'
import type { TAssetInfo } from '../src'
import { capitalizeLocation } from './utils'

export const fetchPendulumForeignAssets = async (
  api: ApiPromise,
  query: string
): Promise<TAssetInfo[]> => {
  const [module, method] = query.split('.')
  const res = await api.query[module][method].entries()

  return res
    .filter(
      ([
        {
          args: [era]
        }
      ]) => {
        return Object.prototype.hasOwnProperty.call(era.toHuman(), 'XCM')
      }
    )
    .map(
      ([
        {
          args: [era]
        },
        value
      ]) => {
        const { symbol, decimals, existentialDeposit } = value.toHuman() as any

        const locationJson = value.toJSON() as any

        const location =
          locationJson.location !== null ? capitalizeLocation(locationJson.location.v3) : undefined

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
