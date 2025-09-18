import { ApiPromise } from '@polkadot/api'
import { capitalizeLocation } from './utils'

export const fetchOtherAssetsAmplitude = async (api: ApiPromise, query: string) => {
  const [module, method] = query.split('.')
  const res = await api.query[module][method].entries()

  return res
    .filter(
      ([
        {
          args: [era]
        }
      ]) => Object.prototype.hasOwnProperty.call(era.toHuman(), 'XCM')
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
          locationJson.location !== null
            ? capitalizeLocation(locationJson.location.v3 ?? locationJson.location.v4)
            : undefined

        return {
          assetId: Object.values(era.toHuman() ?? {})[0].replaceAll(',', ''),
          symbol,
          decimals: +decimals,
          location,
          existentialDeposit
        }
      }
    )
}
