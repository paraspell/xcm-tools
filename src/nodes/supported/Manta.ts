// Contains detailed structure of XCM call construction for Manta Parachain

import { IXTokensTransfer, Version, XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Manta extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Manta', 'manta', 'polkadot', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput) {
    return XTokensTransferImpl.transferXTokens(input, { ForeignAssetId: input.currencyID })
  }
}

export default Manta
