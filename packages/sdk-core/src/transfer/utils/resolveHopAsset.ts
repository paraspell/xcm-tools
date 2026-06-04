import { type TAssetInfo } from '@paraspell/assets'
import { isExternalChain } from '@paraspell/sdk-common'

import type { TResolveHopParams } from '../../types'
import { getRelayChainOf } from '../../utils'

export const resolveHopAsset = <TApi, TRes, TSigner, TCustomChain extends string = never>({
  api,
  tx,
  originChain,
  currentChain,
  destination,
  swapConfig,
  asset,
  hasPassedExchange,
  currency
}: TResolveHopParams<TApi, TRes, TSigner, TCustomChain>): TAssetInfo => {
  const isRelayAssetIncluded = api.getTypeThenAssetCount(tx) === 2
  const useRelayAssetAsFee =
    (typeof destination === 'string' && isExternalChain(destination)) || isRelayAssetIncluded

  if (useRelayAssetAsFee) {
    return api.findNativeAssetInfoOrThrow(getRelayChainOf(currentChain))
  }

  if (hasPassedExchange && swapConfig && currentChain !== swapConfig.exchangeChain) {
    return api.findAssetOnDestOrThrow(swapConfig.exchangeChain, currentChain, swapConfig.currencyTo)
  }

  return api.findAssetInfoOnDest(originChain, currentChain, currency) ?? asset
}
