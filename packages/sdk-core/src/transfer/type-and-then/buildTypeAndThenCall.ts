import type { TAsset } from '@paraspell/assets'
import type { TPallet } from '@paraspell/pallets'
import { isRelayChain, isTrustedChain } from '@paraspell/sdk-common'

import { getParaId } from '../../chains/config'
import { RELAY_LOCATION } from '../../constants'
import { createDestination } from '../../pallets/xcmPallet/utils'
import type { TSerializedExtrinsics, TTypeAndThenCallContext } from '../../types'
import { addXcmVersionHeader, createAsset } from '../../utils'
import { localizeLocation } from '../../utils/location'

export const resolveTransferType = <TApi, TRes>({
  origin,
  reserve
}: TTypeAndThenCallContext<TApi, TRes>) => {
  if (origin.chain === reserve.chain) return 'LocalReserve'
  if (isTrustedChain(origin.chain) && isTrustedChain(reserve.chain)) return 'Teleport'
  return 'DestinationReserve'
}

export const buildTypeAndThenCall = <TApi, TRes>(
  context: TTypeAndThenCallContext<TApi, TRes>,
  isDotAsset: boolean,
  customXcm: unknown[],
  assets: TAsset[]
): TSerializedExtrinsics => {
  const {
    origin,
    reserve,
    dest,
    isSubBridge,
    assetInfo,
    options: { version, pallet, method }
  } = context

  const feeAssetLocation = !isDotAsset ? RELAY_LOCATION : assetInfo.location

  const finalDest = origin.chain === reserve.chain ? dest.chain : reserve.chain

  const destLocation = createDestination(version, origin.chain, finalDest, getParaId(finalDest))

  const transferType = resolveTransferType(context)

  const feeMultiAsset = createAsset(
    version,
    assetInfo.amount,
    isRelayChain(origin.chain) || isSubBridge || origin.chain === 'Mythos'
      ? localizeLocation(origin.chain, feeAssetLocation)
      : feeAssetLocation
  )

  const module = (pallet as TPallet) ?? (isRelayChain(origin.chain) ? 'XcmPallet' : 'PolkadotXcm')
  const methodName = method ?? 'transfer_assets_using_type_and_then'

  return {
    module,
    method: methodName,
    params: {
      dest: addXcmVersionHeader(destLocation, version),
      assets: addXcmVersionHeader(assets, version),
      assets_transfer_type: transferType,
      remote_fees_id: addXcmVersionHeader(feeMultiAsset.id, version),
      fees_transfer_type: transferType,
      custom_xcm_on_dest: addXcmVersionHeader(customXcm, version),
      weight_limit: 'Unlimited'
    }
  }
}
