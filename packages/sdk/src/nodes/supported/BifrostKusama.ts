// Contains detailed structure of XCM call construction for Bifrost Parachain on Kusama

import { type IXTokensTransfer, Version, type XTokensTransferInput } from '../../types'
import { getNode } from '../../utils'
import ParachainNode from '../ParachainNode'

class BifrostKusama extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('BifrostKusama', 'bifrost', 'kusama', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput) {
    return getNode('BifrostPolkadot').transferXTokens(input)
  }
}

export default BifrostKusama
