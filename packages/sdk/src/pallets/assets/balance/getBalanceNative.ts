import type { TGetBalanceNativeOptions } from '../../../types/TBalance'

export const getBalanceNativeInternal = async <TApi, TRes>({
  address,
  node,
  api
}: TGetBalanceNativeOptions<TApi, TRes>): Promise<bigint> => {
  await api.init(node)
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
