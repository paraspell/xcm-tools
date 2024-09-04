// Contains detailed structure of XCM call construction for OriginTrail Parachain

import { type IPolkadotXCMTransfer, type PolkadotXCMTransferInput, Version } from '../../types'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../polkadotXcm'

class NeuroWeb extends ParachainNode implements IPolkadotXCMTransfer {
  constructor() {
    super('NeuroWeb', 'neuroweb', 'polkadot', Version.V3)
  }

  transferPolkadotXCM(input: PolkadotXCMTransferInput) {
    return PolkadotXCMTransferImpl.transferPolkadotXCM(
      input,
      'limitedReserveTransferAssets',
      'Unlimited'
    )
  }
}

export default NeuroWeb
