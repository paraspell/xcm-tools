// Contains detailed structure of XCM call construction for Integritee Parachain

import { IXTokensTransfer, Version, XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Integritee extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Integritee', 'integritee', 'kusama', Version.V1)
  }

  transferXTokens(input: XTokensTransferInput) {
    return XTokensTransferImpl.transferXTokens(input, input.currency)
  }
}

export default Integritee
