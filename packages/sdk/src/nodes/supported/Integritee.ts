// Contains detailed structure of XCM call construction for Integritee Parachain

import { InvalidCurrencyError, NodeNotSupportedError } from '../../errors'
import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type TSerializedApiCall
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Integritee extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Integritee', 'integritee', 'kusama', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput) {
    if (input.currency === 'KSM')
      throw new InvalidCurrencyError(`Node ${this.node} does not support currency KSM`)
    return XTokensTransferImpl.transferXTokens(input, input.currency)
  }

  transferRelayToPara(): TSerializedApiCall {
    throw new NodeNotSupportedError()
  }
}

export default Integritee
