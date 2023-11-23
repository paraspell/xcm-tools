// Contains detailed structure of XCM call construction for Statemint Parachain

import {
  type IPolkadotXCMTransfer,
  type PolkadotXCMTransferInput,
  Version,
  type Extrinsic,
  type TSerializedApiCall
} from '../../types'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../PolkadotXCMTransferImpl'

class AssetHubPolkadot extends ParachainNode implements IPolkadotXCMTransfer {
  constructor() {
    super('AssetHubPolkadot', 'PolkadotAssetHub', 'polkadot', Version.V3)
  }

  transferPolkadotXCM(input: PolkadotXCMTransferInput): Extrinsic | TSerializedApiCall {
    // TESTED https://polkadot.subscan.io/xcm_message/polkadot-e4cdf1c59ffbb3d504adbc893d6b7d72665e484d
    // TESTED https://polkadot.subscan.io/xcm_message/polkadot-c01158ff1a5c5a596138ed9d0f0f2bccc1d9c51d
    return PolkadotXCMTransferImpl.transferPolkadotXCM(input, 'limitedTeleportAssets', 'Unlimited')
  }
}

export default AssetHubPolkadot
