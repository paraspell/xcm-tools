// Contains detailed structure of XCM call construction for Litmus Parachain

import { type IXTokensTransfer, Version, type XTokensTransferInput } from '../../types'
import { getNode } from '../../utils'
import ParachainNode from '../ParachainNode'

class Litmus extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Litmus', 'litmus', 'kusama', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput) {
    // Multiple asset options needs addressing
    return getNode('Litentry').transferXTokens(input)
  }

  getProvider(): string {
    return 'wss:///rpc.litmus-parachain.litentry.io'
  }
}

export default Litmus
