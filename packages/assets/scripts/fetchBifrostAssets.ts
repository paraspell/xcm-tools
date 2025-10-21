/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { ApiPromise } from '@polkadot/api'
import type { StorageKey } from '@polkadot/types'
import type { AnyTuple, Codec } from '@polkadot/types/types'
import { capitalizeLocation } from './utils'
import { TForeignAssetInfo, TNativeAssetInfo } from '../src'

export const fetchBifrostNativeAssets = async (
  api: ApiPromise,
  query: string
): Promise<TNativeAssetInfo[]> => {
  return fetchBifrostAssets(api, query).then(({ nativeAssets }) => nativeAssets)
}

export const fetchBifrostForeignAssets = async (
  api: ApiPromise,
  query: string
): Promise<TForeignAssetInfo[]> => {
  return fetchBifrostAssets(api, query).then(({ otherAssets }) => otherAssets)
}

const fetchBifrostAssets = async (
  api: ApiPromise,
  query: string
): Promise<{
  nativeAssets: TNativeAssetInfo[]
  otherAssets: TForeignAssetInfo[]
}> => {
  const [module, method] = query.split('.')
  const res = await api.query[module][method].entries()

  const filterAssets = (tokenTypes: string[]) =>
    res.filter(
      ([
        {
          args: [era]
        }
      ]) => {
        const tokenType = Object.keys(era.toHuman() ?? {})[0].toLowerCase()
        return tokenTypes.includes(tokenType)
      }
    )

  const mapAssets = async (assets: [StorageKey<AnyTuple>, Codec][], isNative: boolean) => {
    const mapped = await Promise.all(
      assets.map(async ([_key, value]) => {
        const val = value.toHuman() as any

        const assetIdKey = _key.args[0].toHuman()

        const location = await api.query[module].currencyIdToLocations(assetIdKey)

        const assetId = Object.values(assetIdKey ?? {})[0]

        const isIntegerString = (val: string) => /^-?\d+$/.test(val)

        return {
          ...(isIntegerString(assetId) ? { assetId } : {}),
          symbol: val.symbol,
          decimals: +val.decimals,
          existentialDeposit: val.minimalBalance,
          location: location.toJSON() !== null ? capitalizeLocation(location.toJSON()) : undefined,
          ...(isNative ? { isNative: true } : {})
        }
      })
    )

    return mapped
  }

  const nativeAssets = (await mapAssets(filterAssets(['native']), true)) as TNativeAssetInfo[]

  const otherAssets = (await mapAssets(
    filterAssets(['token', 'token2', 'vtoken2', 'vtoken', 'vstoken2']),
    false
  )) as TForeignAssetInfo[]

  return {
    nativeAssets,
    otherAssets
  }
}
