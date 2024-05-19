// Contains detailed structure of XCM call construction for Curio Parachain

import {
  Version,
  type Extrinsic,
  type IXTokensTransfer,
  type TSerializedApiCall,
  type XTokensTransferInput
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Curio extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Curio', 'curio', 'kusama', Version.V3)
  }

  private getCurrencySelection({ currency, currencyID }: XTokensTransferInput): any {
    if (currencyID) {
      return { ForeignAsset: currencyID }
    }
    return { Token: currency }
  }

  transferXTokens(input: XTokensTransferInput): Extrinsic | TSerializedApiCall {
    const currencySelection = this.getCurrencySelection(input)
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }
}

export default Curio
