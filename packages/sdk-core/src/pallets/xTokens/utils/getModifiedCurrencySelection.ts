import type { TMultiAsset } from '@paraspell/assets'
import { getOtherAssets, InvalidCurrencyError, isForeignAsset } from '@paraspell/assets'
import { isRelayChain, Parents, type TMultiLocation } from '@paraspell/sdk-common'

import { DOT_MULTILOCATION } from '../../../constants'
import type { TXcmVersioned, TXTokensTransferOptions, Version } from '../../../types'
import {
  addXcmVersionHeader,
  createMultiAsset,
  maybeOverrideMultiAssets
} from '../../xcmPallet/utils'

const buildMultiLocation = <TApi, TRes>({
  paraIdTo,
  asset,
  origin,
  destination
}: TXTokensTransferOptions<TApi, TRes>): TMultiLocation => {
  if (!isForeignAsset(asset)) {
    if (typeof destination === 'object') {
      return destination
    }

    // ParaToRelay scenario
    if (isRelayChain(destination)) {
      return DOT_MULTILOCATION
    }

    // If it is a native asset, search by symbol on AssetHub and use the multiLocation from there
    const assetHubAsset = getOtherAssets(destination).find(
      ahAsset => ahAsset.symbol?.toLowerCase() === asset.symbol?.toLowerCase()
    )

    if (assetHubAsset === undefined) {
      throw new InvalidCurrencyError(`Asset ${asset.symbol} not found in AssetHub`)
    }

    if (assetHubAsset.multiLocation) {
      return assetHubAsset.multiLocation
    }

    throw new InvalidCurrencyError(`Asset ${asset.symbol} has no multiLocation`)
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

export const getModifiedCurrencySelection = <TApi, TRes>(
  version: Version,
  input: TXTokensTransferOptions<TApi, TRes>
): TXcmVersioned<TMultiAsset | TMultiAsset[]> => {
  const {
    asset: { amount },
    overriddenAsset
  } = input

  if (overriddenAsset) {
    return addXcmVersionHeader(
      maybeOverrideMultiAssets(version, amount, [], overriddenAsset),
      version
    )
  }

  const multiLocation = buildMultiLocation(input)
  const multiAsset = createMultiAsset(version, amount, multiLocation)

  return addXcmVersionHeader(multiAsset, version)
}
