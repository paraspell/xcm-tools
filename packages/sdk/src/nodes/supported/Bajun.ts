// Contains detailed structure of XCM call construction for Bajun Parachain

import {
  ScenarioNotSupportedError,
  NodeNotSupportedError,
  InvalidCurrencyError
} from '../../errors'
import {
  type Extrinsic,
  type IXTokensTransfer,
  type TSerializedApiCall,
  Version,
  type XTokensTransferInput
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Bajun extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Bajun', 'bajun', 'kusama', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput): Extrinsic | TSerializedApiCall {
    const { scenario, currency } = input
    if (scenario !== 'ParaToPara') {
      throw new ScenarioNotSupportedError(this.node, scenario)
    }

    const nativeSymbol = this.getNativeAssetSymbol()
    if (currency !== nativeSymbol) {
      throw new InvalidCurrencyError(`Node ${this.node} does not support currency ${currency}`)
    }

    return XTokensTransferImpl.transferXTokens(input, currency)
  }

  transferRelayToPara(): TSerializedApiCall {
    throw new NodeNotSupportedError()
  }
}

export default Bajun
