import { IPolkadotXCMTransfer, PolkadotXCMTransferInput } from '../../types'
import { ScenarioNotSupportedError } from '../../errors/ScenarioNotSupportedError'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../PolkadotXCMTransferImpl'

class Darwinia extends ParachainNode implements IPolkadotXCMTransfer {
  constructor() {
    super('Darwinia', 'darwinia', 'polkadot')
  }

  transferPolkadotXCM(input: PolkadotXCMTransferInput) {
    // TESTED https://polkadot.subscan.io/xcm_message/polkadot-55c5c36c8fe8794c8cfbea725c9f8bc5984c6b05
    if (input.scenario === 'ParaToPara') {
      return PolkadotXCMTransferImpl.transferPolkadotXCM(input, 'reserveTransferAssets')
    }
    throw new ScenarioNotSupportedError(this.node, input.scenario)
  }
}

export default Darwinia
