// Contains detailed structure of XCM call construction for AssetHubKusama Parachain

import { constructRelayToParaParameters } from '../../pallets/xcmPallet/utils'
import {
  type IPolkadotXCMTransfer,
  type PolkadotXCMTransferInput,
  Version,
  type TSerializedApiCall,
  type TRelayToParaInternalOptions
} from '../../types'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../PolkadotXCMTransferImpl'

class CoretimeKusama extends ParachainNode implements IPolkadotXCMTransfer {
  constructor() {
    super('CoretimeKusama', 'kusamaCoretime', 'kusama', Version.V3)
  }

  _assetCheckEnabled = false

  transferPolkadotXCM(input: PolkadotXCMTransferInput) {
    // TESTED block hash on Rococo: 0x78ace0f1bf7cac9a42e56143321b617d98327e2750f795efb0abb833025c9082
    const { scenario } = input
    const method =
      scenario === 'ParaToPara' ? 'limitedReserveTransferAssets' : 'limitedTeleportAssets'
    return PolkadotXCMTransferImpl.transferPolkadotXCM(input, method, 'Unlimited')
  }

  transferRelayToPara(options: TRelayToParaInternalOptions): TSerializedApiCall {
    // TESTED block hash on Rococo: 0x28929f7b2aeadbf3333f05d35bed18214a4b23dd270bd072f99e8a0131d22456
    // https://rococo.subscan.io/extrinsic/0x469eec7dccb22696b0c95cf4f5eec4b367ad3dc23243a346cc2aad3cc9522800
    const { version = Version.V3 } = options
    return {
      module: 'xcmPallet',
      section: 'limitedTeleportAssets',
      parameters: constructRelayToParaParameters(options, version, true)
    }
  }
}

export default CoretimeKusama
