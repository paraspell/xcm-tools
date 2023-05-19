//Contains detailed structure of XCM call construction for Mangata Parachain

import { IXTokensTransfer, XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Mangata extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Mangata', 'mangata', 'kusama')
  }

  transferXTokens(input: XTokensTransferInput) {
    return XTokensTransferImpl.transferXTokens(input, input.currencyID)
  }
}

export default Mangata
