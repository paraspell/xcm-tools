// Contains detailed structure of XCM call construction for Kylin Parachain

import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type Extrinsic,
  type TSerializedApiCall
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Kylin extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Kylin', 'kylin', 'polkadot', Version.V1)
  }

  transferXTokens(input: XTokensTransferInput): Extrinsic | TSerializedApiCall {
    const { currency, fees } = input
    return XTokensTransferImpl.transferXTokens(input, currency, fees, 'OrmlXTokens')
  }
}

export default Kylin
