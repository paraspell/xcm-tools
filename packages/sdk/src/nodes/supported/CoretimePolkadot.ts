// Contains detailed structure of XCM call construction for CoretimePolkadot Parachain

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

class CoretimePolkadot<TApi, TRes>
  extends ParachainNode<TApi, TRes>
  implements IPolkadotXCMTransfer
{
  constructor() {
    super('CoretimePolkadot', 'polkadotCoretime', 'polkadot', Version.V3)
  }

  _assetCheckEnabled = false

  transferPolkadotXCM<TApi, TRes>(input: PolkadotXCMTransferInput<TApi, TRes>): Promise<TRes> {
    const { scenario } = input
    const section =
      scenario === 'ParaToPara' ? 'limited_reserve_transfer_assets' : 'limited_teleport_assets'
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

export default CoretimePolkadot
