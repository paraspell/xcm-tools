// Contains detailed structure of XCM call construction for Mythos Parachain

import {
  InvalidCurrencyError,
  NodeNotSupportedError,
  ScenarioNotSupportedError
} from '../../errors'
import {
  type IPolkadotXCMTransfer,
  type PolkadotXCMTransferInput,
  Version,
  type TSerializedApiCall
} from '../../types'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../polkadotXcm'

class Mythos<TApi, TRes> extends ParachainNode<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('Mythos', 'mythos', 'polkadot', Version.V3)
  }

  transferPolkadotXCM<TApi, TRes>(input: PolkadotXCMTransferInput<TApi, TRes>): Promise<TRes> {
    const { scenario, asset, destination } = input
    if (scenario !== 'ParaToPara') {
      throw new ScenarioNotSupportedError(this.node, scenario)
    }

    const nativeSymbol = this.getNativeAssetSymbol()
    if (asset.symbol !== nativeSymbol) {
      throw new InvalidCurrencyError(`Node ${this.node} does not support currency ${asset.symbol}`)
    }

    return Promise.resolve(
      PolkadotXCMTransferImpl.transferPolkadotXCM(
        input,
        destination === 'AssetHubPolkadot'
          ? 'limited_teleport_assets'
          : 'limited_reserve_transfer_assets',
        'Unlimited'
      )
    )
  }

  transferRelayToPara(): TSerializedApiCall {
    throw new NodeNotSupportedError()
  }
}

export default Mythos
