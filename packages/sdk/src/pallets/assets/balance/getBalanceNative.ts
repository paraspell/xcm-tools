import type { TGetBalanceNativeOptions } from '../../../types/TBalance'
import { getAssetsObject } from '../assets'
import { getBalanceForeignInternal } from './getBalanceForeign'

export const getBalanceNativeInternal = async <TApi, TRes>({
  address,
  node,
  api
}: TGetBalanceNativeOptions<TApi, TRes>): Promise<bigint> => {
  await api.init(node)

  if (node === 'Interlay') {
    return getBalanceForeignInternal({
      address,
      node,
      api,
      currency: { symbol: getAssetsObject(node).nativeAssetSymbol }
    })
  }

  return api.getBalanceNative(address)
}

export const getBalanceNative = async <TApi, TRes>(
  options: TGetBalanceNativeOptions<TApi, TRes>
): Promise<bigint> => {
  const { api } = options
  try {
    return await getBalanceNativeInternal(options)
  } finally {
    await api.disconnect()
  }
}
