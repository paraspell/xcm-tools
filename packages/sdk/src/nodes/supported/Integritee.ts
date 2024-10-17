// Contains detailed structure of XCM call construction for Integritee Parachain

import { InvalidCurrencyError, NodeNotSupportedError } from '../../errors'
import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type TSerializedApiCallV2
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../xTokens'

class Integritee<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Integritee', 'integritee', 'kusama', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: XTokensTransferInput<TApi, TRes>) {
    if (input.currency === 'KSM')
      throw new InvalidCurrencyError(`Node ${this.node} does not support currency KSM`)
    return XTokensTransferImpl.transferXTokens(input, input.currency)
  }

  transferRelayToPara(): TSerializedApiCallV2 {
    throw new NodeNotSupportedError()
  }
}

export default Integritee
