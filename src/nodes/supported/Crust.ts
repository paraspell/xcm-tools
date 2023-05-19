//Contains detailed structure of XCM call construction for Crust Parachain

import { InvalidCurrencyError } from '../../errors/InvalidCurrencyError'
import { IXTokensTransfer, XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Crust extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Crust', 'crustParachain', 'polkadot')
  }

  getCurrencySelection({ currency, currencyID }: XTokensTransferInput) {
    if (currency === 'CRU') {
      return 'SelfReserve'
    }

    if (!currencyID) {
      throw new InvalidCurrencyError(`Asset ${currency} is not supported by node ${this.node}.`)
    }

    return { OtherReserve: currencyID }
  }

  transferXTokens(input: XTokensTransferInput) {
    return XTokensTransferImpl.transferXTokens(input, this.getCurrencySelection(input), input.fees)
  }
}

export default Crust
