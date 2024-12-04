// Contains basic structure of polkadotXCM call

import { DEFAULT_FEE_ASSET } from '../../const'
import { isTMultiLocation } from '../../pallets/xcmPallet/utils'
import type { TPolkadotXcmSection, TSerializedApiCall } from '../../types'
import { type TPolkadotXCMTransferOptions } from '../../types'

class PolkadotXCMTransferImpl {
  static transferPolkadotXCM<TApi, TRes>(
    {
      api,
      header,
      addressSelection,
      currencySelection,
      overriddenAsset
    }: TPolkadotXCMTransferOptions<TApi, TRes>,
    section: TPolkadotXcmSection,
    fees: 'Unlimited' | { Limited: string } | undefined = undefined
  ): TRes {
    const feeAssetIndex =
      overriddenAsset === undefined || isTMultiLocation(overriddenAsset)
        ? DEFAULT_FEE_ASSET
        : overriddenAsset.findIndex(asset => asset.isFeeAsset)

    const call: TSerializedApiCall = {
      module: 'PolkadotXcm',
      section,
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
