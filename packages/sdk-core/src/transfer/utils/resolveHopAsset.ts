import {
  findAssetInfoOnDest,
  findAssetOnDestOrThrow,
  findNativeAssetInfoOrThrow,
  type TAssetInfo
} from '@paraspell/assets'

import type { TResolveHopParams } from '../../types'
import { getRelayChainOf } from '../../utils'

export const resolveHopAsset = <TApi, TRes>({
  api,
  tx,
  originChain,
  currentChain,
  destination,
  swapConfig,
  asset,
  hasPassedExchange,
  currency
}: TResolveHopParams<TApi, TRes>): TAssetInfo => {
  const isRelayAssetIncluded = api.getTypeThenAssetCount(tx) === 2
  const useRelayAssetAsFee = destination === 'Ethereum' || isRelayAssetIncluded

  if (useRelayAssetAsFee) {
    return findNativeAssetInfoOrThrow(getRelayChainOf(currentChain))
  }

  if (hasPassedExchange && swapConfig && currentChain !== swapConfig.exchangeChain) {
    return findAssetOnDestOrThrow(swapConfig.exchangeChain, currentChain, swapConfig.currencyTo)
  }

  return findAssetInfoOnDest(originChain, currentChain, currency) ?? asset
}
