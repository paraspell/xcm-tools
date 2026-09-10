import { type TAssetInfo } from '@paraspell/assets'
import { isExternalChain } from '@paraspell/sdk-common'

import { RELAY_LOCATION } from '../../constants'
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
  currentAsset,
  hasPassedExchange,
  currency
}: TResolveHopParams<TApi, TRes, TSigner, TCustomChain>): TAssetInfo => {
  const isRelayAssetIncluded = !Array.isArray(currency) && api.getTypeThenAssetCount(tx) === 2
  const useRelayAssetAsFee =
    (typeof destination === 'string' && isExternalChain(destination)) || isRelayAssetIncluded

  if (useRelayAssetAsFee) {
    const originRelay = api.getRelayChainOf(originChain)
    return getRelayChainOf(currentChain) === originRelay
      ? api.findNativeAssetInfoOrThrow(originRelay)
      : api.findAssetInfoOrThrow(currentChain, {
          location: api.localizeLocation(currentChain, RELAY_LOCATION, originChain)
        })
  }

  if (hasPassedExchange && swapConfig && currentChain !== swapConfig.exchangeChain) {
    return api.findAssetOnDestOrThrow(swapConfig.exchangeChain, currentChain, swapConfig.currencyTo)
  }

  return api.findAssetInfoOnDest(originChain, currentChain, currency, asset) ?? currentAsset
}
