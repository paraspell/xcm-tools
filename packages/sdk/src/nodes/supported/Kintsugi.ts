// Contains detailed structure of XCM call construction for Kintsugi Parachain

import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type Extrinsic,
  type TSerializedApiCall,
  type TForeignOrTokenAsset
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Kintsugi extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Kintsugi', 'kintsugi', 'kusama', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput): Extrinsic | TSerializedApiCall {
    const { currency, currencyID } = input
    const currencySelection: TForeignOrTokenAsset =
      currencyID !== undefined ? { ForeignAsset: currencyID } : { Token: currency }
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }
}

export default Kintsugi
