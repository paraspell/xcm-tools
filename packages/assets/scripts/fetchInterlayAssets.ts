import type { ApiPromise } from '@polkadot/api'
import type { TForeignAsset } from '../src'
import { capitalizeMultiLocation } from './utils'

export const fetchInterlayAssets = async (
  api: ApiPromise,
  query: string
): Promise<TForeignAsset[]> => {
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

      const multiLocationJson = value.toJSON() as any

      const multiLocation =
        multiLocationJson.location !== null
          ? capitalizeMultiLocation(multiLocationJson.location.v3 ?? multiLocationJson.location.v2)
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
