import { normalizeLocation, type TAsset } from '@paraspell/assets'
import type { TPallet } from '@paraspell/pallets'
import { isTrustedChain } from '@paraspell/sdk-common'

import { RELAY_LOCATION } from '../../constants'
import type { TSerializedExtrinsics, TTypeAndThenCallContext } from '../../types'
import { addXcmVersionHeader, createAsset, isNativeAssetTeleport } from '../../utils'
import { createDestination } from '../../utils/location'

export const resolveTransferType = <TApi, TRes, TSigner, TCustomChain extends string = never>({
  origin,
  reserve,
  dest,
  isSubBridge,
  assetInfo
}: TTypeAndThenCallContext<TApi, TRes, TSigner, TCustomChain>) => {
  // Direct A → C: when origin is reserve OR dest is reserve, check origin <-> dest trust
  // Hop A → B → C: when reserve differs from both, check origin <-> reserve trust
  const isDirect = origin.chain === reserve.chain || dest.chain === reserve.chain
  const chainToCheck = isDirect ? dest.chain : reserve.chain
  const canTeleport =
    (isTrustedChain(origin.chain) && isTrustedChain(chainToCheck)) ||
    isNativeAssetTeleport(origin.api, origin.chain, chainToCheck, assetInfo)
  if (canTeleport && !isSubBridge) return 'Teleport'
  if (origin.chain === reserve.chain) return 'LocalReserve'
  return 'DestinationReserve'
}

export const buildTypeAndThenCall = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  context: TTypeAndThenCallContext<TApi, TRes, TSigner, TCustomChain>,
  isDotAsset: boolean,
  customXcm: unknown[],
  assets: TAsset[]
): TSerializedExtrinsics => {
  const {
    origin,
    reserve,
    dest,
    assetInfo,
    bridgeHopChain,
    options: { version, pallet, method, overriddenAsset }
  } = context

  const feeAssetLocation = !isDotAsset ? RELAY_LOCATION : assetInfo.location

  const finalDest = bridgeHopChain ?? (origin.chain === reserve.chain ? dest.chain : reserve.chain)

  const destLocation = createDestination(
    origin.api,
    version,
    origin.chain,
    finalDest,
    origin.api.getParaId(finalDest)
  )

  const transferType = bridgeHopChain ? 'DestinationReserve' : resolveTransferType(context)

  const feeAsset = Array.isArray(overriddenAsset) ? overriddenAsset.find(a => a.isFeeAsset) : null

  const feeMultiAsset =
    feeAsset ??
    createAsset(
      version,
      assetInfo.amount,
      normalizeLocation(origin.api.localizeLocation(origin.chain, feeAssetLocation), version)
    )

  const module = (pallet as TPallet) ?? origin.api.getXcmPallet(origin.chain)
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
