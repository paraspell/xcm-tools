//Contains detailed structure of XCM call construction for Statemint Parachain

import { IPolkadotXCMTransfer, PolkadotXCMTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../PolkadotXCMTransferImpl'

class Statemint extends ParachainNode implements IPolkadotXCMTransfer {
  constructor() {
    super('Statemint', 'statemint', 'polkadot')
  }

  transferPolkadotXCM(input: PolkadotXCMTransferInput) {
    // TESTED https://polkadot.subscan.io/xcm_message/polkadot-e4cdf1c59ffbb3d504adbc893d6b7d72665e484d
    // TESTED https://polkadot.subscan.io/xcm_message/polkadot-c01158ff1a5c5a596138ed9d0f0f2bccc1d9c51d
    const method =
      input.scenario === 'ParaToPara' ? 'limitedReserveTransferAssets' : 'limitedTeleportAssets'
    return PolkadotXCMTransferImpl.transferPolkadotXCM(input, method, 'Unlimited')
  }
}

export default Statemint
