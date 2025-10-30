import {
  findAssetInfoOnDest,
  findAssetOnDestOrThrow,
  findNativeAssetInfoOrThrow,
  type TAssetInfo
} from '@paraspell/assets'
import { isSubstrateBridge, isTLocation } from '@paraspell/sdk-common'

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
  const isSubBridge = !isTLocation(destination) && isSubstrateBridge(originChain, destination)
  const useRelayAssetAsFee = destination === 'Ethereum' || isSubBridge || isRelayAssetIncluded

  if (useRelayAssetAsFee) {
    return findNativeAssetInfoOrThrow(getRelayChainOf(currentChain))
  }

  if (hasPassedExchange && swapConfig && currentChain !== swapConfig.exchangeChain) {
    return findAssetOnDestOrThrow(swapConfig.exchangeChain, currentChain, swapConfig.currencyTo)
  }

  return findAssetInfoOnDest(originChain, currentChain, currency) ?? asset
}
