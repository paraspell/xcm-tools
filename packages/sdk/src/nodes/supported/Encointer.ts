// Contains detailed structure of XCM call construction for Encoiter Parachain

import {
  type IPolkadotXCMTransfer,
  type PolkadotXCMTransferInput,
  Version,
  type TSerializedApiCall,
  type TRelayToParaInternalOptions
} from '../../types'
import { ScenarioNotSupportedError } from '../../errors/ScenarioNotSupportedError'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../PolkadotXCMTransferImpl'
import { constructRelayToParaParameters } from '../../pallets/xcmPallet/utils'

class Encointer extends ParachainNode implements IPolkadotXCMTransfer {
  constructor() {
    super('Encointer', 'encointer', 'kusama', Version.V3)
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

  transferRelayToPara(options: TRelayToParaInternalOptions): TSerializedApiCall {
    const { version = Version.V1 } = options
    return {
      module: 'xcmPallet',
      section: 'limitedTeleportAssets',
      parameters: constructRelayToParaParameters(options, version, true)
    }
  }
}

export default Encointer
