// Contains detailed structure of XCM call construction for BridgeHubKusama Parachain

import { ScenarioNotSupportedError } from '../../errors'
import { constructRelayToParaParameters } from '../../pallets/xcmPallet/utils'
import {
  type IPolkadotXCMTransfer,
  type PolkadotXCMTransferInput,
  Version,
  type TSerializedApiCall,
  type TRelayToParaOptions
} from '../../types'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../polkadotXcm'

class BridgeHubKusama<TApi, TRes>
  extends ParachainNode<TApi, TRes>
  implements IPolkadotXCMTransfer
{
  constructor() {
    super('BridgeHubKusama', 'kusamaBridgeHub', 'kusama', Version.V3)
  }

  _assetCheckEnabled = false

  transferPolkadotXCM<TApi, TRes>(input: PolkadotXCMTransferInput<TApi, TRes>): Promise<TRes> {
    const { scenario } = input
    if (scenario === 'ParaToPara') {
      throw new ScenarioNotSupportedError(
        this.node,
        scenario,
        'Unable to use bridge hub for transfers to other Parachains. Please move your currency to AssetHub to transfer to other Parachains.'
      )
    }
    const section = 'limited_teleport_assets'
    return Promise.resolve(PolkadotXCMTransferImpl.transferPolkadotXCM(input, section, 'Unlimited'))
  }

  transferRelayToPara(options: TRelayToParaOptions<TApi, TRes>): TSerializedApiCall {
    const { version = Version.V3 } = options
    return {
      module: 'XcmPallet',
      section: 'limited_teleport_assets',
      parameters: constructRelayToParaParameters(options, version, true)
    }
  }
}

export default BridgeHubKusama
