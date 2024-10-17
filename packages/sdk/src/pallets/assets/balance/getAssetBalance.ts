import type { TCurrencyCore, TNodeDotKsmWithRelayChains, TNodePolkadotKusama } from '../../../types'
import { getNativeAssetSymbol } from '../assets'
import { getBalanceNative } from './getBalanceNative'
import { getBalanceForeign } from './getBalanceForeign'
import type { IPolkadotApi } from '../../../api/IPolkadotApi'

export const getAssetBalance = async <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  address: string,
  node: TNodeDotKsmWithRelayChains,
  currency: TCurrencyCore
): Promise<bigint> => {
  await api.init(node)
  const isNativeSymbol = 'symbol' in currency && getNativeAssetSymbol(node) === currency.symbol
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
