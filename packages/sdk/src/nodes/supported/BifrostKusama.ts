// Contains detailed structure of XCM call construction for Bifrost Parachain on Kusama

import type { TTransferReturn } from '../../types'
import { type IXTokensTransfer, Version, type XTokensTransferInput } from '../../types'
import { getNode } from '../../utils'
import ParachainNode from '../ParachainNode'

class BifrostKusama<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('BifrostKusama', 'bifrost', 'kusama', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: XTokensTransferInput<TApi, TRes>): TTransferReturn<TRes> {
    return getNode<TApi, TRes, 'BifrostPolkadot'>('BifrostPolkadot').transferXTokens(input)
  }
}

export default BifrostKusama
