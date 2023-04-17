import { IPolkadotXCMTransfer, PolkadotXCMTransferInput } from '../../types'
import { ScenarioNotSupportedError } from '../../errors/ScenarioNotSupportedError'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../PolkadotXCMTransferImpl'

class Encointer extends ParachainNode implements IPolkadotXCMTransfer {
  constructor() {
    super('Encointer', 'encointer', 'kusama')
  }

  transferPolkadotXCM(input: PolkadotXCMTransferInput) {
    // NO PARA TO PARA SCENARIOS ON SUBSCAN
    // TESTED https://encointer.subscan.io/xcm_message/kusama-418501e86e947b16c4e4e9040694017e64f9b162
    if (input.scenario === 'ParaToRelay') {
      return PolkadotXCMTransferImpl.transferPolkadotXCM(
        input,
        'limitedTeleportAssets',
        'Unlimited'
      )
    }
    throw new ScenarioNotSupportedError(this.node, input.scenario)
  }
}

export default Encointer
