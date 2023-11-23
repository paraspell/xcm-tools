// Contains basic structure of xToken call

import {
  type Extrinsic,
  type TPallet,
  type TSerializedApiCall,
  type XTokensTransferInput
} from '../types'
import { lowercaseFirstLetter } from '../utils'

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
class XTokensTransferImpl {
  static transferXTokens(
    { api, amount, addressSelection, serializedApiCallEnabled }: XTokensTransferInput,
    currencySelection: any,
    fees: string | number = 'Unlimited',
    pallet: TPallet = 'XTokens'
  ): Extrinsic | TSerializedApiCall {
    const module = lowercaseFirstLetter(pallet.toString())

    if (serializedApiCallEnabled === true) {
      return {
        module,
        section: 'transfer',
        parameters: [currencySelection, amount, addressSelection, fees]
      }
    }

    return api.tx[module].transfer(currencySelection, amount, addressSelection, fees)
  }
}

export default XTokensTransferImpl
