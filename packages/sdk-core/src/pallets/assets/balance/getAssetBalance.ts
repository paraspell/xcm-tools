import { getNativeAssetSymbol } from '@paraspell/assets'
import type { TNodePolkadotKusama } from '@paraspell/sdk-common'

import type { TGetAssetBalanceOptions } from '../../../types/TBalance'
import { getBalanceForeignInternal } from './getBalanceForeign'
import { getBalanceNativeInternal } from './getBalanceNative'

export const getAssetBalanceInternal = async <TApi, TRes>({
  address,
  node,
  currency,
  api
}: TGetAssetBalanceOptions<TApi, TRes>): Promise<bigint> => {
  await api.init(node)

  const isNativeSymbol =
    'symbol' in currency ? getNativeAssetSymbol(node) === currency.symbol : false

  return isNativeSymbol && node !== 'Interlay' && node !== 'Kintsugi'
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
      })) ?? 0n)
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
