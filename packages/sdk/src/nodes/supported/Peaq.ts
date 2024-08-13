// Contains detailed structure of XCM call construction for Peaq Parachain

import { NodeNotSupportedError, ScenarioNotSupportedError } from '../../errors'
import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type TSerializedApiCall
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Peaq extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Peaq', 'peaq', 'polkadot', Version.V2)
  }

  transferXTokens(input: XTokensTransferInput) {
    const { scenario, currencyID } = input
    if (scenario !== 'ParaToPara') {
      throw new ScenarioNotSupportedError(this.node, scenario)
    }
    return XTokensTransferImpl.transferXTokens(input, currencyID)
  }

  transferRelayToPara(): TSerializedApiCall {
    throw new NodeNotSupportedError()
  }

  getProvider() {
    return 'wss://peaq.api.onfinality.io/public-ws'
  }
}

export default Peaq
