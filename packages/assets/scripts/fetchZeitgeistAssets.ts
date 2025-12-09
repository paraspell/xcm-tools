import type { ApiPromise } from '@polkadot/api'
import type { TAssetInfo } from '../src'
import { capitalizeLocation } from './utils'

const fetchAssets = async (
  api: ApiPromise,
  query: string,
  isNative: boolean,
  nativeKey = 'NativeAssetId'
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
        const hasNativeAssetId = Object.prototype.hasOwnProperty.call(era.toHuman(), nativeKey)
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

        const locationJson = value.toJSON() as any

        const location =
          locationJson.location !== null && locationJson.location !== undefined
            ? capitalizeLocation(
                locationJson.location.v4 ?? locationJson.location.v3 ?? locationJson.location.v2
              )
            : undefined

        return {
          assetId: Object.values(era.toHuman() ?? {})[0].replaceAll(',', ''),
          symbol,
          decimals: +decimals,
          existentialDeposit: minimalBalance ?? existentialDeposit,
          location
        }
      }
    )
}

export const fetchZeitgeistNativeAssets = async (
  api: ApiPromise,
  query: string,
  nativeKey?: string
): Promise<TAssetInfo[]> => {
  return (await fetchAssets(api, query, true, nativeKey)).map(asset => ({
    isNative: true,
    symbol: asset.symbol,
    decimals: asset.decimals,
    existentialDeposit: asset.existentialDeposit
  }))
}

export const fetchZeitgeistForeignAssets = async (
  api: ApiPromise,
  query: string,
  nativeKey?: string
): Promise<TAssetInfo[]> => {
  return fetchAssets(api, query, false, nativeKey)
}
