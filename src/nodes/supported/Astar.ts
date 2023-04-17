import { IPolkadotXCMTransfer, PolkadotXCMTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../PolkadotXCMTransferImpl'

class Astar extends ParachainNode implements IPolkadotXCMTransfer {
  constructor() {
    super('Astar', 'astar', 'polkadot')
  }

  transferPolkadotXCM(input: PolkadotXCMTransferInput) {
    // TESTED https://polkadot.subscan.io/xcm_message/polkadot-f2b697df74ebe4b62853fe81b8b7d0522464972d
    const method =
      input.scenario === 'ParaToPara' ? 'reserveTransferAssets' : 'reserveWithdrawAssets'
    return PolkadotXCMTransferImpl.transferPolkadotXCM(input, method)
  }
}

export default Astar
