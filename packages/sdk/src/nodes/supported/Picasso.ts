// Contains detailed structure of XCM call construction for Picasso Parachain

import { type IXTokensTransfer, Version, type XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Picasso extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Picasso', 'picasso', 'kusama', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput) {
    const { currencyID } = input
    return XTokensTransferImpl.transferXTokens(input, currencyID)
  }
}

export default Picasso
