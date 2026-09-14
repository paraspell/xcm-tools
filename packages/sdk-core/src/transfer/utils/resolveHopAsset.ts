import { type TAssetInfo } from '@paraspell/assets'
import { isExternalChain } from '@paraspell/sdk-common'

import { RELAY_LOCATION } from '../../constants'
import type { TResolveHopParams } from '../../types'
import { getRelayChainOf } from '../../utils'
import { getFeeAssetInfo } from '../../utils/transfer/getFeeAssetInfo'

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
  currency,
  feeAsset
}: TResolveHopParams<TApi, TRes, TSigner, TCustomChain>): TAssetInfo => {
  const feeAssetInfo = feeAsset && getFeeAssetInfo(asset, feeAsset)
  const isRelayAssetIncluded =
    !Array.isArray(currency) && !feeAssetInfo && api.getTypeThenAssetCount(tx) === 2
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

  if (feeAssetInfo) {
    return (
      api.findAssetInfoOnDest(
        originChain,
        currentChain,
        { location: feeAssetInfo.location },
        feeAssetInfo
      ) ?? feeAssetInfo
    )
  }

  if (hasPassedExchange && swapConfig && currentChain !== swapConfig.exchangeChain) {
    return api.findAssetOnDestOrThrow(swapConfig.exchangeChain, currentChain, swapConfig.currencyTo)
  }

  return api.findAssetInfoOnDest(originChain, currentChain, currency, asset) ?? currentAsset
}
