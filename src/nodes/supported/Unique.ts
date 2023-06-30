// Contains detailed structure of XCM call construction for Unique Parachain

import { IXTokensTransfer, Version, XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Unique extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Unique', 'unique', 'polkadot', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput) {
    return XTokensTransferImpl.transferXTokens(input, { ForeignAssetId: input.currencyID })
  }
}

export default Unique
