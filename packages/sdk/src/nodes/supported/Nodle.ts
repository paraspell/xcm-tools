// Contains detailed structure of XCM call construction for Nodle Parachain

import {
  InvalidCurrencyError,
  NodeNotSupportedError,
  ScenarioNotSupportedError
} from '../../errors'
import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type TSerializedApiCallV2,
  type TNodleAsset
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../xTokens'

class Nodle<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Nodle', 'nodle', 'polkadot', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: XTokensTransferInput<TApi, TRes>) {
    if (input.scenario !== 'ParaToPara') {
      throw new ScenarioNotSupportedError(this.node, input.scenario)
    }

    if (input.currency !== this.getNativeAssetSymbol()) {
      throw new InvalidCurrencyError(
        `Asset ${input.currency} is not supported by node ${this.node}.`
      )
    }

    const currencySelection: TNodleAsset = 'NodleNative'

    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }

  transferRelayToPara(): TSerializedApiCallV2 {
    throw new NodeNotSupportedError()
  }
}

export default Nodle
