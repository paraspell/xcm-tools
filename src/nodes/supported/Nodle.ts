// Contains detailed structure of XCM call construction for Nodle Parachain

import { InvalidCurrencyError, ScenarioNotSupportedError } from '../../errors'
import { IXTokensTransfer, Version, XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Nodle extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Nodle', 'nodle', 'polkadot', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput) {
    if (input.scenario !== 'ParaToPara') {
      throw new ScenarioNotSupportedError(this.node, input.scenario)
    }

    if (input.currency !== 'NODL') {
      throw new InvalidCurrencyError(
        `Asset ${input.currency} is not supported by node ${this.node}.`
      )
    }

    return XTokensTransferImpl.transferXTokens(input, 'NodleNative')
  }
}

export default Nodle
