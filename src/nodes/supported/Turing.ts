//Contains detailed structure of XCM call construction for Turing Parachain

import { IXTokensTransfer, XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Turing extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Turing', 'turing', 'kusama')
  }

  transferXTokens(input: XTokensTransferInput) {
    const { currencyID, fees } = input
    return XTokensTransferImpl.transferXTokens(input, currencyID, fees)
  }
}

export default Turing
