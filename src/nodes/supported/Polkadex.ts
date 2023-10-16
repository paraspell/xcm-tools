// Contains detailed structure of XCM call construction for Polkadex Parachain

import { IXTokensTransfer, Version, XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Polkadex extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Polkadex', 'polkadex', 'polkadot', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput) {
    return XTokensTransferImpl.transferXTokens(input, input.currencyID)
  }
}

export default Polkadex
