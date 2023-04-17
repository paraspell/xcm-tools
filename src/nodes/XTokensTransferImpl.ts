import { Extrinsic, TPallet, XTokensTransferInput } from '../types'
import { lowercaseFirstLetter } from '../utils'

class XTokensTransferImpl {
  static transferXTokens(
    { api, amount, addressSelection }: XTokensTransferInput,
    currencySelection: any,
    fees: string | number = 'Unlimited',
    pallet: TPallet = 'XTokens'
  ): Extrinsic {
    return api.tx[lowercaseFirstLetter(pallet.toString())].transfer(
      currencySelection,
      amount,
      addressSelection,
      fees
    )
  }
}

export default XTokensTransferImpl
