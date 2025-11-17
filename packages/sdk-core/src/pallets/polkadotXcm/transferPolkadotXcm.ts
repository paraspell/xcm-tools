// Contains basic structure of polkadotXCM call

import type { TPallet } from '@paraspell/pallets'
import { isTLocation } from '@paraspell/sdk-common'

import { DEFAULT_FEE_ASSET } from '../../constants'
import type { TPolkadotXcmMethod, TSerializedExtrinsics } from '../../types'
import { type TPolkadotXCMTransferOptions } from '../../types'
import { addXcmVersionHeader } from '../../utils'
import { maybeOverrideAssets } from '../../utils/asset'

export const transferPolkadotXcm = <TApi, TRes>(
  {
    api,
    destLocation,
    assetInfo: asset,
    beneficiaryLocation,
    asset: multiAsset,
    overriddenAsset,
    pallet,
    version,
    method: methodOverride
  }: TPolkadotXCMTransferOptions<TApi, TRes>,
  method: TPolkadotXcmMethod,
  fees: 'Unlimited' | { Limited: string } | undefined = undefined
): Promise<TRes> => {
  const resolvedMultiAssets = maybeOverrideAssets(
    version,
    asset.amount,
    [multiAsset],
    overriddenAsset
  )

  const feeAssetIndex =
    overriddenAsset === undefined || isTLocation(overriddenAsset)
      ? DEFAULT_FEE_ASSET
      : overriddenAsset.findIndex(asset => asset.isFeeAsset)

  const call: TSerializedExtrinsics = {
    module: (pallet as TPallet) ?? 'PolkadotXcm',
    method: methodOverride ?? method,
    params: {
      dest: addXcmVersionHeader(destLocation, version),
      beneficiary: addXcmVersionHeader(beneficiaryLocation, version),
      assets: addXcmVersionHeader(resolvedMultiAssets, version),
      fee_asset_item: feeAssetIndex,
      ...(fees !== undefined ? { weight_limit: fees } : {})
    }
  }

  return Promise.resolve(api.deserializeExtrinsics(call))
}
