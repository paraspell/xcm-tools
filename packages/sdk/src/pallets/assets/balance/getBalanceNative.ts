import type { TGetBalanceNativeOptions } from '../../../types/TBalance'

export const getBalanceNative = async <TApi, TRes>({
  address,
  node,
  api
}: TGetBalanceNativeOptions<TApi, TRes>): Promise<bigint> => {
  await api.init(node)
  return await api.getBalanceNative(address)
}
