// Contains basic structure of polkadotXCM call

import type { TPallet } from '@paraspell/pallets'
import { isTMultiLocation } from '@paraspell/sdk-common'

import { DEFAULT_FEE_ASSET } from '../../constants'
import type { TPolkadotXcmMethod, TSerializedApiCall } from '../../types'
import { type TPolkadotXCMTransferOptions } from '../../types'
import { addXcmVersionHeader } from '../../utils'
import { maybeOverrideMultiAssets } from '../../utils/multiAsset'

export const transferPolkadotXcm = <TApi, TRes>(
  {
    api,
    destLocation,
    asset,
    beneficiaryLocation,
    multiAsset,
    overriddenAsset,
    pallet,
    version,
    method: methodOverride
  }: TPolkadotXCMTransferOptions<TApi, TRes>,
  method: TPolkadotXcmMethod,
  fees: 'Unlimited' | { Limited: string } | undefined = undefined
): Promise<TRes> => {
  const resolvedMultiAssets = maybeOverrideMultiAssets(
    version,
    asset.amount,
    [multiAsset],
    overriddenAsset
  )

  const feeAssetIndex =
    overriddenAsset === undefined || isTMultiLocation(overriddenAsset)
      ? DEFAULT_FEE_ASSET
      : overriddenAsset.findIndex(asset => asset.isFeeAsset)

  const call: TSerializedApiCall = {
    module: (pallet as TPallet) ?? 'PolkadotXcm',
    method: methodOverride ?? method,
    parameters: {
      dest: addXcmVersionHeader(destLocation, version),
      beneficiary: addXcmVersionHeader(beneficiaryLocation, version),
      assets: addXcmVersionHeader(resolvedMultiAssets, version),
      fee_asset_item: feeAssetIndex,
      ...(fees !== undefined ? { weight_limit: fees } : {})
    }
  }

  return Promise.resolve(api.callTxMethod(call))
}
