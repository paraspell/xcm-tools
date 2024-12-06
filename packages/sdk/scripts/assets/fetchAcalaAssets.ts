/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { ApiPromise } from '@polkadot/api'
import type { TForeignAsset, TNativeAsset } from '../../src/types'

const fetchAssets = async (
  api: ApiPromise,
  query: string,
  isNative: boolean
): Promise<TForeignAsset[]> => {
  const [module, section] = query.split('.')
  const res = await api.query[module][section].entries()

  return res
    .filter(
      ([
        {
          args: [era]
        }
      ]) => {
        const hasNativeAssetId = Object.prototype.hasOwnProperty.call(
          era.toHuman(),
          'NativeAssetId'
        )
        return isNative ? hasNativeAssetId : !hasNativeAssetId
      }
    )
    .map(
      ([
        {
          args: [era]
        },
        value
      ]) => {
        const { symbol, decimals, existentialDeposit, minimalBalance } = value.toHuman() as any
        return {
          assetId: Object.values(era.toHuman() ?? {})[0],
          symbol,
          decimals: +decimals,
          existentialDeposit: minimalBalance ?? existentialDeposit
        }
      }
    )
}

export const fetchAcalaNativeAssets = async (
  api: ApiPromise,
  query: string
): Promise<TNativeAsset[]> => {
  return (await fetchAssets(api, query, true)).map(asset => ({
    symbol: asset.symbol,
    decimals: asset.decimals,
    existentialDeposit: asset.existentialDeposit
  }))
}

export const fetchAcalaForeignAssets = async (
  api: ApiPromise,
  query: string
): Promise<TForeignAsset[]> => {
  return fetchAssets(api, query, false)
}
