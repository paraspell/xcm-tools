/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { ApiPromise } from '@polkadot/api'
import type { TForeignAsset } from '../../src/types'
import { capitalizeMultiLocation } from './fetchOtherAssetsRegistry'

export const fetchMoonbeamForeignAssets = async (
  api: ApiPromise,
  query: string
): Promise<TForeignAsset[]> => {
  const [module, section] = query.split('.')
  const symbolsResponse = await api.query[module][section].entries()

  return await Promise.all(
    symbolsResponse.map(
      async ([
        {
          args: [era]
        },
        value
      ]) => {
        const { xcm } = value.toJSON() as any
        const assetId = era.toHuman() as string
        const numberAssetId = assetId.replace(/[,]/g, '')

        const metadata = await api.query.assets.metadata(era)
        const { symbol, decimals } = metadata.toHuman() as any
        const details = await api.query.assets.asset(era)
        const { minBalance } = details.toHuman() as any

        return {
          assetId: numberAssetId,
          symbol,
          decimals: +decimals,
          multiLocation: capitalizeMultiLocation(xcm),
          existentialDeposit: minBalance
        }
      }
    )
  )
}
