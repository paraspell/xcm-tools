// Contains detailed structure of XCM call construction for OriginTrail Parachain

import {
  type IPolkadotXCMTransfer,
  type PolkadotXCMTransferInput,
  Version,
  type Extrinsic,
  type TSerializedApiCall
} from '../../types'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../PolkadotXCMTransferImpl'

class OriginTrail extends ParachainNode implements IPolkadotXCMTransfer {
  constructor() {
    super('OriginTrail', 'origintrail-parachain', 'polkadot', Version.V3)
  }

  transferPolkadotXCM(input: PolkadotXCMTransferInput): Extrinsic | TSerializedApiCall {
    return PolkadotXCMTransferImpl.transferPolkadotXCM(
      input,
      'limitedReserveTransferAssets',
      'Unlimited'
    )
  }
}

export default OriginTrail
