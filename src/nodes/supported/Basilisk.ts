// Contains detailed structure of XCM call construction for Basilisk Parachain

import { IXTokensTransfer, Version, XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Basilisk extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Basilisk', 'basilisk', 'kusama', Version.V1)
  }

  transferXTokens(input: XTokensTransferInput) {
    const { currencyID, fees } = input
    return XTokensTransferImpl.transferXTokens(input, currencyID, fees)
  }
}

export default Basilisk
