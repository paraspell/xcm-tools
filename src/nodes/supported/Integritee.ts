// Contains detailed structure of XCM call construction for Integritee Parachain

import { InvalidCurrencyError } from '../../errors'
import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type Extrinsic,
  type TSerializedApiCall
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Integritee extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Integritee', 'integritee', 'kusama', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput): Extrinsic | TSerializedApiCall {
    if (input.currency === 'KSM')
      throw new InvalidCurrencyError(`Node ${this.node} does not support currency KSM`)
    return XTokensTransferImpl.transferXTokens(input, input.currency)
  }
}

export default Integritee
