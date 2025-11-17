import { findAssetInfoOrThrow, findNativeAssetInfoOrThrow } from '@paraspell/assets'

import type { TGetBalanceNativeOptions } from '../types'
import { getAssetBalanceInternal } from './getBalance'

export const getBalanceNative = async <TApi, TRes>(
  options: TGetBalanceNativeOptions<TApi, TRes>
): Promise<bigint> => {
  const { chain, currency } = options
  const asset = currency
    ? findAssetInfoOrThrow(chain, currency, null)
    : findNativeAssetInfoOrThrow(chain)
  return getAssetBalanceInternal({ ...options, asset })
}
