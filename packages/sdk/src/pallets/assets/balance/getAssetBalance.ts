import type { TNodePolkadotKusama } from '../../../types'
import { getNativeAssetSymbol } from '../assets'
import { getBalanceNativeInternal } from './getBalanceNative'
import { getBalanceForeignInternal } from './getBalanceForeign'
import type { TGetAssetBalanceOptions } from '../../../types/TBalance'

export const getAssetBalanceInternal = async <TApi, TRes>({
  address,
  node,
  currency,
  api
}: TGetAssetBalanceOptions<TApi, TRes>): Promise<bigint> => {
  await api.init(node)

  const isNativeSymbol =
    'symbol' in currency ? getNativeAssetSymbol(node) === currency.symbol : false

  return isNativeSymbol
    ? await getBalanceNativeInternal({
        address,
        node,
        api
      })
    : ((await getBalanceForeignInternal({
        address,
        node: node as TNodePolkadotKusama,
        api,
        currency
      })) ?? BigInt(0))
}

export const getAssetBalance = async <TApi, TRes>(
  options: TGetAssetBalanceOptions<TApi, TRes>
): Promise<bigint> => {
  const { api } = options
  try {
    return await getAssetBalanceInternal(options)
  } finally {
    await api.disconnect()
  }
}
