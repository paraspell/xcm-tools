// Contains detailed structure of XCM call construction for Litmus Parachain

import type { TTransferReturn } from '../../types'
import { type IXTokensTransfer, Version, type XTokensTransferInput } from '../../types'
import { getNode } from '../../utils'
import ParachainNode from '../ParachainNode'

class Litmus<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Litmus', 'litmus', 'kusama', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: XTokensTransferInput<TApi, TRes>): TTransferReturn<TRes> {
    // Multiple asset options needs addressing
    return getNode<TApi, TRes, 'Litentry'>('Litentry').transferXTokens(input)
  }

  getProvider(): string {
    return 'wss:///rpc.litmus-parachain.litentry.io'
  }
}

export default Litmus
