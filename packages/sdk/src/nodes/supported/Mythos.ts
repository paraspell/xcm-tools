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
import PolkadotXCMTransferImpl from '../PolkadotXCMTransferImpl'

class Mythos extends ParachainNode implements IPolkadotXCMTransfer {
  constructor() {
    super('Mythos', 'mythos', 'polkadot', Version.V3)
  }

  transferPolkadotXCM(input: PolkadotXCMTransferInput) {
    const { scenario, currencySymbol, destination } = input
    if (scenario !== 'ParaToPara') {
      throw new ScenarioNotSupportedError(this.node, scenario)
    }

    const nativeSymbol = this.getNativeAssetSymbol()
    if (currencySymbol !== nativeSymbol) {
      throw new InvalidCurrencyError(
        `Node ${this.node} does not support currency ${currencySymbol}`
      )
    }

    return PolkadotXCMTransferImpl.transferPolkadotXCM(
      input,
      destination === 'AssetHubPolkadot' ? 'limitedTeleportAssets' : 'limitedReserveTransferAssets',
      'Unlimited'
    )
  }

  transferRelayToPara(): TSerializedApiCall {
    throw new NodeNotSupportedError()
  }
}

export default Mythos
