import { findAssetInfoOrThrow, getNativeAssetSymbol } from '@paraspell/assets'
import type { TParachain } from '@paraspell/sdk-common'

import type { TGetAssetBalanceOptions } from '../../../types/TBalance'
import { getBalanceForeignInternal } from './getBalanceForeign'
import { getBalanceNativeInternal } from './getBalanceNative'

export const getAssetBalanceInternal = async <TApi, TRes>({
  address,
  chain,
  currency,
  api
}: TGetAssetBalanceOptions<TApi, TRes>): Promise<bigint> => {
  await api.init(chain)

  const asset = findAssetInfoOrThrow(chain, currency, null)

  const isNativeSymbol = asset.symbol === getNativeAssetSymbol(chain)

  return isNativeSymbol && chain !== 'Interlay' && chain !== 'Kintsugi'
    ? await getBalanceNativeInternal({
        address,
        chain,
        api
      })
    : ((await getBalanceForeignInternal({
        address,
        chain: chain as TParachain,
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
