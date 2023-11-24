// Contains detailed structure of XCM call construction for Crab Parachain

import {
  type IPolkadotXCMTransfer,
  type PolkadotXCMTransferInput,
  Version,
  type Extrinsic,
  type TSerializedApiCall
} from '../../types'
import { ScenarioNotSupportedError } from '../../errors/ScenarioNotSupportedError'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../PolkadotXCMTransferImpl'
import { NodeNotSupportedError } from '../../errors'

class Crab extends ParachainNode implements IPolkadotXCMTransfer {
  constructor() {
    super('Crab', 'crab', 'kusama', Version.V3)
  }

  transferPolkadotXCM(input: PolkadotXCMTransferInput): Extrinsic | TSerializedApiCall {
    // TESTED https://kusama.subscan.io/xcm_message/kusama-ce7396ec470ba0c6516a50075046ee65464572dc
    if (input.scenario === 'ParaToPara') {
      return PolkadotXCMTransferImpl.transferPolkadotXCM(input, 'reserveTransferAssets')
    }
    throw new ScenarioNotSupportedError(this.node, input.scenario)
  }

  transferRelayToPara(): TSerializedApiCall {
    throw new NodeNotSupportedError()
  }
}

export default Crab
