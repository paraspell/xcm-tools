// Contains detailed structure of XCM call construction for Bifrost Parachain on Kusama

import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type Extrinsic,
  type TSerializedApiCall
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class BifrostKusama extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('BifrostKusama', 'bifrost', 'kusama', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput): Extrinsic | TSerializedApiCall {
    // Multiple asset options need addressing
    const currencySelection = { Native: input.currency }
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }
}

export default BifrostKusama
