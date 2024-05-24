// Contains detailed structure of XCM call construction for Litmus Parachain

import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type Extrinsic,
  type TSerializedApiCall
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Litmus extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Litmus', 'litmus', 'kusama', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput): Extrinsic | TSerializedApiCall {
    // Multiple asset options needs addressing
    return XTokensTransferImpl.transferXTokens(input, 'SelfReserve')
  }
}

export default Litmus
