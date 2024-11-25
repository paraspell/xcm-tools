// Contains detailed structure of XCM call construction for Karura Parachain

import { type IXTokensTransfer, Version, type TXTokensTransferOptions } from '../../types'
import { getNode } from '../../utils'
import { getNodeProviders } from '../config'
import ParachainNode from '../ParachainNode'

class Karura<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Karura', 'karura', 'kusama', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>): TRes {
    return getNode<TApi, TRes, 'Acala'>('Acala').transferXTokens(input)
  }

  getProvider(): string {
    // Return the second WebSocket URL because the first one is sometimes unreliable.
    return getNodeProviders(this.node)[4]
  }
}

export default Karura
