// Contains detailed structure of XCM call construction for Polkadex Parachain

import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type Extrinsic,
  type TSerializedApiCall
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Polkadex extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Polkadex', 'polkadex', 'polkadot', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput): Extrinsic | TSerializedApiCall {
    return XTokensTransferImpl.transferXTokens(input, input.currencyID)
  }
}

export default Polkadex
