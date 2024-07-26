// Contains detailed structure of XCM call construction for Mythos Parachain

import {
  InvalidCurrencyError,
  NodeNotSupportedError,
  ScenarioNotSupportedError
} from '../../errors'
import { getNativeAssetSymbol } from '../../pallets/assets'
import {
  type IPolkadotXCMTransfer,
  type PolkadotXCMTransferInput,
  Version,
  type Extrinsic,
  type TSerializedApiCall
} from '../../types'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../PolkadotXCMTransferImpl'

class Mythos extends ParachainNode implements IPolkadotXCMTransfer {
  constructor() {
    super('Mythos', 'mythos', 'polkadot', Version.V3)
  }

  transferPolkadotXCM(input: PolkadotXCMTransferInput): Extrinsic | TSerializedApiCall {
    const { scenario, currencySymbol } = input
    if (scenario !== 'ParaToPara') {
      throw new ScenarioNotSupportedError(this.node, scenario)
    }

    const nativeSymbol = getNativeAssetSymbol(this.node)
    if (currencySymbol !== nativeSymbol) {
      throw new InvalidCurrencyError(
        `Node ${this.node} does not support currency ${currencySymbol}`
      )
    }

    return PolkadotXCMTransferImpl.transferPolkadotXCM(
      input,
      'limitedReserveTransferAssets',
      'Unlimited'
    )
  }

  transferRelayToPara(): TSerializedApiCall {
    throw new NodeNotSupportedError()
  }
}

export default Mythos
