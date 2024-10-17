// Contains basic structure of polkadotXCM call

import { DEFAULT_FEE_ASSET } from '../../const'
import type {
  PolkadotXcmSection,
  TPallet,
  TSerializedApiCallV2,
  TTransferReturn
} from '../../types'
import { type PolkadotXCMTransferInput } from '../../types'

class PolkadotXCMTransferImpl {
  static transferPolkadotXCM<TApi, TRes>(
    {
      api,
      header,
      addressSelection,
      currencySelection,
      feeAsset = DEFAULT_FEE_ASSET,
      serializedApiCallEnabled
    }: PolkadotXCMTransferInput<TApi, TRes>,
    section: PolkadotXcmSection,
    fees: 'Unlimited' | { Limited: string } | undefined = undefined
  ): TTransferReturn<TRes> {
    const module: TPallet = 'PolkadotXcm'

    const call: TSerializedApiCallV2 = {
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

    if (serializedApiCallEnabled === true) {
      // Keep compatible with old serialized call type
      return {
        ...call,
        parameters: Object.values(call.parameters)
      }
    }

    return api.callTxMethod(call)
  }
}

export default PolkadotXCMTransferImpl
