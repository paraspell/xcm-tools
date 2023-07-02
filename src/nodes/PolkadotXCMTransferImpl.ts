// Contains basic structure of polkadotXCM call

import { Extrinsic, PolkadotXCMTransferInput, TSerializedApiCall, TType } from '../types'

class PolkadotXCMTransferImpl {
  static transferPolkadotXCM(
    {
      api,
      header,
      addressSelection,
      currencySelection,
      serializedApiCallEnabled
    }: PolkadotXCMTransferInput,
    method: string,
    fees: 'Unlimited' | undefined = undefined
  ): Extrinsic | TSerializedApiCall {
    if (serializedApiCallEnabled) {
      return {
        type: TType.TX,
        module: 'polkadotXcm',
        section: method,
        parameters: [header, addressSelection, currencySelection, 0, ...(fees ? [fees] : [])]
      }
    }

    return fees
      ? api.tx.polkadotXcm[method](header, addressSelection, currencySelection, 0, fees)
      : api.tx.polkadotXcm[method](header, addressSelection, currencySelection, 0)
  }
}

export default PolkadotXCMTransferImpl
