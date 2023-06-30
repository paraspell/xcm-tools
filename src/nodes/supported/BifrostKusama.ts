// Contains detailed structure of XCM call construction for Bifrost Parachain on Kusama

import { IXTokensTransfer, Version, XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class BifrostKusama extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('BifrostKusama', 'bifrost', 'kusama', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput) {
    // Multiple asset options need addressing
    return XTokensTransferImpl.transferXTokens(input, { Token: input.currency })
  }
}

export default BifrostKusama
