import type { TAsset } from '@paraspell/assets'
import type { TPallet } from '@paraspell/pallets'
import { isRelayChain } from '@paraspell/sdk-common'

import { getParaId } from '../../chains/config'
import { RELAY_LOCATION } from '../../constants'
import { createDestination } from '../../pallets/xcmPallet/utils'
import type { TSerializedExtrinsics, TTypeAndThenCallContext } from '../../types'
import { addXcmVersionHeader, createAsset } from '../../utils'
import { localizeLocation } from '../../utils/location'

export const buildTypeAndThenCall = <TApi, TRes>(
  {
    origin,
    reserve,
    dest,
    assetInfo,
    options: { version, pallet, method }
  }: TTypeAndThenCallContext<TApi, TRes>,
  isDotAsset: boolean,
  customXcm: unknown[],
  assets: TAsset[]
): TSerializedExtrinsics => {
  const feeAssetLocation = !isDotAsset ? RELAY_LOCATION : assetInfo.location

  const finalDest = origin.chain === reserve.chain ? dest.chain : reserve.chain

  const destLocation = createDestination(version, origin.chain, finalDest, getParaId(finalDest))

  const reserveType = origin.chain === reserve.chain ? 'LocalReserve' : 'DestinationReserve'

  const feeMultiAsset = createAsset(
    version,
    assetInfo.amount,
    isRelayChain(origin.chain) ? localizeLocation(origin.chain, feeAssetLocation) : feeAssetLocation
  )

  const module = (pallet as TPallet) ?? (isRelayChain(origin.chain) ? 'XcmPallet' : 'PolkadotXcm')
  const methodName = method ?? 'transfer_assets_using_type_and_then'

  return {
    module,
    method: methodName,
    params: {
      dest: addXcmVersionHeader(destLocation, version),
      assets: addXcmVersionHeader(assets, version),
      assets_transfer_type: reserveType,
      remote_fees_id: addXcmVersionHeader(feeMultiAsset.id, version),
      fees_transfer_type: reserveType,
      custom_xcm_on_dest: addXcmVersionHeader(customXcm, version),
      weight_limit: 'Unlimited'
    }
  }
}
