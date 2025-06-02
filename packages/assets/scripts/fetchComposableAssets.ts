/* eslint-disable @typescript-eslint/no-explicit-any */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { ApiPromise } from '@polkadot/api'
import type { TForeignAsset } from '../src'

export const fetchComposableAssets = async (
  api: ApiPromise,
  query: string
): Promise<TForeignAsset[]> => {
  const [module, method] = query.split('.')
  const symbolsResponse = await api.query[module][method].entries()

  const assets = await Promise.all(
    symbolsResponse.map(
      async ([
        {
          args: [era]
        },
        value
      ]) => {
        const { inner: symbol } = value.toHuman() as any
        const assetId = era.toHuman() as string
        const numberAssetId = assetId.replace(/[,]/g, '')

        const decimals = await api.query[module].assetDecimals(era)
        const existentialDeposit = await api.query[module].existentialDeposit(era)

        return {
          assetId: numberAssetId,
          symbol,
          decimals: +decimals,
          existentialDeposit: existentialDeposit.toHuman() as string
        }
      }
    )
  )

  return assets
}
