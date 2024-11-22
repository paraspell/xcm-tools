// Contains detailed structure of XCM call construction for ParallelHeiko Parachain

import { type IXTokensTransfer, Version, type XTokensTransferInput } from '../../types'
import { getNode } from '../../utils'
import ParachainNode from '../ParachainNode'

class ParallelHeiko<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('ParallelHeiko', 'heiko', 'kusama', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: XTokensTransferInput<TApi, TRes>): TRes {
    return getNode<TApi, TRes, 'Parallel'>('Parallel').transferXTokens(input)
  }
}

export default ParallelHeiko
