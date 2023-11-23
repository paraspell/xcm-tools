// Contains detailed structure of XCM call construction for Crust Parachain

import { InvalidCurrencyError } from '../../errors/InvalidCurrencyError'
import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type Extrinsic,
  type TSerializedApiCall
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Crust extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Crust', 'crustParachain', 'polkadot', Version.V1)
  }

  getCurrencySelection({ currency, currencyID }: XTokensTransferInput): any {
    if (currency === 'CRU') {
      return 'SelfReserve'
    }

    if (currencyID === undefined) {
      throw new InvalidCurrencyError(`Asset ${currency} is not supported by node ${this.node}.`)
    }

    return { OtherReserve: currencyID }
  }

  transferXTokens(input: XTokensTransferInput): Extrinsic | TSerializedApiCall {
    return XTokensTransferImpl.transferXTokens(input, this.getCurrencySelection(input), input.fees)
  }
}

export default Crust
