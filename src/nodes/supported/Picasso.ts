//Contains detailed structure of XCM call construction for Picasso Parachain

import { IXTokensTransfer, XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Picasso extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Picasso', 'picasso', 'kusama')
  }

  transferXTokens(input: XTokensTransferInput) {
    return XTokensTransferImpl.transferXTokens(input, input.currencyID)
  }
}

export default Picasso
