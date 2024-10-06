import type { TCurrencyCore, TNodeDotKsmWithRelayChains, TNodePolkadotKusama } from '../../../types'
import { createApiInstanceForNode } from '../../../utils'
import { getNativeAssetSymbol } from '../assets'
import { getBalanceNative } from './getBalanceNative'
import { getBalanceForeign } from './getBalanceForeign'

export const getAssetBalance = async (
  account: string,
  node: TNodeDotKsmWithRelayChains,
  currency: TCurrencyCore
): Promise<bigint> => {
  const api = await createApiInstanceForNode(node)
  const isNativeSymbol = 'symbol' in currency && getNativeAssetSymbol(node) === currency.symbol
  return isNativeSymbol
    ? await getBalanceNative(account, node, api)
    : ((await getBalanceForeign(account, node as TNodePolkadotKusama, currency, api)) ?? BigInt(0))
}
