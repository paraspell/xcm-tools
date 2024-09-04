// Contains detailed structure of XCM call construction for Turing Parachain

import { type IXTokensTransfer, Version, type XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../xTokens'

class Turing extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Turing', 'turing', 'kusama', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput) {
    const { currencyID } = input
    return XTokensTransferImpl.transferXTokens(input, currencyID)
  }
}

export default Turing
