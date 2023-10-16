// Contains detailed structure of XCM call construction for Genshiro Parachain

import { InvalidCurrencyError } from '../../errors'
import { IPolkadotXCMTransfer, PolkadotXCMTransferInput, Version } from '../../types'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../PolkadotXCMTransferImpl'

class Genshiro extends ParachainNode implements IPolkadotXCMTransfer {
  constructor() {
    super('Genshiro', 'Genshiro', 'kusama', Version.V3)
  }

  transferPolkadotXCM(input: PolkadotXCMTransferInput) {
    if (input.scenario === 'ParaToPara' && input.currencySymbol !== 'GENS') {
      throw new InvalidCurrencyError(
        `Node ${this.node} does not support currency ${input.currencySymbol}`
      )
    }
    return PolkadotXCMTransferImpl.transferPolkadotXCM(
      input,
      'limitedReserveTransferAssets',
      'Unlimited'
    )
  }
}

export default Genshiro
