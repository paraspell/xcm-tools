// Contains detailed structure of XCM call construction for HydraDX Parachain

import { IXTokensTransfer, Version, XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class HydraDX extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('HydraDX', 'hydra', 'polkadot', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput) {
    const { currencyID, fees } = input
    return XTokensTransferImpl.transferXTokens(input, currencyID, fees)
  }
}

export default HydraDX
