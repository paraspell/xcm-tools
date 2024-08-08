// Contains detailed structure of XCM call construction for Karura Parachain

import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type Extrinsic,
  type TSerializedApiCall,
  type TNodePolkadotKusama
} from '../../types'
import { getAllNodeProviders, getNode } from '../../utils'
import ParachainNode from '../ParachainNode'

class Karura extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Karura', 'karura', 'kusama', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput): Extrinsic | TSerializedApiCall {
    return getNode('Acala').transferXTokens(input)
  }

  getProvider(): string {
    // Return the second WebSocket URL because the first one is sometimes unreliable.
    return getAllNodeProviders(this.node as TNodePolkadotKusama)[1]
  }
}

export default Karura
