import { InvalidCurrencyError } from '../../../errors'
import { createMultiAsset } from '../../xcmPallet/utils'
import { getOtherAssets } from '../../assets'
import type {
  TCurrencySelectionHeader,
  TCurrencySelectionHeaderArr,
  TMultiAsset,
  TMultiLocation,
  Version,
  TXTokensTransferOptions
} from '../../../types'
import { Parents } from '../../../types'
import { isForeignAsset } from '../../../utils/assets'
import { DOT_MULTILOCATION } from '../../../constants'
import { isRelayChain } from '../../../utils'

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
): TCurrencySelectionHeader | TCurrencySelectionHeaderArr => {
  const { asset } = input
  const multiLocation = buildMultiLocation(input)

  const multiAsset: TMultiAsset = createMultiAsset(version, asset.amount, multiLocation)

  return {
    [version]: multiAsset
  }
}
