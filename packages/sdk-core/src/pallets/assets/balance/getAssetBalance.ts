import { findAssetInfoOrThrow, getNativeAssetSymbol } from '@paraspell/assets'

import { getEthErc20Balance } from '../../../balance'
import type { TGetBalanceOptions } from '../../../types/TBalance'
import { getBalanceForeign } from './getBalanceForeign'
import { getBalanceNative } from './getBalanceNative'

export const getAssetBalanceInternal = async <TApi, TRes>({
  address,
  chain,
  currency,
  api
}: TGetBalanceOptions<TApi, TRes>): Promise<bigint> => {
  await api.init(chain)

  const asset = findAssetInfoOrThrow(chain, currency, null)

  if (chain === 'Ethereum') return getEthErc20Balance(asset, address)

  const isNativeSymbol = asset.symbol === getNativeAssetSymbol(chain)

  return isNativeSymbol && chain !== 'Interlay' && chain !== 'Kintsugi'
    ? await getBalanceNative({
        api,
        address,
        chain
      })
    : await getBalanceForeign({
        api,
        address,
        chain,
        currency
      })
}

export const getAssetBalance = async <TApi, TRes>(
  options: TGetBalanceOptions<TApi, TRes>
): Promise<bigint> => {
  const { api } = options
  try {
    return await getAssetBalanceInternal(options)
  } finally {
    await api.disconnect()
  }
}
