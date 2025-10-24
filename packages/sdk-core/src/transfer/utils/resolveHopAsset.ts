import {
  findAssetInfoOnDest,
  findAssetOnDestOrThrow,
  findNativeAssetInfoOrThrow,
  type TAssetInfo
} from '@paraspell/assets'
import { Parents } from '@paraspell/sdk-common'

import type { TResolveHopParams } from '../../types'
import { getRelayChainOf } from '../../utils'

export const resolveHopAsset = ({
  originChain,
  currentChain,
  swapConfig,
  asset,
  hasPassedExchange,
  currency
}: TResolveHopParams): TAssetInfo => {
  const isExternalAsset = asset.location?.parents === Parents.TWO

  if (isExternalAsset) {
    return findNativeAssetInfoOrThrow(getRelayChainOf(currentChain))
  }

  if (hasPassedExchange && swapConfig && currentChain !== swapConfig.exchangeChain) {
    return findAssetOnDestOrThrow(swapConfig.exchangeChain, currentChain, swapConfig.currencyTo)
  }

  return findAssetInfoOnDest(originChain, currentChain, currency) ?? asset
}
