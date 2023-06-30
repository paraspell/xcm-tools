// Contains detailed structure of XCM call construction for Clover Parachain

import { InvalidCurrencyError } from '../../errors/InvalidCurrencyError'
import { IXTokensTransfer, Version, XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Clover extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Clover', 'clover', 'polkadot', Version.V1)
  }

  getCurrencySelection({ currency, currencyID }: XTokensTransferInput) {
    if (currency === 'CLV') {
      return 'SelfReserve'
    }

    if (!currencyID) {
      throw new InvalidCurrencyError(`Asset ${currency} is not supported by node ${this.node}.`)
    }

    return { OtherReserve: currencyID }
  }

  transferXTokens(input: XTokensTransferInput) {
    return XTokensTransferImpl.transferXTokens(input, this.getCurrencySelection(input))
  }
}

export default Clover
