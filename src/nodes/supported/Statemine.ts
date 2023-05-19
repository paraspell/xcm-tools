//Contains detailed structure of XCM call construction for Statemine Parachain

import { IPolkadotXCMTransfer, PolkadotXCMTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../PolkadotXCMTransferImpl'

class Statemine extends ParachainNode implements IPolkadotXCMTransfer {
  constructor() {
    super('Statemine', 'statemine', 'kusama')
  }

  transferPolkadotXCM(input: PolkadotXCMTransferInput) {
    // TESTED https://kusama.subscan.io/xcm_message/kusama-ddc2a48f0d8e0337832d7aae26f6c3053e1f4ffd
    // TESTED https://kusama.subscan.io/xcm_message/kusama-8e423130a4d8b61679af95dbea18a55124f99672
    const method =
      input.scenario === 'ParaToPara' ? 'limitedReserveTransferAssets' : 'limitedTeleportAssets'
    return PolkadotXCMTransferImpl.transferPolkadotXCM(input, method, 'Unlimited')
  }
}

export default Statemine
