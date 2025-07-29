import type { ApiPromise } from '@polkadot/api'
import type { TForeignAsset, TNativeAsset } from '../src'
import { capitalizeMultiLocation } from './utils'

const fetchAssets = async (
  api: ApiPromise,
  query: string,
  isNative: boolean,
  nativeKey = 'NativeAssetId'
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

        const multiLocationJson = value.toJSON() as any

        const multiLocation =
          multiLocationJson.location !== null && multiLocationJson.location !== undefined
            ? capitalizeMultiLocation(
                multiLocationJson.location.v4 ??
                  multiLocationJson.location.v3 ??
                  multiLocationJson.location.v2
              )
            : undefined

        return {
          assetId: Object.values(era.toHuman() ?? {})[0].replaceAll(',', ''),
          symbol,
          decimals: +decimals,
          existentialDeposit: minimalBalance ?? existentialDeposit,
          multiLocation
        }
      }
    )
}

export const fetchZeitgeistNativeAssets = async (
  api: ApiPromise,
  query: string,
  nativeKey?: string
): Promise<TNativeAsset[]> => {
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
): Promise<TForeignAsset[]> => {
  return fetchAssets(api, query, false, nativeKey)
}
