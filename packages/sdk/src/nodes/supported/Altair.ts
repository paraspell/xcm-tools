// Contains detailed structure of XCM call construction for Altair Parachain

import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type Extrinsic,
  type TSerializedApiCall
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Altair extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Altair', 'altair', 'kusama', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput): Extrinsic | TSerializedApiCall {
    const { currency, currencyID } = input
    const currencySelection =
      currency === this.getNativeAssetSymbol() ? 'Native' : { ForeignAsset: currencyID }
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }
}

export default Altair
