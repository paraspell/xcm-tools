import { getChainImpl } from '../chains/getChainInstance'
import type { TGetAssetBalanceOptions, TGetBalanceOptions } from '../types'
import { validateAddress } from '../utils'

export const getAssetBalanceInternal = async <
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
>({
  api,
  address,
  chain,
  asset
}: TGetAssetBalanceOptions<TApi, TRes, TSigner, TCustomChain>): Promise<bigint> => {
  validateAddress(api, address, chain, false)

  await api.init(chain)

  const chainInstance = getChainImpl<TApi, TRes, TSigner, TCustomChain>(chain, api._customCtx)
  return chainInstance.getBalance(api, address, asset)
}

export const getBalanceInternal = async <TApi, TRes, TSigner, TCustomChain extends string = never>(
  options: TGetBalanceOptions<TApi, TRes, TSigner, TCustomChain>
): Promise<bigint> => {
  const { api, chain, currency } = options
  const asset = currency
    ? api.findAssetInfoOrThrow(chain, currency)
    : api.findNativeAssetInfoOrThrow(chain)
  return getAssetBalanceInternal({ ...options, asset })
}

export const getBalance = async <TApi, TRes, TSigner, TCustomChain extends string = never>(
  options: TGetBalanceOptions<TApi, TRes, TSigner, TCustomChain>
): Promise<bigint> => {
  const { api } = options
  try {
    return await getBalanceInternal(options)
  } finally {
    await api.disconnect()
  }
}
