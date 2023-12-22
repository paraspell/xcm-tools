// Contains detailed structure of XCM call construction for Pendulum Parachain

import {
  InvalidCurrencyError,
  NodeNotSupportedError,
  ScenarioNotSupportedError
} from '../../errors'
import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type Extrinsic,
  type TSerializedApiCall
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Pendulum extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Pendulum', 'pendulum', 'polkadot', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput): Extrinsic | TSerializedApiCall {
    if (input.scenario !== 'ParaToPara') {
      throw new ScenarioNotSupportedError(this.node, input.scenario)
    }

    if (input.currency !== 'PEN') {
      throw new InvalidCurrencyError(
        `Asset ${input.currency} is not supported by node ${this.node}.`
      )
    }

    return XTokensTransferImpl.transferXTokens(input, { XCM: input.currencyID })
  }

  transferRelayToPara(): TSerializedApiCall {
    throw new NodeNotSupportedError()
  }
}

export default Pendulum
