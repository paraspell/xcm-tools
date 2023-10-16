// Contains detailed structure of XCM call construction for Pendulum Parachain

import { InvalidCurrencyError, ScenarioNotSupportedError } from '../../errors'
import { IXTokensTransfer, Version, XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Pendulum extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Pendulum', 'pendulum', 'polkadot', Version.V1)
  }

  transferXTokens(input: XTokensTransferInput) {
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
}

export default Pendulum
