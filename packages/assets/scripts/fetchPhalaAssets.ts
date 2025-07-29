import type { ApiPromise } from '@polkadot/api'
import type { TForeignAsset } from '../src'
import { capitalizeMultiLocation } from './utils'

export const fetchPhalaAssets = async (
  api: ApiPromise,
  query: string
): Promise<TForeignAsset[]> => {
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

        const multiLocationRes = await api.query.assetsRegistry.registryInfoByIds(era)

        const multiLocationJson = multiLocationRes.toJSON() as any

        const multiLocation =
          multiLocationJson !== null
            ? capitalizeMultiLocation(multiLocationJson.location)
            : undefined

        const assetId = era.toHuman() as string

        return {
          assetId: assetId.replace(/[,]/g, ''),
          symbol,
          decimals: +decimals,
          multiLocation,
          existentialDeposit: existentialDeposit
        }
      }
    )
  )
}
