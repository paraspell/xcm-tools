// Contains detailed structure of XCM call construction for Karura Parachain

import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type Extrinsic,
  type TSerializedApiCall
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Karura extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Karura', 'karura', 'kusama', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput): Extrinsic | TSerializedApiCall {
    const { currency, currencyID } = input
    const currencySelection =
      currencyID !== undefined ? { ForeignAsset: currencyID } : { Token: currency }
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }
}

export default Karura
