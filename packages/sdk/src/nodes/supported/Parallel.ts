// Contains detailed structure of XCM call construction for Parallel Parachain

import type { TNodePolkadotKusama } from '../../types'
import { type IXTokensTransfer, Version, type XTokensTransferInput } from '../../types'
import { getAllNodeProviders } from '../../utils'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../xTokens'

class Parallel<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Parallel', 'parallel', 'polkadot', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: XTokensTransferInput<TApi, TRes>) {
    const { currencyID } = input
    return XTokensTransferImpl.transferXTokens(input, currencyID)
  }

  getProvider(): string {
    // Return the second WebSocket URL because the first one is sometimes unreliable.
    return getAllNodeProviders(this.node as TNodePolkadotKusama)[1]
  }
}

export default Parallel
