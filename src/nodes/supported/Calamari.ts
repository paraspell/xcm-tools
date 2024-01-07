// Contains detailed structure of XCM call construction for Calamari Parachain

import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type Extrinsic,
  type TSerializedApiCall
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Calamari extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Calamari', 'calamari', 'kusama', Version.V1)
  }

  transferXTokens(input: XTokensTransferInput): Extrinsic | TSerializedApiCall {
    // Currently only option for XCM transfer
    const { currencyID } = input
    return XTokensTransferImpl.transferXTokens(input, { MantaCurrency: currencyID })
  }
}

export default Calamari
