// Contains detailed structure of XCM call construction for CrustShadow Parachain

import { InvalidCurrencyError } from '../../errors/InvalidCurrencyError'
import { IXTokensTransfer, Version, XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class CrustShadow extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('CrustShadow', 'shadow', 'kusama', Version.V1)
  }

  getCurrencySelection({ currency, currencyID }: XTokensTransferInput) {
    if (currency === 'CSM') {
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

export default CrustShadow
