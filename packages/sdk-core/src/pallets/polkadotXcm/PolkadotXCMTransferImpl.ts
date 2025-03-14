// Contains basic structure of polkadotXCM call

import type { TMultiAsset } from '@paraspell/assets'
import type { TPallet } from '@paraspell/pallets'
import { isTMultiLocation } from '@paraspell/sdk-common'

import { DEFAULT_FEE_ASSET } from '../../constants'
import type { TPolkadotXcmSection, TSerializedApiCall } from '../../types'
import { type TPolkadotXCMTransferOptions } from '../../types'
import {
  addXcmVersionHeader,
  extractVersionFromHeader,
  maybeOverrideMultiAssets
} from '../xcmPallet/utils'

class PolkadotXCMTransferImpl {
  static transferPolkadotXCM<TApi, TRes>(
    {
      api,
      header,
      asset,
      addressSelection,
      currencySelection,
      overriddenAsset,
      pallet,
      method
    }: TPolkadotXCMTransferOptions<TApi, TRes>,
    section: TPolkadotXcmSection,
    fees: 'Unlimited' | { Limited: string } | undefined = undefined
  ): TRes {
    const [version, multiAssets] = extractVersionFromHeader<TMultiAsset[]>(currencySelection)

    const resolvedMultiAssets = addXcmVersionHeader(
      maybeOverrideMultiAssets(version, asset.amount, multiAssets, overriddenAsset),
      version
    )

    const feeAssetIndex =
      overriddenAsset === undefined || isTMultiLocation(overriddenAsset)
        ? DEFAULT_FEE_ASSET
        : overriddenAsset.findIndex(asset => asset.isFeeAsset)

    const call: TSerializedApiCall = {
      module: (pallet as TPallet) ?? 'PolkadotXcm',
      section: method ?? section,
      parameters: {
        dest: header,
        beneficiary: addressSelection,
        assets: resolvedMultiAssets,
        fee_asset_item: feeAssetIndex,
        ...(fees !== undefined ? { weight_limit: fees } : {})
      }
    }

    return api.callTxMethod(call)
  }
}

export default PolkadotXCMTransferImpl
