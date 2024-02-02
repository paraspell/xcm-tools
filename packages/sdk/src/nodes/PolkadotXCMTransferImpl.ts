// Contains basic structure of polkadotXCM call

import { type Extrinsic, type PolkadotXCMTransferInput, type TSerializedApiCall } from '../types'

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
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
          0,
          ...(fees !== undefined ? [fees] : [])
        ]
      }
    }

    return fees !== undefined
      ? api.tx.polkadotXcm[method](header, addressSelection, currencySelection, 0, fees)
      : api.tx.polkadotXcm[method](header, addressSelection, currencySelection, 0)
  }
}

export default PolkadotXCMTransferImpl
