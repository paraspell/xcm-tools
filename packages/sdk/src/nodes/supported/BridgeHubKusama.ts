// Contains detailed structure of XCM call construction for BridgeHubKusama Parachain

import { ScenarioNotSupportedError } from '../../errors'
import { constructRelayToParaParameters } from '../../pallets/xcmPallet/utils'
import {
  type IPolkadotXCMTransfer,
  type PolkadotXCMTransferInput,
  Version,
  type TSerializedApiCall,
  type TRelayToParaInternalOptions
} from '../../types'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../polkadotXcm'

class BridgeHubKusama extends ParachainNode implements IPolkadotXCMTransfer {
  constructor() {
    super('BridgeHubKusama', 'kusamaBridgeHub', 'kusama', Version.V3)
  }

  _assetCheckEnabled = false

  transferPolkadotXCM(input: PolkadotXCMTransferInput) {
    const { scenario } = input
    if (scenario === 'ParaToPara') {
      throw new ScenarioNotSupportedError(
        this.node,
        scenario,
        'Unable to use bridge hub for transfers to other Parachains. Please move your currency to AssetHub to transfer to other Parachains.'
      )
    }
    const section = 'limitedTeleportAssets'
    return PolkadotXCMTransferImpl.transferPolkadotXCM(input, section, 'Unlimited')
  }

  transferRelayToPara(options: TRelayToParaInternalOptions): TSerializedApiCall {
    const { version = Version.V3 } = options
    return {
      module: 'xcmPallet',
      section: 'limitedTeleportAssets',
      parameters: constructRelayToParaParameters(options, version, true)
    }
  }
}

export default BridgeHubKusama
