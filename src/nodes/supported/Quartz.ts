// Contains detailed structure of XCM call construction for Quartz Parachain

import { IPolkadotXCMTransfer, PolkadotXCMTransferInput, Version } from '../../types'
import { ScenarioNotSupportedError } from '../../errors/ScenarioNotSupportedError'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../PolkadotXCMTransferImpl'

class Quartz extends ParachainNode implements IPolkadotXCMTransfer {
  constructor() {
    super('Quartz', 'quartz', 'kusama', Version.V1)
  }

  transferPolkadotXCM(input: PolkadotXCMTransferInput) {
    // TESTED https://quartz.subscan.io/xcm_message/kusama-f5b6580f8d7f97a8d33209d2b5b34d97454587e9
    if (input.scenario === 'ParaToPara') {
      return PolkadotXCMTransferImpl.transferPolkadotXCM(input, 'reserveTransferAssets')
    }
    throw new ScenarioNotSupportedError(this.node, input.scenario)
  }
}

export default Quartz
