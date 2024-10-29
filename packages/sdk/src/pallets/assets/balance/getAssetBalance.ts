import type { TNodePolkadotKusama } from '../../../types'
import { getNativeAssetSymbol } from '../assets'
import { getBalanceNative } from './getBalanceNative'
import { getBalanceForeign } from './getBalanceForeign'
import type { TGetAssetBalanceOptions } from '../../../types/TBalance'

export const getAssetBalance = async <TApi, TRes>({
  address,
  node,
  currency,
  api
}: TGetAssetBalanceOptions<TApi, TRes>): Promise<bigint> => {
  await api.init(node)

  const isNativeSymbol =
    'symbol' in currency ? getNativeAssetSymbol(node) === currency.symbol : false
  return isNativeSymbol
    ? await getBalanceNative({
        address,
        node,
        api
      })
    : ((await getBalanceForeign({
        address,
        node: node as TNodePolkadotKusama,
        api,
        currency
      })) ?? BigInt(0))
}
