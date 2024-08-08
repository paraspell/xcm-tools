// Contains detailed structure of XCM call construction for Polkadex Parachain

import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type Extrinsic,
  type TSerializedApiCall,
  type TNodePolkadotKusama
} from '../../types'
import { getAllNodeProviders } from '../../utils'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Polkadex extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Polkadex', 'polkadex', 'polkadot', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput): Extrinsic | TSerializedApiCall {
    const { currencyID } = input
    return XTokensTransferImpl.transferXTokens(input, currencyID)
  }

  getProvider(): string {
    return getAllNodeProviders(this.node as TNodePolkadotKusama)[1]
  }
}

export default Polkadex
