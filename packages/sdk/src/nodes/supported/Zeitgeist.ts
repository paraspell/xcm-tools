// Contains detailed structure of XCM call construction for Zeitgeist Parachain

import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type Extrinsic,
  type TSerializedApiCall,
  type TForeignAsset,
  type TZeitgeistAsset
} from '../../types'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../XTokensTransferImpl'

class Zeitgeist extends ParachainNode implements IXTokensTransfer {
  constructor() {
    super('Zeitgeist', 'zeitgeist', 'polkadot', Version.V3)
  }

  transferXTokens(input: XTokensTransferInput): Extrinsic | TSerializedApiCall {
    const currencySelection: TZeitgeistAsset | TForeignAsset =
      input.currency === this.getNativeAssetSymbol() ? 'Ztg' : { ForeignAsset: input.currencyID }
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }
}

export default Zeitgeist
