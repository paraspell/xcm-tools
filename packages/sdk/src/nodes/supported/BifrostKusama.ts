// Contains detailed structure of XCM call construction for Bifrost Parachain on Kusama

import { type IXTokensTransfer, Version, type TXTokensTransferOptions } from '../../types'
import { getNode } from '../../utils'
import { getNodeProviders } from '../config'
import ParachainNode from '../ParachainNode'

class BifrostKusama<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('BifrostKusama', 'bifrost', 'kusama', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>): TRes {
    return getNode<TApi, TRes, 'BifrostPolkadot'>('BifrostPolkadot').transferXTokens(input)
  }

  getProvider(): string {
    // Return the second WebSocket URL because the first one is sometimes unreliable.
    return getNodeProviders(this.node)[1]
  }
}

export default BifrostKusama
