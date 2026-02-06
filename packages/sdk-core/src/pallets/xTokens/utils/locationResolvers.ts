import { getOtherAssets, InvalidCurrencyError, type TAssetInfo } from '@paraspell/assets'
import type { TLocation } from '@paraspell/sdk-common'
import { isRelayChain } from '@paraspell/sdk-common'

import { DOT_LOCATION } from '../../../constants'
import type { TDestination, TXTokensTransferOptions } from '../../../types'

const resolveLocationFromDest = (destination: TDestination, asset: TAssetInfo) => {
  if (typeof destination === 'object') return destination
  if (isRelayChain(destination)) return DOT_LOCATION

  // If it is a native asset, search by symbol on AssetHub and use the location from there
  const assetHubAsset = getOtherAssets(destination).find(
    ahAsset => ahAsset.symbol?.toLowerCase() === asset.symbol?.toLowerCase()
  )

  if (!assetHubAsset) {
    throw new InvalidCurrencyError(`Asset ${asset.symbol} not found`)
  }

  return assetHubAsset.location
}

export const buildLocation = <TApi, TRes, TSigner>({
  asset,
  destination
}: TXTokensTransferOptions<TApi, TRes, TSigner>): TLocation => {
  if (asset.isNative) {
    return resolveLocationFromDest(destination, asset)
  }

  return asset.location
}
