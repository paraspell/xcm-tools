import type { TAsset } from '@paraspell/assets'
import { isRelayChain } from '@paraspell/sdk-common'

import { getParaId } from '../../chains/config'
import { RELAY_LOCATION } from '../../constants'
import { createDestination } from '../../pallets/xcmPallet/utils'
import type { TSerializedApiCall, TTypeAndThenCallContext } from '../../types'
import { addXcmVersionHeader, createAsset, localizeLocation } from '../../utils'

export const buildTypeAndThenCall = <TApi, TRes>(
  { origin, reserve, dest, assetInfo, options: { version } }: TTypeAndThenCallContext<TApi, TRes>,
  isDotAsset: boolean,
  customXcm: unknown[],
  assets: TAsset[]
): TSerializedApiCall => {
  const feeAssetLocation = !isDotAsset ? RELAY_LOCATION : assetInfo.location

  const finalDest = origin.chain === reserve.chain ? dest.chain : reserve.chain
  const destLocation = createDestination(version, origin.chain, finalDest, getParaId(finalDest))

  const reserveType = origin.chain === reserve.chain ? 'LocalReserve' : 'DestinationReserve'

  const feeMultiAsset = createAsset(
    version,
    assetInfo.amount,
    isRelayChain(origin.chain) ? localizeLocation(origin.chain, feeAssetLocation) : feeAssetLocation
  )

  return {
    module: isRelayChain(origin.chain) ? 'XcmPallet' : 'PolkadotXcm',
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
