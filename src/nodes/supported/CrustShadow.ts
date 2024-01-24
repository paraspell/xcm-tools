// Contains detailed structure of XCM call construction for CrustShadow Parachain

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

class CrustShadow extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('CrustShadow', 'shadow', 'kusama', Version.V3)
  }

  getCurrencySelection({ currency, currencyID }: XTokensTransferInput): any {
    if (currency === 'CSM') {
      return 'SelfReserve'
    }

    if (currencyID === undefined) {
      throw new InvalidCurrencyError(`Asset ${currency} is not supported by node ${this.node}.`)
    }

    return { OtherReserve: currencyID }
  }

  transferXTokens(input: XTokensTransferInput): Extrinsic | TSerializedApiCall {
    return XTokensTransferImpl.transferXTokens(input, this.getCurrencySelection(input))
  }
}

export default CrustShadow
