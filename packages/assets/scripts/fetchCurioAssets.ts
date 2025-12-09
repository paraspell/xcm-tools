import { ApiPromise } from '@polkadot/api'
import { capitalizeLocation } from './utils'
import { TAssetInfo } from '../src'

export const fetchNativeAssetsCurio = async (
  api: ApiPromise,
  query: string
): Promise<TAssetInfo[]> => {
  const [module, method] = query.split('.')
  const res = await api.query[module][method].entries()
  return res
    .map(
      ([
        {
          args: [era]
        },
        value
      ]) => {
        const { symbol, decimals, existentialDeposit } = value.toHuman() as any
        return {
          assetId: era.toHuman(),
          symbol,
          decimals: +decimals,
          existentialDeposit
        }
      }
    )
    .filter(asset => Object.keys(asset.assetId ?? {})[0] === 'Token')
    .map(asset => ({
      isNative: true,
      symbol: asset.symbol,
      decimals: asset.decimals,
      existentialDeposit: asset.existentialDeposit
    }))
}

export const fetchOtherAssetsCurio = async (api: ApiPromise, query: string) => {
  const [module, method] = query.split('.')
  const res = await api.query[module][method].entries()
  return res
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
          assetId: era.toHuman(),
          symbol,
          decimals: +decimals,
          location,
          existentialDeposit
        }
      }
    )
    .filter(asset => Object.keys(asset.assetId ?? {})[0] === 'ForeignAsset')
    .map(asset => ({
      assetId: Object.values(asset.assetId ?? {})[0],
      symbol: asset.symbol,
      decimals: asset.decimals,
      location: asset.location,
      existentialDeposit: asset.existentialDeposit
    }))
}
