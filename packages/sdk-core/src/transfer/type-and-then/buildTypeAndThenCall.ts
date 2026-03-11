import type { TAsset } from '@paraspell/assets'
import type { TPallet } from '@paraspell/pallets'
import { isRelayChain, isTrustedChain } from '@paraspell/sdk-common'

import { getParaId } from '../../chains/config'
import { RELAY_LOCATION } from '../../constants'
import type { TSerializedExtrinsics, TTypeAndThenCallContext } from '../../types'
import { addXcmVersionHeader, createAsset } from '../../utils'
import { createDestination, localizeLocation } from '../../utils/location'

export const resolveTransferType = <TApi, TRes, TSigner>({
  origin,
  reserve,
  dest,
  isSubBridge
}: TTypeAndThenCallContext<TApi, TRes, TSigner>) => {
  // Direct A → C: when origin is reserve OR dest is reserve, check origin <-> dest trust
  // Hop A → B → C: when reserve differs from both, check origin <-> reserve trust
  const isDirect = origin.chain === reserve.chain || dest.chain === reserve.chain
  const chainToCheck = isDirect ? dest.chain : reserve.chain
  if (isTrustedChain(origin.chain) && isTrustedChain(chainToCheck) && !isSubBridge)
    return 'Teleport'
  if (origin.chain === reserve.chain) return 'LocalReserve'
  return 'DestinationReserve'
}

export const buildTypeAndThenCall = <TApi, TRes, TSigner>(
  context: TTypeAndThenCallContext<TApi, TRes, TSigner>,
  isDotAsset: boolean,
  customXcm: unknown[],
  assets: TAsset[]
): TSerializedExtrinsics => {
  const {
    origin,
    reserve,
    dest,
    assetInfo,
    options: { version, pallet, method, overriddenAsset }
  } = context

  const feeAssetLocation = !isDotAsset ? RELAY_LOCATION : assetInfo.location

  const finalDest = origin.chain === reserve.chain ? dest.chain : reserve.chain

  const destLocation = createDestination(version, origin.chain, finalDest, getParaId(finalDest))

  const transferType = resolveTransferType(context)

  const feeAsset = Array.isArray(overriddenAsset) ? overriddenAsset.find(a => a.isFeeAsset) : null

  const feeMultiAsset =
    feeAsset ??
    createAsset(version, assetInfo.amount, localizeLocation(origin.chain, feeAssetLocation))

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
