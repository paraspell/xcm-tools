import type { TMultiAsset } from '@paraspell/assets'

import { RELAY_LOCATION } from '../../constants'
import { getParaId } from '../../nodes/config'
import { createDestination } from '../../pallets/xcmPallet/utils'
import type { TSerializedApiCall, TTypeAndThenCallContext } from '../../types'
import { addXcmVersionHeader, createMultiAsset } from '../../utils'

export const buildTypeAndThenCall = <TApi, TRes>(
  { origin, reserve, dest, asset, options: { version } }: TTypeAndThenCallContext<TApi, TRes>,
  isDotAsset: boolean,
  customXcm: unknown[],
  assets: TMultiAsset[]
): TSerializedApiCall => {
  const feeAssetLocation = !isDotAsset ? RELAY_LOCATION : asset.multiLocation

  const finalDest = origin.chain === reserve.chain ? dest.chain : reserve.chain
  const destLocation = createDestination(version, origin.chain, finalDest, getParaId(finalDest))

  const reserveType = origin.chain === reserve.chain ? 'LocalReserve' : 'DestinationReserve'

  const feeMultiAsset = createMultiAsset(version, asset.amount, feeAssetLocation)

  return {
    module: 'PolkadotXcm',
    method: 'transfer_assets_using_type_and_then',
    parameters: {
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
