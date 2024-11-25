// Contains detailed structure of XCM call construction for Integritee Parachain

import { InvalidCurrencyError, NodeNotSupportedError } from '../../errors'
import {
  type IXTokensTransfer,
  Version,
  type TXTokensTransferOptions,
  type TSerializedApiCall
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../xTokens'

class Integritee<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Integritee', 'integritee', 'kusama', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input
    if (asset.symbol === 'KSM')
      throw new InvalidCurrencyError(`Node ${this.node} does not support currency KSM`)
    return XTokensTransferImpl.transferXTokens(input, asset.symbol)
  }

  transferRelayToPara(): TSerializedApiCall {
    throw new NodeNotSupportedError()
  }
}

export default Integritee
