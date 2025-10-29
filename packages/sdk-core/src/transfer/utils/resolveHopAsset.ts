import {
  findAssetInfoOnDest,
  findAssetOnDestOrThrow,
  findNativeAssetInfoOrThrow,
  type TAssetInfo
} from '@paraspell/assets'
import { deepEqual, getJunctionValue, Parents, RELAYCHAINS } from '@paraspell/sdk-common'

import type { TResolveHopParams } from '../../types'
import { getRelayChainOf } from '../../utils'

export const resolveHopAsset = ({
  originChain,
  currentChain,
  destination,
  swapConfig,
  asset,
  hasPassedExchange,
  currency
}: TResolveHopParams): TAssetInfo => {
  const isExternalAsset =
    asset.location?.parents === Parents.TWO &&
    !RELAYCHAINS.some(
      chain =>
        asset.location &&
        deepEqual(getJunctionValue(asset.location, 'GlobalConsensus'), {
          [chain.toLowerCase()]: null
        })
    ) &&
    destination === 'Ethereum'

  if (isExternalAsset) {
    return findNativeAssetInfoOrThrow(getRelayChainOf(currentChain))
  }

  if (hasPassedExchange && swapConfig && currentChain !== swapConfig.exchangeChain) {
    return findAssetOnDestOrThrow(swapConfig.exchangeChain, currentChain, swapConfig.currencyTo)
  }

  return findAssetInfoOnDest(originChain, currentChain, currency) ?? asset
}
