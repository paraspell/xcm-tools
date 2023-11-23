// Contains detailed structure of XCM call construction for AssetHubKusama Parachain

import {
  type IPolkadotXCMTransfer,
  type PolkadotXCMTransferInput,
  Version,
  type Extrinsic,
  type TSerializedApiCall
} from '../../types'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../PolkadotXCMTransferImpl'

class AssetHubKusama extends ParachainNode implements IPolkadotXCMTransfer {
  constructor() {
    super('AssetHubKusama', 'KusamaAssetHub', 'kusama', Version.V3)
  }

  transferPolkadotXCM(input: PolkadotXCMTransferInput): Extrinsic | TSerializedApiCall {
    // TESTED https://kusama.subscan.io/xcm_message/kusama-ddc2a48f0d8e0337832d7aae26f6c3053e1f4ffd
    // TESTED https://kusama.subscan.io/xcm_message/kusama-8e423130a4d8b61679af95dbea18a55124f99672
    return PolkadotXCMTransferImpl.transferPolkadotXCM(input, 'limitedTeleportAssets', 'Unlimited')
  }
}

export default AssetHubKusama
