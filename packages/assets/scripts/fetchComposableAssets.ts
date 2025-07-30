import type { ApiPromise } from '@polkadot/api'
import type { TForeignAssetInfo } from '../src'

export const fetchComposableAssets = async (
  api: ApiPromise,
  query: string
): Promise<TForeignAssetInfo[]> => {
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
}
