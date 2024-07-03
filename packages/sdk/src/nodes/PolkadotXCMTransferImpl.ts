// Contains basic structure of polkadotXCM call

import { type Extrinsic, type PolkadotXCMTransferInput, type TSerializedApiCall } from '../types'

const DEFAULT_FEE_ASSET = 0

class PolkadotXCMTransferImpl {
  static transferPolkadotXCM(
    {
      api,
      header,
      addressSelection,
      currencySelection,
      feeAsset = DEFAULT_FEE_ASSET,
      serializedApiCallEnabled
    }: PolkadotXCMTransferInput,
    method: string,
    fees: 'Unlimited' | { Limited: string } | undefined = undefined
  ): Extrinsic | TSerializedApiCall {
    if (serializedApiCallEnabled === true) {
      return {
        module: 'polkadotXcm',
        section: method,
        parameters: [
          header,
          addressSelection,
          currencySelection,
          feeAsset,
          ...(fees !== undefined ? [fees] : [])
        ]
      }
    }

    return fees !== undefined
      ? api.tx.polkadotXcm[method](header, addressSelection, currencySelection, feeAsset, fees)
      : api.tx.polkadotXcm[method](header, addressSelection, currencySelection, feeAsset)
  }
}

export default PolkadotXCMTransferImpl
