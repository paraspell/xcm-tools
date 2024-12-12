// Contains detailed structure of XCM call construction for Bifrost Parachain on Kusama

import { type IXTokensTransfer, Version, type TXTokensTransferOptions } from '../../types'
import { getNode } from '../../utils'
import ParachainNode from '../ParachainNode'

class BifrostKusama<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('BifrostKusama', 'bifrost', 'kusama', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>): TRes {
    return getNode<TApi, TRes, 'BifrostPolkadot'>('BifrostPolkadot').transferXTokens(input)
  }
}

export default BifrostKusama
