import {
  getOtherAssets,
  InvalidCurrencyError,
  isForeignAsset,
  type TAsset
} from '@paraspell/assets'
import type { TMultiLocation } from '@paraspell/sdk-common'
import { isRelayChain, Parents } from '@paraspell/sdk-common'

import { DOT_MULTILOCATION } from '../../../constants'
import type { TDestination, TXTokensTransferOptions } from '../../../types'

const resolveMultiLocationFromDest = (destination: TDestination, asset: TAsset) => {
  if (typeof destination === 'object') return destination
  if (isRelayChain(destination)) return DOT_MULTILOCATION

  // If it is a native asset, search by symbol on AssetHub and use the multiLocation from there
  const assetHubAsset = getOtherAssets(destination).find(
    ahAsset => ahAsset.symbol?.toLowerCase() === asset.symbol?.toLowerCase()
  )

  if (!assetHubAsset?.multiLocation) {
    throw new InvalidCurrencyError(`Asset ${asset.symbol} not found or has no multiLocation`)
  }

  return assetHubAsset.multiLocation
}

export const buildMultiLocation = <TApi, TRes>({
  paraIdTo,
  asset,
  origin,
  destination
}: TXTokensTransferOptions<TApi, TRes>): TMultiLocation => {
  if (!isForeignAsset(asset)) {
    return resolveMultiLocationFromDest(destination, asset)
  }

  const createDefaultMultiLocation = (assetId: string): TMultiLocation => ({
    parents: Parents.ONE,
    interior: {
      X3: [{ Parachain: paraIdTo }, { PalletInstance: '50' }, { GeneralIndex: BigInt(assetId) }]
    }
  })

  const isBifrostOrigin = origin === 'BifrostPolkadot' || origin === 'BifrostKusama'

  if (isBifrostOrigin) {
    return createDefaultMultiLocation(asset.assetId as string)
  }

  if (asset.multiLocation) {
    return asset.multiLocation
  } else {
    return createDefaultMultiLocation(asset.assetId as string)
  }
}
