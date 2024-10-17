// Contains detailed structure of XCM call construction for Basilisk Parachain

import {
  type IXTokensTransfer,
  type TNodePolkadotKusama,
  Version,
  type XTokensTransferInput
} from '../../types'
import { getAllNodeProviders } from '../../utils'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../xTokens'

class Basilisk<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Basilisk', 'basilisk', 'kusama', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: XTokensTransferInput<TApi, TRes>) {
    const { currencyID } = input
    return XTokensTransferImpl.transferXTokens(input, currencyID)
  }

  getProvider(): string {
    // Prefer Dwellir RPC endpoint
    return getAllNodeProviders(this.node as TNodePolkadotKusama)[1]
  }
}

export default Basilisk
