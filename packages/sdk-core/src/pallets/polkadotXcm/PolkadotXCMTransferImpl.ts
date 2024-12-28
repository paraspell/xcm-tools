// Contains basic structure of polkadotXCM call

import { DEFAULT_FEE_ASSET } from '../../constants'
import { isTMultiLocation } from '../xcmPallet/utils'
import type { TPallet, TPolkadotXcmSection, TSerializedApiCall } from '../../types'
import { type TPolkadotXCMTransferOptions } from '../../types'

class PolkadotXCMTransferImpl {
  static transferPolkadotXCM<TApi, TRes>(
    {
      api,
      header,
      addressSelection,
      currencySelection,
      overriddenAsset,
      pallet,
      method
    }: TPolkadotXCMTransferOptions<TApi, TRes>,
    section: TPolkadotXcmSection,
    fees: 'Unlimited' | { Limited: string } | undefined = undefined
  ): TRes {
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
        assets: currencySelection,
        fee_asset_item: feeAssetIndex,
        ...(fees !== undefined ? { weight_limit: fees } : {})
      }
    }

    return api.callTxMethod(call)
  }
}

export default PolkadotXCMTransferImpl
