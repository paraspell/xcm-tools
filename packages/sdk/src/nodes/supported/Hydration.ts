// Contains detailed structure of XCM call construction for Hydration Parachain

import { type IXTokensTransfer, Version, type XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Hydration extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Hydration', 'hydradx', 'polkadot', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput) {
    const { currencyID } = input
    return XTokensTransferImpl.transferXTokens(input, currencyID)
  }
}

export default Hydration
