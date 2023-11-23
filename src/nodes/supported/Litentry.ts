// Contains detailed structure of XCM call construction for Litentry Parachain

import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type Extrinsic,
  type TSerializedApiCall
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Litentry extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Litentry', 'litentry', 'polkadot', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput): Extrinsic | TSerializedApiCall {
    return XTokensTransferImpl.transferXTokens(input, 'SelfReserve')
  }
}

export default Litentry
