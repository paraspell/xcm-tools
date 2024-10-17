// Contains detailed structure of XCM call construction for Encoiter Parachain

import {
  type IPolkadotXCMTransfer,
  type PolkadotXCMTransferInput,
  Version,
  type TSerializedApiCallV2,
  type TRelayToParaOptions
} from '../../types'
import { ScenarioNotSupportedError } from '../../errors/ScenarioNotSupportedError'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../polkadotXcm'
import { constructRelayToParaParameters } from '../../pallets/xcmPallet/utils'

class Encointer<TApi, TRes> extends ParachainNode<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('Encointer', 'encointer', 'kusama', Version.V3)
  }

  transferPolkadotXCM<TApi, TRes>(input: PolkadotXCMTransferInput<TApi, TRes>) {
    // NO PARA TO PARA SCENARIOS ON SUBSCAN
    // TESTED https://encointer.subscan.io/xcm_message/kusama-418501e86e947b16c4e4e9040694017e64f9b162
    if (input.scenario === 'ParaToRelay') {
      return PolkadotXCMTransferImpl.transferPolkadotXCM(
        input,
        'limited_teleport_assets',
        'Unlimited'
      )
    }
    throw new ScenarioNotSupportedError(this.node, input.scenario)
  }

  transferRelayToPara(options: TRelayToParaOptions<TApi, TRes>): TSerializedApiCallV2 {
    const { version = Version.V1 } = options
    return {
      module: 'XcmPallet',
      section: 'limited_teleport_assets',
      parameters: constructRelayToParaParameters(options, version, true)
    }
  }
}

export default Encointer
