import type { ApiPromise } from '@polkadot/api'
import type { TForeignAsset } from '../src'
import { capitalizeMultiLocation } from './utils'

export const fetchPendulumForeignAssets = async (
  api: ApiPromise,
  query: string
): Promise<TForeignAsset[]> => {
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

        const multiLocationJson = value.toJSON() as any

        const multiLocation =
          multiLocationJson.location !== null
            ? capitalizeMultiLocation(multiLocationJson.location.v3)
            : undefined

        return {
          assetId: Object.values(era.toHuman() ?? {})[0],
          symbol,
          decimals: +decimals,
          multiLocation,
          existentialDeposit: existentialDeposit
        }
      }
    )
}
