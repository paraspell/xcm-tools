// Contains detailed structure of XCM call construction for Genshiro Parachain

import { InvalidCurrencyError } from '../../errors'
import {
  type IPolkadotXCMTransfer,
  type PolkadotXCMTransferInput,
  Version,
  type Extrinsic,
  type TSerializedApiCall
} from '../../types'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../PolkadotXCMTransferImpl'

class Genshiro extends ParachainNode implements IPolkadotXCMTransfer {
  constructor() {
    super('Genshiro', 'Genshiro', 'kusama', Version.V3)
  }

  transferPolkadotXCM(input: PolkadotXCMTransferInput): Extrinsic | TSerializedApiCall {
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
