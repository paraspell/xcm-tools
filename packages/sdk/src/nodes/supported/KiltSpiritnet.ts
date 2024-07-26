// Contains detailed structure of XCM call construction for KiltSpiritnet Parachain

import { NodeNotSupportedError, ScenarioNotSupportedError } from '../../errors'
import {
  Version,
  type Extrinsic,
  type IPolkadotXCMTransfer,
  type PolkadotXCMTransferInput,
  type TSerializedApiCall
} from '../../types'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../PolkadotXCMTransferImpl'

class KiltSpiritnet extends ParachainNode implements IPolkadotXCMTransfer {
  constructor() {
    super('KiltSpiritnet', 'kilt', 'polkadot', Version.V2)
  }

  transferPolkadotXCM(input: PolkadotXCMTransferInput): Extrinsic | TSerializedApiCall {
    if (input.scenario !== 'ParaToPara') {
      throw new ScenarioNotSupportedError(this.node, input.scenario)
    }
    return PolkadotXCMTransferImpl.transferPolkadotXCM(input, 'reserveTransferAssets')
  }

  transferRelayToPara(): TSerializedApiCall {
    throw new NodeNotSupportedError()
  }
}

export default KiltSpiritnet
