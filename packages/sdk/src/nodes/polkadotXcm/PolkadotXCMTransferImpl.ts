// Contains basic structure of polkadotXCM call

import { DEFAULT_FEE_ASSET } from '../../const'
import type { TPolkadotXcmSection, TPallet, TSerializedApiCall } from '../../types'
import { type TPolkadotXCMTransferOptions } from '../../types'

class PolkadotXCMTransferImpl {
  static transferPolkadotXCM<TApi, TRes>(
    {
      api,
      header,
      addressSelection,
      currencySelection,
      feeAsset = DEFAULT_FEE_ASSET
    }: TPolkadotXCMTransferOptions<TApi, TRes>,
    section: TPolkadotXcmSection,
    fees: 'Unlimited' | { Limited: string } | undefined = undefined
  ): TRes {
    const module: TPallet = 'PolkadotXcm'

    const call: TSerializedApiCall = {
      module,
      section,
      parameters: {
        dest: header,
        beneficiary: addressSelection,
        assets: currencySelection,
        fee_asset_item: feeAsset,
        ...(fees !== undefined ? { weight_limit: fees } : {})
      }
    }

    return api.callTxMethod(call)
  }
}

export default PolkadotXCMTransferImpl
