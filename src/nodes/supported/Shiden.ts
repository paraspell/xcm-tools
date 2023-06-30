// Contains detailed structure of XCM call construction for Shiden Parachain

import { IPolkadotXCMTransfer, PolkadotXCMTransferInput, Version } from '../../types'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../PolkadotXCMTransferImpl'

class Shiden extends ParachainNode implements IPolkadotXCMTransfer {
  constructor() {
    super('Shiden', 'shiden', 'kusama', Version.V1)
  }

  transferPolkadotXCM(input: PolkadotXCMTransferInput) {
    // Same as Astar, works
    // https://shiden.subscan.io/xcm_message/kusama-97eb47c25c781affa557f36dbd117d49f7e1ab4e
    const method =
      input.scenario === 'ParaToPara' ? 'reserveTransferAssets' : 'reserveWithdrawAssets'
    return PolkadotXCMTransferImpl.transferPolkadotXCM(input, method)
  }
}

export default Shiden
