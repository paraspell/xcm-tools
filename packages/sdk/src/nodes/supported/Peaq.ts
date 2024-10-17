// Contains detailed structure of XCM call construction for Peaq Parachain

import { NodeNotSupportedError, ScenarioNotSupportedError } from '../../errors'
import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type TSerializedApiCallV2
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../xTokens'

class Peaq<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Peaq', 'peaq', 'polkadot', Version.V2)
  }

  transferXTokens<TApi, TRes>(input: XTokensTransferInput<TApi, TRes>) {
    const { scenario, currencyID } = input
    if (scenario !== 'ParaToPara') {
      throw new ScenarioNotSupportedError(this.node, scenario)
    }
    return XTokensTransferImpl.transferXTokens(input, currencyID ? BigInt(currencyID) : undefined)
  }

  transferRelayToPara(): TSerializedApiCallV2 {
    throw new NodeNotSupportedError()
  }

  getProvider() {
    return 'wss://peaq.api.onfinality.io/public-ws'
  }
}

export default Peaq
