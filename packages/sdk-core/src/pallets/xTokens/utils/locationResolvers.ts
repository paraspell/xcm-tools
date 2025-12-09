import { getOtherAssets, InvalidCurrencyError, type TAssetInfo } from '@paraspell/assets'
import type { TLocation } from '@paraspell/sdk-common'
import { isRelayChain, Parents } from '@paraspell/sdk-common'

import { DOT_LOCATION } from '../../../constants'
import type { TDestination, TXTokensTransferOptions } from '../../../types'

const resolveLocationFromDest = (destination: TDestination, asset: TAssetInfo) => {
  if (typeof destination === 'object') return destination
  if (isRelayChain(destination)) return DOT_LOCATION

  // If it is a native asset, search by symbol on AssetHub and use the location from there
  const assetHubAsset = getOtherAssets(destination).find(
    ahAsset => ahAsset.symbol?.toLowerCase() === asset.symbol?.toLowerCase()
  )

  if (!assetHubAsset?.location) {
    throw new InvalidCurrencyError(`Asset ${asset.symbol} not found or has no location`)
  }

  return assetHubAsset.location
}

export const buildLocation = <TApi, TRes>({
  paraIdTo,
  asset,
  origin,
  destination
}: TXTokensTransferOptions<TApi, TRes>): TLocation => {
  if (asset.isNative) {
    return resolveLocationFromDest(destination, asset)
  }

  const createDefaultLocation = (assetId: string): TLocation => ({
    parents: Parents.ONE,
    interior: {
      X3: [{ Parachain: paraIdTo }, { PalletInstance: '50' }, { GeneralIndex: BigInt(assetId) }]
    }
  })

  const isBifrostOrigin = origin === 'BifrostPolkadot' || origin === 'BifrostKusama'

  if (isBifrostOrigin) {
    return createDefaultLocation(asset.assetId as string)
  }

  if (asset.location) {
    return asset.location
  } else {
    return createDefaultLocation(asset.assetId as string)
  }
}
