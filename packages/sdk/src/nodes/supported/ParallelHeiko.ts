// Contains detailed structure of XCM call construction for ParallelHeiko Parachain

import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type Extrinsic,
  type TSerializedApiCall
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class ParallelHeiko extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('ParallelHeiko', 'heiko', 'kusama', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput): Extrinsic | TSerializedApiCall {
    return XTokensTransferImpl.transferXTokens(input, input.currencyID)
  }
}

export default ParallelHeiko
