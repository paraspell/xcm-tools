//Contains detailed structure of XCM call construction for Ipci Parachain

import { IPolkadotXCMTransfer, PolkadotXCMTransferInput } from '../../types'
import { ScenarioNotSupportedError } from '../../errors/ScenarioNotSupportedError'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../PolkadotXCMTransferImpl'

class Ipci extends ParachainNode implements IPolkadotXCMTransfer {
  constructor() {
    super('Ipci', 'ipci', 'kusama')
  }

  transferPolkadotXCM(input: PolkadotXCMTransferInput) {
    // UNTESTED, ONLY HAS CHANNELS W ROBONOMICS & 0 TRANSACTIONS
    if (input.scenario == 'ParaToPara') {
      return PolkadotXCMTransferImpl.transferPolkadotXCM(input, 'reserveTransferAssets')
    }
    throw new ScenarioNotSupportedError(this.node, input.scenario)
  }
}

export default Ipci
