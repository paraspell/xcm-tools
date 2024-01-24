// Contains detailed structure of XCM call construction for Manta Parachain

import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type Extrinsic,
  type TSerializedApiCall
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Manta extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Manta', 'manta', 'polkadot', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput): Extrinsic | TSerializedApiCall {
    return XTokensTransferImpl.transferXTokens(input, { MantaCurrency: input.currencyID })
  }
}

export default Manta
