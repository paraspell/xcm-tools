// Contains detailed structure of XCM call construction for Pendulum Parachain

import { InvalidCurrencyError, isForeignAsset } from '@paraspell/assets'

import { NodeNotSupportedError, ScenarioNotSupportedError } from '../../errors'
import XTokensTransferImpl from '../../pallets/xTokens'
import type { IXTokensTransfer, TXcmAsset, TXTokensTransferOptions } from '../../types'
import { type TSerializedApiCall, Version } from '../../types'
import ParachainNode from '../ParachainNode'

class Pendulum<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Pendulum', 'pendulum', 'polkadot', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { scenario, asset } = input

    if (scenario !== 'ParaToPara') {
      throw new ScenarioNotSupportedError(this.node, input.scenario)
    }

    if (asset.symbol !== this.getNativeAssetSymbol()) {
      throw new InvalidCurrencyError(`Asset ${asset.symbol} is not supported by node ${this.node}.`)
    }

    if (!isForeignAsset(asset)) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no assetId`)
    }

    const currencySelection: TXcmAsset = { XCM: Number(asset.assetId) }

    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }

  transferRelayToPara(): TSerializedApiCall {
    throw new NodeNotSupportedError()
  }
}

export default Pendulum
