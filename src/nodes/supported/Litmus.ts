// Contains detailed structure of XCM call construction for Litmus Parachain

import { IXTokensTransfer, Version, XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Litmus extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Litmus', 'litmus', 'kusama', Version.V1)
  }

  transferXTokens(input: XTokensTransferInput) {
    // Multiple asset options needs addressing
    return XTokensTransferImpl.transferXTokens(input, 'SelfReserve')
  }
}

export default Litmus
