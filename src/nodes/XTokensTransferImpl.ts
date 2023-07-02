// Contains basic structure of xToken call

import { Extrinsic, TPallet, TSerializedApiCall, TType, XTokensTransferInput } from '../types'
import { lowercaseFirstLetter } from '../utils'

class XTokensTransferImpl {
  static transferXTokens(
    { api, amount, addressSelection, serializedApiCallEnabled }: XTokensTransferInput,
    currencySelection: any,
    fees: string | number = 'Unlimited',
    pallet: TPallet = 'XTokens'
  ): Extrinsic | TSerializedApiCall {
    const module = lowercaseFirstLetter(pallet.toString())

    if (serializedApiCallEnabled) {
      return {
        type: TType.TX,
        module,
        section: 'transfer',
        parameters: [currencySelection, amount, addressSelection, fees]
      }
    }

    return api.tx[module].transfer(currencySelection, amount, addressSelection, fees)
  }
}

export default XTokensTransferImpl
