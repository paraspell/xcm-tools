// Contains detailed structure of XCM call construction for Basilisk Parachain

import { IXTokensTransfer, Version, XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Basilisk extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Basilisk', 'basilisk', 'kusama', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput) {
    const { currencyID } = input
    return XTokensTransferImpl.transferXTokens(input, currencyID)
  }
}

export default Basilisk
