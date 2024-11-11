import { InvalidCurrencyError } from '../../errors'
import { createMultiAsset } from '../../pallets/xcmPallet/utils'
import { getOtherAssets } from '../../pallets/assets'
import type {
  TCurrencySelectionHeader,
  TCurrencySelectionHeaderArr,
  TMultiAsset,
  TMultiLocation,
  Version,
  XTokensTransferInput
} from '../../types'
import { Parents } from '../../types'
import { isForeignAsset } from '../../utils/assets'
import { DOT_MULTILOCATION } from '../../const'

const buildMultiLocation = <TApi, TRes>({
  paraIdTo,
  asset,
  origin,
  destination
}: XTokensTransferInput<TApi, TRes>): TMultiLocation => {
  if (!isForeignAsset(asset)) {
    if (typeof destination === 'object') {
      return destination
    }

    // ParaToRelay scenario
    if (destination === undefined) {
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
      return assetHubAsset.multiLocation as TMultiLocation
    } else if (assetHubAsset.xcmInterior) {
      return {
        parents: Parents.ONE,
        interior: {
          [`X${assetHubAsset.xcmInterior.length}`]: assetHubAsset.xcmInterior
        }
      }
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
    return asset.multiLocation as TMultiLocation
  } else if (asset.xcmInterior) {
    return {
      parents: Parents.ONE,
      interior: {
        [`X${asset.xcmInterior.length}`]: asset.xcmInterior
      }
    }
  } else {
    return createDefaultMultiLocation(asset.assetId as string)
  }
}

export const getModifiedCurrencySelection = <TApi, TRes>(
  version: Version,
  input: XTokensTransferInput<TApi, TRes>
): TCurrencySelectionHeader | TCurrencySelectionHeaderArr => {
  const { amount, feeAsset } = input
  const multiLocation = buildMultiLocation(input)

  const multiAsset: TMultiAsset = createMultiAsset(version, amount, multiLocation)

  return {
    [version]: feeAsset === undefined ? multiAsset : [multiAsset]
  }
}
