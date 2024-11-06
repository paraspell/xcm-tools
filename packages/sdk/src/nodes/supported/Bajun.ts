// Contains detailed structure of XCM call construction for Bajun Parachain

import {
  ScenarioNotSupportedError,
  NodeNotSupportedError,
  InvalidCurrencyError
} from '../../errors'
import {
  type IXTokensTransfer,
  type TSerializedApiCallV2,
  Version,
  type XTokensTransferInput
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../xTokens'

class Bajun<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Bajun', 'bajun', 'kusama', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: XTokensTransferInput<TApi, TRes>) {
    const { scenario, asset } = input
    if (scenario !== 'ParaToPara') {
      throw new ScenarioNotSupportedError(this.node, scenario)
    }

    const nativeSymbol = this.getNativeAssetSymbol()
    if (asset.symbol !== nativeSymbol) {
      throw new InvalidCurrencyError(`Node ${this.node} does not support currency ${asset.symbol}`)
    }

    return XTokensTransferImpl.transferXTokens(input, asset.symbol)
  }

  transferRelayToPara(): TSerializedApiCallV2 {
    throw new NodeNotSupportedError()
  }
}

export default Bajun
