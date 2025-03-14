/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { ApiPromise } from '@polkadot/api'
import type { TForeignAsset, TNativeAsset } from '../src'
import type { StorageKey } from '@polkadot/types'
import type { AnyTuple, Codec } from '@polkadot/types/types'

export const fetchBifrostNativeAssets = async (
  api: ApiPromise,
  query: string
): Promise<TNativeAsset[]> => {
  return fetchBifrostAssets(api, query).then(({ nativeAssets }) => nativeAssets)
}

export const fetchBifrostForeignAssets = async (
  api: ApiPromise,
  query: string
): Promise<TForeignAsset[]> => {
  return fetchBifrostAssets(api, query).then(({ otherAssets }) => otherAssets)
}

const fetchBifrostAssets = async (
  api: ApiPromise,
  query: string
): Promise<{
  nativeAssets: TNativeAsset[]
  otherAssets: TForeignAsset[]
}> => {
  const [module, section] = query.split('.')
  const res = await api.query[module][section].entries()

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

  const mapAssets = (assets: [StorageKey<AnyTuple>, Codec][], isNative: boolean) =>
    assets.map(([_key, value]) => {
      const val = value.toHuman() as any

      return isNative
        ? { symbol: val.symbol, decimals: +val.decimals, existentialDeposit: val.minimalBalance }
        : {
            assetId: Object.values(_key.args[0].toHuman() ?? {})[0],
            symbol: val.symbol,
            decimals: +val.decimals,
            existentialDeposit: val.minimalBalance
          }
    })

  const nativeAssets = mapAssets(
    filterAssets(['token', 'vtoken', 'native']),
    true
  ) as TNativeAsset[]

  const otherAssets = mapAssets(
    filterAssets(['token2', 'vtoken2', 'vstoken2']),
    false
  ) as TForeignAsset[]

  return {
    nativeAssets,
    otherAssets
  }
}
