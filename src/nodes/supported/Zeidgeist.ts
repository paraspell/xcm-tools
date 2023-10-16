// Contains detailed structure of XCM call construction for Zeidgeist Parachain

import { IXTokensTransfer, Version, XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Zeidgeist extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Zeidgeist', 'zeitgeist', 'polkadot', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput) {
    return XTokensTransferImpl.transferXTokens(input, { ForeignAsset: input.currencyID })
  }
}

export default Zeidgeist
