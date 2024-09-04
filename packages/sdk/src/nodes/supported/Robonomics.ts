// Contains detailed structure of XCM call construction for Robonomics Parachain

import { type IPolkadotXCMTransfer, type PolkadotXCMTransferInput, Version } from '../../types'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../polkadotXcm'

class Robonomics extends ParachainNode implements IPolkadotXCMTransfer {
  constructor() {
    super('Robonomics', 'robonomics', 'kusama', Version.V1)
  }

  private static readonly FEE = '400000000'

  transferPolkadotXCM(input: PolkadotXCMTransferInput) {
    if (input.scenario === 'ParaToPara') {
      return PolkadotXCMTransferImpl.transferPolkadotXCM(input, 'limitedReserveTransferAssets', {
        Limited: Robonomics.FEE
      })
    }
    return PolkadotXCMTransferImpl.transferPolkadotXCM(input, 'reserveWithdrawAssets')
  }
}

export default Robonomics
