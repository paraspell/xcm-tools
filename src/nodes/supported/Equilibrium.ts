// Contains detailed structure of XCM call construction for Equilibrium Parachain

import { IPolkadotXCMTransfer, PolkadotXCMTransferInput, Version } from '../../types'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../PolkadotXCMTransferImpl'

class Equilibrium extends ParachainNode implements IPolkadotXCMTransfer {
  constructor() {
    super('Equilibrium', 'equilibrium', 'polkadot', Version.V3)
  }

  transferPolkadotXCM(input: PolkadotXCMTransferInput) {
    // UNTESTED AS 0 TX HAVE BEEN DONE FROM PARACHAIN ONLY TO PARACHAIN
    return PolkadotXCMTransferImpl.transferPolkadotXCM(input, 'reserveTransferAssets')
  }
}

export default Equilibrium
