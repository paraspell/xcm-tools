// Contains detailed structure of XCM call construction for Nodle Parachain

import {
  InvalidCurrencyError,
  NodeNotSupportedError,
  ScenarioNotSupportedError
} from '../../errors'
import type { IPolkadotXCMTransfer, PolkadotXCMTransferInput, TTransferReturn } from '../../types'
import { Version, type TSerializedApiCallV2 } from '../../types'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../polkadotXcm'

class Nodle<TApi, TRes> extends ParachainNode<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('Nodle', 'nodle', 'polkadot', Version.V3)
  }

  transferPolkadotXCM<TApi, TRes>(
    input: PolkadotXCMTransferInput<TApi, TRes>
  ): Promise<TTransferReturn<TRes>> {
    const { asset, scenario } = input

    if (scenario !== 'ParaToPara') {
      throw new ScenarioNotSupportedError(this.node, scenario)
    }

    if (asset.symbol !== this.getNativeAssetSymbol()) {
      throw new InvalidCurrencyError(`Asset ${asset.symbol} is not supported by node ${this.node}.`)
    }

    return Promise.resolve(
      PolkadotXCMTransferImpl.transferPolkadotXCM(
        input,
        'limited_reserve_transfer_assets',
        'Unlimited'
      )
    )
  }

  transferRelayToPara(): TSerializedApiCallV2 {
    throw new NodeNotSupportedError()
  }
}

export default Nodle
