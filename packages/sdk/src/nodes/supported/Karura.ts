// Contains detailed structure of XCM call construction for Karura Parachain

import type { TTransferReturn } from '../../types'
import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type TNodePolkadotKusama
} from '../../types'
import { getAllNodeProviders, getNode } from '../../utils'
import ParachainNode from '../ParachainNode'

class Karura<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Karura', 'karura', 'kusama', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: XTokensTransferInput<TApi, TRes>): TTransferReturn<TRes> {
    return getNode<TApi, TRes, 'Acala'>('Acala').transferXTokens(input)
  }

  getProvider(): string {
    // Return the second WebSocket URL because the first one is sometimes unreliable.
    return getAllNodeProviders(this.node as TNodePolkadotKusama)[4]
  }
}

export default Karura
