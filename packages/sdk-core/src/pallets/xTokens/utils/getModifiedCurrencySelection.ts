import { DOT_MULTILOCATION } from '../../../constants'
import { InvalidCurrencyError } from '../../../errors'
import type {
  TMultiAsset,
  TMultiLocation,
  TXcmVersioned,
  TXTokensTransferOptions,
  Version
} from '../../../types'
import { Parents } from '../../../types'
import { isRelayChain } from '../../../utils'
import { isForeignAsset } from '../../../utils/assets'
import { getOtherAssets } from '../../assets'
import { addXcmVersionHeader, createMultiAsset } from '../../xcmPallet/utils'

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
      return assetHubAsset.multiLocation as TMultiLocation
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
  } else {
    return createDefaultMultiLocation(asset.assetId as string)
  }
}

export const getModifiedCurrencySelection = <TApi, TRes>(
  version: Version,
  input: TXTokensTransferOptions<TApi, TRes>
): TXcmVersioned<TMultiAsset | TMultiAsset[]> => {
  const {
    asset: { amount }
  } = input
  const multiLocation = buildMultiLocation(input)
  const multiAsset = createMultiAsset(version, amount, multiLocation)
  return addXcmVersionHeader(multiAsset, version)
}
