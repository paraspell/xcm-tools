// Contains detailed structure of XCM call construction for CoretimePolkadot Parachain

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

class CoretimePolkadot extends ParachainNode implements IPolkadotXCMTransfer {
  constructor() {
    super('CoretimePolkadot', 'polkadotCoretime', 'polkadot', Version.V3)
  }

  _assetCheckEnabled = false

  transferPolkadotXCM(input: PolkadotXCMTransferInput) {
    const { scenario } = input
    const section =
      scenario === 'ParaToPara' ? 'limitedReserveTransferAssets' : 'limitedTeleportAssets'
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

  getProvider(): string {
    // TODO: Temporary solution, will be solved after updating @polkadot/apps-config package
    return 'wss://polkadot-coretime-rpc.polkadot.io'
  }
}

export default CoretimePolkadot
