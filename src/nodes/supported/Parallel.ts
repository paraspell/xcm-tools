// Contains detailed structure of XCM call construction for Parallel Parachain

import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type Extrinsic,
  type TSerializedApiCall
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Parallel extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Parallel', 'parallel', 'polkadot', Version.V1)
  }

  transferXTokens(input: XTokensTransferInput): Extrinsic | TSerializedApiCall {
    return XTokensTransferImpl.transferXTokens(input, input.currencyID)
  }
}

export default Parallel
